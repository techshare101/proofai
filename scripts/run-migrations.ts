import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

// Get database connection details from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await createMigrationsTable();
    
    // Get list of migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to ensure correct order
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Run each migration
    for (const file of migrationFiles) {
      const migrationName = path.basename(file, '.sql');
      
      // Check if migration has already been run
      const { data: existingMigration } = await supabase
        .from('_migrations')
        .select('name')
        .eq('name', migrationName)
        .maybeSingle();
      
      if (existingMigration) {
        console.log(`Skipping already applied migration: ${migrationName}`);
        continue;
      }
      
      console.log(`Applying migration: ${migrationsDir}${file}`);
      
      // Read and execute the migration SQL
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const { error } = await supabase.rpc('pg_query', { query: sql });
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error);
        process.exit(1);
      }
      
      // Record the migration
      await supabase
        .from('_migrations')
        .insert([{ name: migrationName }]);
      
      console.log(`Successfully applied migration: ${migrationName}`);
    }
    
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

async function createMigrationsTable() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS public._migrations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  const { error } = await supabase.rpc('pg_query', { query: createTableSql });
  
  if (error && !error.message.includes('already exists')) {
    console.error('Error creating migrations table:', error);
    throw error;
  }
}

// Run the migrations
runMigrations();
