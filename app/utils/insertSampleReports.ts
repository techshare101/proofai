import supabase from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Sample report data
const sampleReports = [
  {
    title: "Facility Walkthrough - June",
    summary: "Routine check of critical systems and safety compliance. Highlighted issues with HVAC system that need attention in the west wing.",
    folderName: "Facilities",
    author: "Nelson, Justin",
    status: "Reviewed"
  },
  {
    title: "Lab Equipment Calibration",
    summary: "Quarterly calibration of lab equipment. All instruments within acceptable parameters except spectrometer #3 which requires recalibration.",
    folderName: "Labs",
    author: "Chen, Amy",
    status: "Pending Review"
  },
  {
    title: "Elevator Maintenance Report",
    summary: "Annual maintenance check of building elevators. Issues found with elevator #2 emergency phone system, repair scheduled for next week.",
    folderName: "Maintenance",
    author: "Rodriguez, Carlos",
    status: "Completed"
  },
  {
    title: "Fire Alarm System Test",
    summary: "Monthly test of building fire alarm system. All systems operational, but battery backups in zones 3-5 need replacement within 30 days.",
    folderName: "Safety",
    author: "Patel, Priya",
    status: "Urgent"
  },
  {
    title: "HVAC Efficiency Analysis",
    summary: "Analysis of HVAC system efficiency across all buildings. Energy consumption 12% above expected levels, recommendations included for optimization.",
    folderName: "Facilities",
    author: "Nelson, Justin",
    status: "In Progress"
  }
];

/**
 * Creates folders in the database if they don't exist
 * @param userId - The user ID to associate the folders with
 * @returns Object mapping folder names to folder IDs
 */
async function createFolders(userId: string) {
  const folderNames = ["Facilities", "Labs", "Maintenance", "Safety"];
  const folderMap: Record<string, string> = {};
  
  for (const name of folderNames) {
    // Check if folder already exists for this user
    const { data: existingFolder } = await supabase
      .from('folders')
      .select('id, name')
      .eq('user_id', userId)
      .eq('name', name)
      .single();
      
    if (existingFolder) {
      folderMap[name] = existingFolder.id;
    } else {
      // Create new folder
      const { data: newFolder, error } = await supabase
        .from('folders')
        .insert({
          id: uuidv4(),
          name,
          user_id: userId,
        })
        .select();
        
      if (error) {
        console.error(`Failed to create folder ${name}:`, error);
        continue;
      }
      
      if (newFolder && newFolder.length > 0) {
        folderMap[name] = newFolder[0].id;
      }
    }
  }
  
  return folderMap;
}

/**
 * Creates sample PDF URLs for demonstration purposes
 * In a real app, these would be actual URLs to stored PDFs
 */
function generateSamplePdfUrl() {
  // Using placeholder URLs for demo purposes
  const sampleUrls = [
    'https://sample-pdfs.proofai.app/sample-report-1.pdf',
    'https://sample-pdfs.proofai.app/sample-report-2.pdf',
    'https://sample-pdfs.proofai.app/sample-report-3.pdf',
  ];
  
  return sampleUrls[Math.floor(Math.random() * sampleUrls.length)];
}

/**
 * Inserts sample reports with proper folders
 * @param userId - The user ID to associate the reports with
 * @returns Array of created report IDs
 */
export async function insertSampleReports(userId: string) {
  if (!userId) {
    console.error('No user ID provided for sample reports');
    return [];
  }
  
  // First create/get folders
  const folderMap = await createFolders(userId);
  
  // Now insert reports with references to these folders
  const createdReportIds = [];
  
  for (const report of sampleReports) {
    const folderId = folderMap[report.folderName];
    
    if (!folderId) {
      console.error(`Could not find folder ID for ${report.folderName}`);
      continue;
    }
    
    const { data, error } = await supabase
      .from('reports')
      .insert({
        id: uuidv4(),
        title: report.title,
        summary: report.summary,
        folder_id: folderId,
        user_id: userId,
        pdf_url: generateSamplePdfUrl(),
        created_at: new Date().toISOString(),
        // Additional fields as needed
        author: report.author,
        status: report.status
      })
      .select();
      
    if (error) {
      console.error(`Failed to insert report ${report.title}:`, error);
      continue;
    }
    
    if (data && data.length > 0) {
      createdReportIds.push(data[0].id);
    }
  }
  
  return createdReportIds;
}
