import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: documents, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .order('upload_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json(
        { error: 'Fout bij ophalen van documenten' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Documents fetch error:', error)
    return NextResponse.json(
      { error: 'Onverwachte fout' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Geen document ID opgegeven' },
        { status: 400 }
      )
    }
    
    // Get document to delete file from storage
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single()
    
    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document niet gevonden' },
        { status: 404 }
      )
    }
    
    // Delete from storage
    const { error: storageError } = await supabaseAdmin
      .storage
      .from('documents')
      .remove([document.file_path])
    
    if (storageError) {
      console.error('Storage delete error:', storageError)
    }
    
    // Delete from database (cascades to chunks)
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId)
    
    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return NextResponse.json(
        { error: 'Fout bij verwijderen van document' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Onverwachte fout bij verwijderen' },
      { status: 500 }
    )
  }
}
