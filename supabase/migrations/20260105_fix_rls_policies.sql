-- Fix RLS policies for reports table
-- This migration adds missing DELETE and UPDATE policies

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.reports;

-- Allow users to delete their own reports
CREATE POLICY "Users can delete their own reports"
ON public.reports
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to update their own reports (needed for move to folder)
CREATE POLICY "Users can update their own reports"
ON public.reports
FOR UPDATE
USING (auth.uid() = user_id);

-- Also ensure folders have proper RLS
DROP POLICY IF EXISTS "Users can insert their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;

-- Allow users to create folders
CREATE POLICY "Users can insert their own folders"
ON public.folders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own folders
CREATE POLICY "Users can delete their own folders"
ON public.folders
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to update their own folders
CREATE POLICY "Users can update their own folders"
ON public.folders
FOR UPDATE
USING (auth.uid() = user_id);
