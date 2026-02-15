import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '@/lib/openai'
import pdf from 'pdf-parse'

// OPTIMIZED CHUNK SETTINGS - Reduces API calls by 66%!
const CHUNK_SIZE = 3000  // Increased from 1000
const CHUNK_OVERLAP = 150  // Reduced from 200

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Geen bestand gevonden' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ongeldig bestandstype. Alleen PDF en DOCX worden ondersteund.' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Fout bij uploaden van bestand' },
        { status: 500 }
      )
    }

    // Create document record
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: file.name.replace(/\.[^/.]+$/, ''),
        file_name: file.name,
        file_type: file.type,
        file_path: uploadData.path,
        file_size: file.size,
        processed: false
      })
      .select()
      .single()

    if (documentError) {
      console.error('Error creating document record:', documentError)
      return NextResponse.json(
        { error: 'Fout bij aanmaken van document record' },
        { status: 500 }
      )
    }

    // Process document asynchronously
    processDocument(documentData.id, file).catch(error => {
      console.error('Error processing document:', error)
    })

    return NextResponse.json({
      success: true,
      document: documentData
    })

  } catch (error) {
    console.error('Error in upload route:', error)
    return NextResponse.json(
      { error: 'Onverwachte fout opgetreden' },
      { status: 500 }
    )
  }
}

async function processDocument(documentId: string, file: File) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const data = await pdf(buffer)
    const text = data.text

    // Split into chunks with OPTIMIZED settings
    const chunks = splitIntoChunks(text, CHUNK_SIZE, CHUNK_OVERLAP)
    
    console.log(`Processing ${chunks.length} chunks for document ${documentId}`)

    // Generate embeddings and store chunks
    const chunkRecords = await Promise.all(
      chunks.map(async (chunk, index) => {
        try {
          const embedding = await generateEmbedding(chunk)
          
          return {
            document_id: documentId,
            content: chunk,
            embedding: embedding,
            chunk_index: index,
            metadata: {
              chunk_size: chunk.length,
              total_chunks: chunks.length
            }
          }
        } catch (error) {
          console.error(`Error generating embedding for chunk ${index}:`, error)
          throw error
        }
      })
    )

    // Store all chunks with embeddings
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunkRecords)

    if (chunksError) {
      console.error('Error storing chunks with embeddings:', chunksError)
      throw chunksError
    }

    // Mark document as processed
    const { error: updateError } = await supabase
      .from('documents')
      .update({ processed: true })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document status:', updateError)
      throw updateError
    }

    console.log(`Successfully processed document ${documentId}`)

  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error)
    
    // Mark document as failed
    await supabase
      .from('documents')
      .update({ 
        processed: false,
        metadata: { error: String(error) }
      })
      .eq('id', documentId)
  }
}

function splitIntoChunks(
  text: string, 
  chunkSize: number, 
  overlap: number
): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end)
    
    // Only add non-empty chunks
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim())
    }
    
    // Move to next chunk with overlap
    start += chunkSize - overlap
  }

  return chunks
}
