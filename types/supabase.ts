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
      folders: {
        Row: {
          id: string
          created_at: string
          name: string
          user_id: string
          is_default: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          user_id: string
          is_default?: boolean
        }
      }
      reports: {
        Row: {
          id: string
          created_at: string
          title: string
          summary: string | null
          transcript: string | null
          report_url: string | null
          folder_id: string
          user_id: string
          status: string
          duration?: number
          location?: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          summary?: string | null
          transcript?: string | null
          report_url?: string | null
          folder_id: string
          user_id: string
          status?: string
          duration?: number
          location?: string
        }
      }
      transcriptions: {
        Row: {
          id: string
          created_at: string
          text: string
          languageCode: string
          languageLabel: string
          correctedFrom?: string | null
          chunkCount?: number
        }
        Insert: {
          id?: string
          created_at?: string
          text: string
          languageCode: string
          languageLabel: string
          correctedFrom?: string | null
          chunkCount?: number
        }
      }
    }
  }
}
