import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20250722_setup_stripe_tables.sql'
    );
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      console.log('Executing:', statement.split('\n')[0], '...');
      const { error } = await supabase.rpc('pgmigrate', { query: statement });
      
      if (error) {
        // Skip duplicate object errors (e.g., if the table already exists)
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key value violates unique constraint')) {
          console.log('  - Skipped (already exists)');
          continue;
        }
        throw error;
      }
      
      console.log('  - Success');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

runMigration();
