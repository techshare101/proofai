import { createClient } from '@supabase/supabase-js';
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

async function initMigrationsTable() {
  console.log('Initializing migrations table...');
  
  // Create migrations table if it doesn't exist
  const { error: createTableError } = await supabase.rpc('pg_extension', { name: 'pgcrypto' }).then(() => 
    supabase.rpc('create_migrations_table')
  );

  if (createTableError) {
    console.error('Error creating migrations table:', createTableError);
    process.exit(1);
  }

  console.log('Migrations table initialized successfully');
  process.exit(0);
}

initMigrationsTable().catch(err => {
  console.error('Error initializing migrations:', err);
  process.exit(1);
});
