import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '@/lib/openai'
import pdf from 'pdf-parse'

// OPTIMIZED CHUNK SETTINGS
const CHUNK_SIZE = 3000
const CHUNK_OVERLAP = 150
const BATCH_SIZE = 5  // Process 5 embeddings at a time

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
    
    // READ FILE IMMEDIATELY (before async processing!)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log(`File read: ${buffer.length} bytes`)
    
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
      
      // Clean up uploaded file
      await supabase.storage
        .from('documents')
        .remove([uploadData.path])
      
      return NextResponse.json(
        { error: 'Fout bij aanmaken van document record' },
        { status: 500 }
      )
    }

    console.log(`Document created: ${documentData.id}`)

    // Process document asynchronously with BUFFER (not File object!)
    processDocument(documentData.id, buffer).catch(error => {
      console.error(`Fatal error processing document ${documentData.id}:`, error)
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

async function processDocument(documentId: string, buffer: Buffer) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // VERIFY DOCUMENT EXISTS
    const { data: docExists, error: checkError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .single()

    if (checkError || !docExists) {
      console.error(`Document ${documentId} not found in database:`, checkError)
      throw new Error(`Document ${documentId} does not exist`)
    }

    console.log(`Verified document exists: ${documentId}`)

    // Extract text from PDF using the buffer
    const data = await pdf(buffer)
    const text = data.text
    console.log(`Extracted ${text.length} characters from PDF`)

    // Split into chunks
    const chunks = splitIntoChunks(text, CHUNK_SIZE, CHUNK_OVERLAP)
    
    console.log(`Processing ${chunks.length} chunks for document ${documentId}`)

    // Process chunks in batches to avoid timeout
    const totalChunks = chunks.length
    let processedCount = 0

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)
      
      console.log(`Starting batch ${Math.floor(i / BATCH_SIZE) + 1} (chunks ${i}-${i + batch.length - 1})`)
      
      // Generate embeddings for this batch in parallel
      const batchRecords = await Promise.all(
        batch.map(async (chunk, batchIndex) => {
          try {
            const globalIndex = i + batchIndex
            const embedding = await generateEmbedding(chunk)
            
            return {
              document_id: documentId,
              content: chunk,
              embedding: embedding,
              chunk_index: globalIndex,
              metadata: {
                chunk_size: chunk.length,
                total_chunks: totalChunks
              }
            }
          } catch (error) {
            console.error(`Error generating embedding for chunk ${i + batchIndex}:`, error)
            throw error
          }
        })
      )

      console.log(`Generated ${batchRecords.length} embeddings for batch`)

      // Store this batch
      const { error: chunksError } = await supabase
        .from('document_chunks')
        .insert(batchRecords)

      if (chunksError) {
        console.error(`Error storing batch ${i}-${i + batch.length}:`, chunksError)
        throw chunksError
      }

      processedCount += batchRecords.length
      console.log(`Processed ${processedCount}/${totalChunks} chunks`)
    }

    // Mark document as processed
    console.log(`Marking document ${documentId} as processed`)
    
    const { error: updateError } = await supabase
      .from('documents')
      .update({ processed: true })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document status:', updateError)
      throw updateError
    }

    console.log(`✅ Successfully processed document ${documentId}`)

  } catch (error) {
    console.error(`❌ Error processing document ${documentId}:`, error)
    
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
    
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim())
    }
    
    start += chunkSize - overlap
  }

  return chunks
}
