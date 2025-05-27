import { createClient } from '@supabase/supabase-js';

// Types for our database tables
export interface Recording {
  id: string;
  created_at: string;
  title: string;
  duration: number;
  storage_path: string;
  transcript?: string;
}

export interface Summary {
  id: string;
  recording_id: string;
  created_at: string;
  content: string;
  keywords: string[];
}

export interface Report {
  id: string;
  recording_id: string;
  summary_id: string;
  created_at: string;
  pdf_url: string;
  metadata: {
    title: string;
    generated_at: string;
    page_count: number;
  };
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  throw new Error(
    'Supabase configuration is missing. Please check your environment variables.'
  );
}

console.log('✅ Initializing Supabase client...');
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper functions for database operations
export async function saveRecording(blob: Blob, title: string): Promise<Recording | null> {
  try {
    // 1. Upload the recording file to storage
    const filename = `${Date.now()}-${title}.webm`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('recordings')
      .upload(filename, blob);

    if (storageError) throw storageError;

    // 2. Create database entry
    const { data, error: dbError } = await supabase
      .from('recordings')
      .insert({
        title,
        storage_path: storageData.path,
        duration: 0, // TODO: Calculate actual duration
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  } catch (error) {
    console.error('Error saving recording:', error);
    return null;
  }
}

export async function saveSummary(recordingId: string, content: string, keywords: string[]): Promise<Summary | null> {
  try {
    const { data, error } = await supabase
      .from('summaries')
      .insert({
        recording_id: recordingId,
        content,
        keywords,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving summary:', error);
    return null;
  }
}

export async function saveReport(recordingId: string, summaryId: string, pdfUrl: string, metadata: Report['metadata']): Promise<Report | null> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        recording_id: recordingId,
        summary_id: summaryId,
        pdf_url: pdfUrl,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving report:', error);
    return null;
  }
}

// SQL for creating tables:
/*
create table recordings (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  duration integer not null,
  storage_path text not null,
  transcript text
);

create table summaries (
  id uuid default uuid_generate_v4() primary key,
  recording_id uuid references recordings(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  keywords text[] not null
);

create table reports (
  id uuid default uuid_generate_v4() primary key,
  recording_id uuid references recordings(id) not null,
  summary_id uuid references summaries(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  pdf_url text not null,
  metadata jsonb not null
);
*/
