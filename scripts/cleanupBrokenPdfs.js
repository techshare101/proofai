// @ts-check
/**
 * PDF Storage Cleanup Utility
 * 
 * This script helps clean up broken or invalid PDFs from Supabase storage.
 * It checks both 'reports' and 'recordings/reports' locations.
 * 
 * Usage:
 * 1. Run with Node.js: node cleanupBrokenPdfs.js
 * 2. Enter your Supabase URL and service role key when prompted
 * 3. Choose manual or automatic cleanup mode
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const https = require('https');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to check if a PDF URL is valid (returns 200 status)
async function isPdfValid(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const { statusCode } = res;
      
      // Consume response data to free up memory
      res.resume();
      
      resolve(statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  console.log('🧹 ProofAI - PDF Storage Cleanup Utility 🧹');
  console.log('-------------------------------------------');
  
  // Get Supabase credentials
  const supabaseUrl = await prompt('Enter your Supabase URL: ');
  const supabaseKey = await prompt('Enter your Supabase service role key: ');
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
  
  console.log('\nConnecting to Supabase...');
  
  // Check both storage locations
  const locations = [
    { bucket: 'reports', prefix: '' },
    { bucket: 'recordings', prefix: 'reports/' }
  ];
  
  let brokenPdfs = [];
  
  for (const location of locations) {
    console.log(`\nChecking ${location.bucket}/${location.prefix}...`);
    
    // List files in the location
    const { data, error } = await supabase
      .storage
      .from(location.bucket)
      .list(location.prefix, { limit: 100 });
      
    if (error) {
      console.error(`Error listing files in ${location.bucket}/${location.prefix}:`, error.message);
      continue;
    }
    
    // Filter to only include PDFs
    const pdfs = (data || []).filter(item => 
      item.name.endsWith('.pdf') && 
      (!location.prefix || item.name.indexOf('/') === -1)
    );
    
    console.log(`Found ${pdfs.length} PDFs`);
    
    // Check each PDF
    for (const pdf of pdfs) {
      const pdfUrl = `${supabaseUrl.replace('.supabase.co', '.supabase.co/storage/v1/object/public')}/${location.bucket}/${location.prefix}${pdf.name}`;
      
      process.stdout.write(`Checking ${pdf.name}... `);
      const isValid = await isPdfValid(pdfUrl);
      
      if (!isValid) {
        process.stdout.write('❌ BROKEN\n');
        brokenPdfs.push({ ...pdf, bucket: location.bucket, prefix: location.prefix });
      } else {
        process.stdout.write('✅ Valid\n');
      }
    }
  }
  
  // Report findings
  console.log('\n-------------------------------------------');
  console.log(`Found ${brokenPdfs.length} broken PDFs`);
  
  if (brokenPdfs.length === 0) {
    console.log('No cleanup needed! All PDFs are valid.');
    rl.close();
    return;
  }
  
  // List broken PDFs
  console.log('\nBroken PDFs:');
  brokenPdfs.forEach((pdf, index) => {
    console.log(`${index + 1}. ${pdf.bucket}/${pdf.prefix}${pdf.name}`);
  });
  
  // Ask for cleanup mode
  const cleanupMode = await prompt('\nHow would you like to proceed?\n1. Delete all broken PDFs automatically\n2. Select PDFs to delete individually\n3. Exit without deleting\nEnter option (1-3): ');
  
  if (cleanupMode === '3') {
    console.log('Exiting without changes.');
    rl.close();
    return;
  }
  
  if (cleanupMode === '1') {
    // Delete all broken PDFs
    console.log('\nDeleting all broken PDFs...');
    
    for (const pdf of brokenPdfs) {
      process.stdout.write(`Deleting ${pdf.bucket}/${pdf.prefix}${pdf.name}... `);
      
      const { error } = await supabase
        .storage
        .from(pdf.bucket)
        .remove([`${pdf.prefix}${pdf.name}`]);
        
      if (error) {
        process.stdout.write(`❌ Error: ${error.message}\n`);
      } else {
        process.stdout.write('✅ Deleted\n');
      }
    }
  } else if (cleanupMode === '2') {
    // Delete selected PDFs
    for (const pdf of brokenPdfs) {
      const shouldDelete = await prompt(`Delete ${pdf.bucket}/${pdf.prefix}${pdf.name}? (y/n): `);
      
      if (shouldDelete.toLowerCase() === 'y' || shouldDelete.toLowerCase() === 'yes') {
        process.stdout.write(`Deleting ${pdf.bucket}/${pdf.prefix}${pdf.name}... `);
        
        const { error } = await supabase
          .storage
          .from(pdf.bucket)
          .remove([`${pdf.prefix}${pdf.name}`]);
          
        if (error) {
          process.stdout.write(`❌ Error: ${error.message}\n`);
        } else {
          process.stdout.write('✅ Deleted\n');
        }
      }
    }
  }
  
  console.log('\n✨ Cleanup complete! Your Supabase storage is now clean.');
  rl.close();
}

main().catch(error => {
  console.error('An error occurred:', error);
  rl.close();
});
