export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      recordings: {
        Row: {
          id: string
          created_at: string
          title: string
          duration: number
          storage_path: string
          transcript: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          duration: number
          storage_path: string
          transcript?: string | null
        }
      }
      summaries: {
        Row: {
          id: string
          recording_id: string
          created_at: string
          content: string
          keywords: string[]
        }
        Insert: {
          id?: string
          recording_id: string
          created_at?: string
          content: string
          keywords: string[]
        }
      }
      reports: {
        Row: {
          id: string
          recording_id: string
          summary_id: string
          created_at: string
          pdf_url: string
          metadata: {
            title: string
            generated_at: string
            page_count: number
          }
        }
        Insert: {
          id?: string
          recording_id: string
          summary_id: string
          created_at?: string
          pdf_url: string
          metadata: {
            title: string
            generated_at: string
            page_count: number
          }
        }
      }
    }
  }
}
