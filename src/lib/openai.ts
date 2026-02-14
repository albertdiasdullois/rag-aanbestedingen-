import { Orq } from '@orq-ai/node'

// Initialize Orq client
const ORQ_API_KEY = process.env.ORQ_API_KEY

if (!ORQ_API_KEY) {
  throw new Error('Missing ORQ_API_KEY environment variable')
}

export const orq = new Orq({
  apiKey: ORQ_API_KEY,
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
    
    return response.data[0].embedding
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
      max_tokens: 1000,
    })
    
    return response.choices[0].message.content || 'Geen antwoord gegenereerd.'
  } catch (error) {
    console.error('Error generating chat completion with Orq:', error)
    throw error
  }
}
```

5. **Scroll naar beneden**
   - Commit message: `Switch to Orq SDK`
   - **Commit changes**

✅ **Code updated in GitHub!**

---

## 🔑 STAP 3: Vercel Environment Variables

1. **Ga naar Vercel Dashboard**
2. **Klik op je project** "rag-aanbestedingen"
3. **Klik "Settings"** tab
4. **Klik "Environment Variables"** (in linkermenu)

### **VERWIJDER:**
```
❌ OPENAI_API_KEY
```
(Klik op de 3 puntjes ... → Delete)

### **VOEG TOE:**

Klik "+ Add New"

**Key 1:**
```
Name: ORQ_API_KEY
Value: [plak je Orq API key die je gekopieerd hebt]
Environment: Production, Preview, Development (alles aan!)
```
Klik **Save**

**Key 2 (Optioneel maar handig):**
```
Name: ORQ_EMBEDDING_MODEL
Value: text-embedding-3-small
Environment: Production, Preview, Development
```
Klik **Save**

**Key 3 (Optioneel):**
```
Name: ORQ_CHAT_MODEL
Value: gpt-4-turbo-preview
```
(of `claude-3-opus-20240229` als je Claude wilt!)
Klik **Save**

**BEHOUD deze (niet aanpassen!):**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

---

## 🚀 STAP 4: Deploy!

1. **Ga naar "Deployments"** tab
2. **Klik op de laatste deployment**
3. **Klik op 3 puntjes** (...) rechtsboven
4. **Klik "Redeploy"**
5. **Wacht 2-3 minuten** ☕

---

## 📊 STAP 5: Check de Logs

Na deployment:

1. **Klik op de nieuwe deployment**
2. **Check de logs** - je zou moeten zien:
```
   added 500+ packages  ✅
   ✓ Compiled successfully  ✅
