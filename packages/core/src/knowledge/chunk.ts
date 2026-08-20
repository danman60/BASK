/**
 * Text chunking for knowledge ingestion.
 *
 * Ported from the StudioSage implementation, which has been in production
 * against ~30 paying tenants. The 1200/150 numbers and the paragraph-then-
 * sentence boundary order are load-bearing: retrieval quality was tuned around
 * them. Do not adjust them without re-tuning the similarity threshold too.
 */

export const CHUNK_TARGET = 1200
export const CHUNK_OVERLAP = 150
export const DEFAULT_MAX_CHUNKS = Infinity

export type ChunkResult = { chunks: string[]; capped: boolean }

export function chunkText(text: string, maxChunks: number = DEFAULT_MAX_CHUNKS): ChunkResult {
  // Step 1: Normalize
  text = text.replace(/\r\n/g, '\n').trim()
  if (text === '') {
    return { chunks: [], capped: false }
  }

  // Step 2: Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p !== '')

  // Step 3: Build units
  const units: string[] = []
  for (const paragraph of paragraphs) {
    if (paragraph.length <= CHUNK_TARGET) {
      units.push(paragraph)
    } else {
      // Split on sentence boundaries
      const sentences = paragraph.match(/[^.!?\n]+[.!?]*\s*/g)
      if (!sentences || sentences.length === 0) {
        units.push(paragraph)
      } else {
        let currentUnit = ''
        for (const sentence of sentences) {
          if (currentUnit.length + sentence.length <= CHUNK_TARGET) {
            currentUnit += sentence
          } else {
            if (currentUnit !== '') {
              units.push(currentUnit)
            }
            currentUnit = sentence
          }
        }
        if (currentUnit !== '') {
          units.push(currentUnit)
        }
      }
    }
  }

  // Step 4: Greedily pack units into chunks
  const chunks: string[] = []
  let currentChunk = ''

  for (const unit of units) {
    if (currentChunk === '') {
      currentChunk = unit
    } else {
      const potentialChunk = currentChunk + '\n\n' + unit
      if (potentialChunk.length <= CHUNK_TARGET) {
        currentChunk = potentialChunk
      } else {
        // Add the current chunk to results
        chunks.push(currentChunk)
        
        // Start new chunk with overlap from previous chunk and the current unit
        const overlap = currentChunk.slice(-CHUNK_OVERLAP)
        currentChunk = overlap + '\n' + unit
      }
    }
  }

  // Step 5: Push remaining chunk and trim
  if (currentChunk !== '') {
    chunks.push(currentChunk.trim())
  }

  // Step 6: Handle maxChunks
  if (chunks.length > maxChunks) {
    return { chunks: chunks.slice(0, maxChunks), capped: true }
  } else {
    return { chunks, capped: false }
  }
}

/**
 * Deliberate rough approximation used only for batching, never for billing.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}