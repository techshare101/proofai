-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create migrations table
CREATE TABLE IF NOT EXISTS public._migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to apply a migration
CREATE OR REPLACE FUNCTION public.apply_migration(migration_name TEXT, migration_sql TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  migration_exists BOOLEAN;
BEGIN
  -- Check if migration has already been applied
  SELECT EXISTS (
    SELECT 1 FROM public._migrations 
    WHERE name = migration_name
  ) INTO migration_exists;
  
  IF migration_exists THEN
    RAISE NOTICE 'Migration % already applied, skipping', migration_name;
    RETURN FALSE;
  END IF;
  
  -- Execute the migration SQL
  EXECUTE migration_sql;
  
  -- Record the migration
  INSERT INTO public._migrations (name) VALUES (migration_name);
  
  RAISE NOTICE 'Applied migration: %', migration_name;
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error applying migration %: %', migration_name, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a migration has been applied
CREATE OR REPLACE FUNCTION public.is_migration_applied(migration_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public._migrations 
    WHERE name = migration_name
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.apply_migration(TEXT, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.is_migration_applied(TEXT) TO postgres;
