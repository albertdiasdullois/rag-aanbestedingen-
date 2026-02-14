import { NextRequest, NextResponse } from 'next/server'
import { searchDocuments } from '@/lib/embeddings'
import { generateChatCompletion } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { query, fileType } = await request.json()
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Geen zoekopdracht opgegeven' },
        { status: 400 }
      )
    }
    
    // Search for similar documents
    const results = await searchDocuments(
      query,
      0.5, // match threshold
      5,   // number of results
      fileType
    )
    
    if (results.length === 0) {
      return NextResponse.json({
        answer: 'Ik kon geen relevante informatie vinden in de geüploade documenten voor deze vraag.',
        sources: [],
      })
    }
    
    // Generate answer using context from search results
    const context = results.map(r => r.content)
    const answer = await generateChatCompletion(query, context)
    
    // Format sources
    const sources = results.map(r => ({
      id: r.id,
      documentId: r.document_id,
      fileName: r.file_name,
      fileType: r.file_type,
      content: r.content.substring(0, 200) + '...',
      similarity: r.similarity,
      pageNumber: r.page_number,
      sheetName: r.sheet_name,
    }))
    
    return NextResponse.json({
      answer,
      sources,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Fout bij zoeken in documenten' },
      { status: 500 }
    )
  }
}
