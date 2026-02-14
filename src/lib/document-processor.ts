import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

export interface ProcessedChunk {
  content: string
  chunkIndex: number
  pageNumber?: number
  sheetName?: string
  metadata?: Record<string, any>
}

/**
 * Process PDF file and extract text
 */
export async function processPDF(buffer: Buffer): Promise<ProcessedChunk[]> {
  try {
    const data = await pdf(buffer)
    const chunks: ProcessedChunk[] = []
    
    // Split text into chunks of ~1000 characters
    const text = data.text
    const chunkSize = 1000
    const overlap = 200
    
    let index = 0
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunk = text.slice(i, i + chunkSize)
      if (chunk.trim().length > 50) { // Skip very small chunks
        chunks.push({
          content: chunk.trim(),
          chunkIndex: index++,
          metadata: {
            totalPages: data.numpages,
          }
        })
      }
    }
    
    return chunks
  } catch (error) {
    console.error('Error processing PDF:', error)
    throw new Error('Kon PDF niet verwerken')
  }
}

/**
 * Process Word (DOCX) file and extract text
 */
export async function processWord(buffer: Buffer): Promise<ProcessedChunk[]> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value
    const chunks: ProcessedChunk[] = []
    
    // Split text into chunks
    const chunkSize = 1000
    const overlap = 200
    
    let index = 0
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunk = text.slice(i, i + chunkSize)
      if (chunk.trim().length > 50) {
        chunks.push({
          content: chunk.trim(),
          chunkIndex: index++,
        })
      }
    }
    
    return chunks
  } catch (error) {
    console.error('Error processing Word:', error)
    throw new Error('Kon Word document niet verwerken')
  }
}

/**
 * Process Excel (XLSX) file and extract text
 */
export async function processExcel(buffer: Buffer): Promise<ProcessedChunk[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const chunks: ProcessedChunk[] = []
    let chunkIndex = 0
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      
      // Convert sheet to CSV for better text extraction
      const csvData = XLSX.utils.sheet_to_csv(sheet)
      
      if (csvData.trim().length > 50) {
        // Split large sheets into chunks
        const chunkSize = 1000
        const overlap = 200
        
        for (let i = 0; i < csvData.length; i += chunkSize - overlap) {
          const chunk = csvData.slice(i, i + chunkSize)
          if (chunk.trim().length > 50) {
            chunks.push({
              content: chunk.trim(),
              chunkIndex: chunkIndex++,
              sheetName: sheetName,
            })
          }
        }
      }
    }
    
    return chunks
  } catch (error) {
    console.error('Error processing Excel:', error)
    throw new Error('Kon Excel bestand niet verwerken')
  }
}

/**
 * Process document based on file type
 */
export async function processDocument(
  buffer: Buffer,
  fileType: 'pdf' | 'docx' | 'xlsx'
): Promise<ProcessedChunk[]> {
  switch (fileType) {
    case 'pdf':
      return processPDF(buffer)
    case 'docx':
      return processWord(buffer)
    case 'xlsx':
      return processExcel(buffer)
    default:
      throw new Error(`Niet ondersteund bestandstype: ${fileType}`)
  }
}

/**
 * Get file type from filename
 */
export function getFileType(filename: string): 'pdf' | 'docx' | 'xlsx' | null {
  const ext = filename.toLowerCase().split('.').pop()
  
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx' || ext === 'doc') return 'docx'
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  
  return null
}
