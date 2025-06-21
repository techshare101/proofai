-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Add unique constraint to prevent duplicate folder names for the same user
  CONSTRAINT unique_user_folder UNIQUE (user_id, name)
);

-- Add RLS (Row Level Security) to folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Policies for folders
CREATE POLICY "Users can view their own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  pdf_url TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  folder UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Index for faster lookups by user_id and folder
  CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Add RLS to reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies for reports
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON reports
  FOR DELETE USING (auth.uid() = user_id);

-- Add default folders for each user when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default folders for the new user
  INSERT INTO public.folders (user_id, name) VALUES
    (NEW.id, 'My Reports'),
    (NEW.id, 'Shared'),
    (NEW.id, 'Archived');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
