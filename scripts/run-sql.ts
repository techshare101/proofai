import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

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

async function runSqlFile(filePath: string) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running SQL from ${filePath}...`);
    
    // Split the SQL file into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      const { error } = await supabase.rpc('pg_query', { query: statement });
      
      if (error) {
        // If the error is about the function not existing, try with the old method
        if (error.message.includes('function pg_query(unknown) does not exist')) {
          console.log('pg_query function not found, trying direct SQL execution...');
          const { error: directError } = await supabase.rpc('execute_sql', { sql: statement });
          
          if (directError) {
            console.error('Error executing SQL directly:', directError);
            throw directError;
          }
        } else {
          console.error('Error executing SQL:', error);
          throw error;
        }
      }
    }
    
    console.log('SQL executed successfully');
    return true;
  } catch (error) {
    console.error('Error running SQL file:', error);
    throw error;
  }
}

// Get the file path from command line arguments
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a SQL file path');
  process.exit(1);
}

const fullPath = path.isAbsolute(filePath) 
  ? filePath 
  : path.join(process.cwd(), filePath);

runSqlFile(fullPath)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
