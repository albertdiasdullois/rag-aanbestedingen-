import { Orq } from '@orq-ai/node'

// Initialize Orq client
const ORQ_API_KEY = process.env.ORQ_API_KEY

if (!ORQ_API_KEY) {
  throw new Error('Missing ORQ_API_KEY environment variable')
}

// Initialize with explicit server URL
export const orq = new Orq({
  apiKey: ORQ_API_KEY,
  serverURL: 'https://api.orq.ai',
})

/**
 * Generate embedding for a text string using Orq.ai
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await orq.router.embeddings.create({
      model: process.env.ORQ_EMBEDDING_MODEL || 'text-embedding-3-small',
      input: text.replace(/\n/g, ' '),
    })
    
    // Type assertion to handle SDK type union
    return response.data[0].embedding as unknown as number[]
  } catch (error) {
    console.error('Error generating embedding with Orq:', error)
    throw error
  }
}

/**
 * Generate chat completion with context using Orq.ai
 */
export async function generateChatCompletion(
  query: string,
  context: string[]
): Promise<string> {
  try {
    const contextText = context.join('\n\n')
    
    const response = await orq.router.chat.completions.create({
      model: process.env.ORQ_CHAT_MODEL || 'gpt-4-turbo-preview',
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
      maxTokens: 1000,
    }) as any
    
    return response.choices[0].message.content || 'Geen antwoord gegenereerd.'
  } catch (error) {
    console.error('Error generating chat completion with Orq:', error)
    throw error
  }
}
