import { supabaseAdmin, SearchResult } from './supabase'
import { generateEmbedding } from './openai'

/**
 * Store document chunks with embeddings in Supabase
 */
export async function storeChunksWithEmbeddings(
  documentId: string,
  chunks: Array<{
    content: string
    chunkIndex: number
    pageNumber?: number
    sheetName?: string
    metadata?: Record<string, any>
  }>
): Promise<void> {
  try {
    for (const chunk of chunks) {
      // Generate embedding for chunk
      const embedding = await generateEmbedding(chunk.content)
      
      // Store in database
      const { error } = await supabaseAdmin
        .from('document_chunks')
        .insert({
          document_id: documentId,
          content: chunk.content,
          embedding: embedding,
          chunk_index: chunk.chunkIndex,
          page_number: chunk.pageNumber,
          sheet_name: chunk.sheetName,
          metadata: chunk.metadata || {},
        })
      
      if (error) {
        console.error('Error storing chunk:', error)
        throw error
      }
    }
  } catch (error) {
    console.error('Error storing chunks with embeddings:', error)
    throw error
  }
}

/**
 * Search for similar documents using vector similarity
 */
export async function searchDocuments(
  query: string,
  matchThreshold: number = 0.5,
  matchCount: number = 5,
  fileType?: 'pdf' | 'docx' | 'xlsx'
): Promise<SearchResult[]> {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query)
    
    // Search in Supabase
    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_file_type: fileType || null,
    })
    
    if (error) {
      console.error('Error searching documents:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Error in searchDocuments:', error)
    throw error
  }
}

/**
 * Mark document as processed
 */
export async function markDocumentAsProcessed(documentId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('documents')
    .update({ processed: true })
    .eq('id', documentId)
  
  if (error) {
    console.error('Error marking document as processed:', error)
    throw error
  }
}
