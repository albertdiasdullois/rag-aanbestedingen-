import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { processDocument, getFileType } from '@/lib/document-processor'
import { storeChunksWithEmbeddings, markDocumentAsProcessed } from '@/lib/embeddings'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Geen bestand geüpload' },
        { status: 400 }
      )
    }
    
    // Validate file type
    const fileType = getFileType(file.name)
    if (!fileType) {
      return NextResponse.json(
        { error: 'Niet ondersteund bestandstype. Gebruik PDF, Word of Excel.' },
        { status: 400 }
      )
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Fout bij uploaden naar storage' },
        { status: 500 }
      )
    }
    
    // Create document record
    const { data: document, error: dbError } = await supabaseAdmin
      .from('documents')
      .insert({
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        file_name: file.name,
        file_type: fileType,
        file_path: uploadData.path,
        file_size: file.size,
        processed: false,
      })
      .select()
      .single()
    
    if (dbError || !document) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Fout bij opslaan in database' },
        { status: 500 }
      )
    }
    
    // Process document in background
    processDocumentInBackground(document.id, buffer, fileType)
    
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        file_name: document.file_name,
        file_type: document.file_type,
        status: 'processing',
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Onverwachte fout bij uploaden' },
      { status: 500 }
    )
  }
}

// Process document asynchronously
async function processDocumentInBackground(
  documentId: string,
  buffer: Buffer,
  fileType: 'pdf' | 'docx' | 'xlsx'
) {
  try {
    // Extract chunks from document
    const chunks = await processDocument(buffer, fileType)
    
    // Store chunks with embeddings
    await storeChunksWithEmbeddings(documentId, chunks)
    
    // Mark as processed
    await markDocumentAsProcessed(documentId)
    
    console.log(`Document ${documentId} successfully processed`)
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error)
  }
}
