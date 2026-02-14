import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (with service role for admin actions)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
)

// Database types
export interface Document {
  id: string
  title: string
  file_name: string
  file_type: 'pdf' | 'docx' | 'xlsx'
  file_path: string
  file_size: number
  upload_date: string
  metadata: Record<string, any>
  processed: boolean
}

export interface DocumentChunk {
  id: string
  document_id: string
  content: string
  embedding: number[]
  chunk_index: number
  page_number?: number
  sheet_name?: string
  metadata: Record<string, any>
  created_at: string
}

export interface SearchResult {
  id: string
  document_id: string
  content: string
  similarity: number
  file_name: string
  file_type: string
  page_number?: number
  sheet_name?: string
}
