import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate embedding for a text string using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' '),
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Generate chat completion with context
 */
export async function generateChatCompletion(
  query: string,
  context: string[]
): Promise<string> {
  try {
    const contextText = context.join('\n\n')
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Je bent een assistent die helpt met het beantwoorden van vragen over aanbestedingsdocumenten. 
          Gebruik alleen de gegeven context om vragen te beantwoorden. 
          Als je het antwoord niet weet op basis van de context, zeg dat dan eerlijk.
          Geef altijd antwoord in het Nederlands.`
        },
        {
          role: 'user',
          content: `Context uit documenten:\n\n${contextText}\n\nVraag: ${query}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })
    
    return response.choices[0].message.content || 'Geen antwoord gegenereerd.'
  } catch (error) {
    console.error('Error generating chat completion:', error)
    throw error
  }
}
