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

async function applyMigrations() {
  try {
    console.log('Starting to apply migrations...');
    
    // Get list of migration files in order
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to ensure correct order
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Create migrations table if it doesn't exist
    await supabase.rpc('pgmigrate', { 
      query: `
        CREATE TABLE IF NOT EXISTS _migrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });
    
    // Get already applied migrations
    const { data: appliedMigrations, error: fetchError } = await supabase
      .from('_migrations')
      .select('name');
      
    if (fetchError) throw fetchError;
    
    const appliedMigrationNames = new Set(appliedMigrations?.map(m => m.name) || []);
    
    // Apply each migration that hasn't been applied yet
    for (const fileName of migrationFiles) {
      if (appliedMigrationNames.has(fileName)) {
        console.log(`✓ ${fileName} (already applied)`);
        continue;
      }
      
      console.log(`Applying ${fileName}...`);
      
      const filePath = path.join(migrationsDir, fileName);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the migration
      const { error } = await supabase.rpc('pgmigrate', { query: sql });
      
      if (error) {
        console.error(`Error applying ${fileName}:`, error);
        throw error;
      }
      
      // Record the migration as applied
      const { error: recordError } = await supabase
        .from('_migrations')
        .insert([{ name: fileName }]);
        
      if (recordError) throw recordError;
      
      console.log(`✓ ${fileName} (applied successfully)`);
    }
    
    console.log('All migrations applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

applyMigrations();
