/**
 * Writes knowledge documents and their embedded chunks to the database.
 * 
 * This script reads from the uvalux26-expo.jsonl corpus file, chunks each document,
 * embeds the chunks using OpenAI's API, and writes everything to the shared production
 * database. It is gated behind EMBED_CONFIRM to prevent accidental execution.
 * 
 * Reads from: packages/db/fixtures/knowledge/uvalux26-expo.jsonl
 * Writes to: bask.knowledge_doc and bask.knowledge_chunk tables
 */
import { readFileSync } from 'fs';
import { chunkText } from '../../../core/src/knowledge/chunk';
import { db } from '../../src/index';

async function main() {
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    return;
  }

  // Check for confirmation
  if (process.env.EMBED_CONFIRM !== 'yes') {
    console.log('Dry run. Set EMBED_CONFIRM=yes to write.');
    return;
  }

  const corpusPath = '/home/danman60/projects/uvalux-platform/packages/db/fixtures/knowledge/uvalux26-expo.jsonl';
  const fileContent = readFileSync(corpusPath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim() !== '');
  
  const documents = lines.map(line => JSON.parse(line));
  
  console.log(`Processing corpus: ${documents[0]?.corpus}`);
  console.log(`Documents to process: ${documents.length}`);
  
  let totalWords = 0;
  for (const doc of documents) {
    totalWords += doc.words || 0;
  }
  console.log(`Total word count: ${totalWords}`);
  console.log('Target tables: bask.knowledge_doc, bask.knowledge_chunk');
  console.log('Starting ingestion process...');
  
  let docsWritten = 0;
  let chunksWritten = 0;
  let chunksFailed = 0;
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    try {
      // Insert document
      const insertedDoc = await db.knowledge_doc.create({
        data: {
          corpus: doc.corpus,
          source: doc.source,
          room: doc.room,
          audience: doc.audience,
          title: doc.title,
          speaker: doc.speaker,
          title_confidence: doc.titleConfidence,
          scheduled_time: doc.scheduledTime,
          start_sec: doc.startSec,
          end_sec: doc.endSec,
          words: doc.words,
          text: doc.text,
        }
      });
      
      docsWritten++;
      
      // Chunk the text
      const chunks = chunkText(doc.text);
      
      // Process chunks in batches of 64
      for (let j = 0; j < chunks.length; j += 64) {
        const batch = chunks.slice(j, j + 64);
        
        try {
          // Call OpenAI embedding API
          const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: batch
            })
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // Insert chunks with embeddings
          for (let k = 0; k < result.data.length; k++) {
            await db.knowledge_chunk.create({
              data: {
                doc_id: insertedDoc.id,
                ordinal: j + k,
                text: batch[k],
                tokens: result.data[k].embedding.length,
                embedding: result.data[k].embedding
              }
            });
            chunksWritten++;
          }
        } catch (batchError) {
          console.error(`Failed to embed batch for document ${doc.title}:`, batchError);
          chunksFailed += batch.length;
          // Continue with next batch instead of failing completely
        }
      }
      
      console.log(`${i + 1}/${documents.length} ${doc.title} — ${chunks.length} chunks`);
    } catch (error) {
      console.error(`Failed to process document ${doc.title}:`, error);
      // Continue with next document instead of failing completely
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`Documents written: ${docsWritten}`);
  console.log(`Chunks written: ${chunksWritten}`);
  console.log(`Chunks failed: ${chunksFailed}`);
}

main().catch(console.error);