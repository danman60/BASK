-- 2026-08-23: this migration FAILED on first apply (2026-08-20) and blocked every
-- migration after it. Two fixes, both required to let it complete:
--   1. `<=>` is pgvector's operator and lives in `public`; the migration's
--      search_path does not include `public`, so it could not resolve. It is now
--      written as OPERATOR(public.<=>).
--   2. The failed run had already created the tables and indexes, so re-applying
--      needs IF NOT EXISTS to get past them to the function it never reached.
-- Verified safe to re-run: knowledge_doc and knowledge_chunk both held 0 rows.

-- CreateTable
CREATE TABLE IF NOT EXISTS "bask"."knowledge_doc" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "corpus" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "speaker" TEXT,
    "audience" TEXT NOT NULL,
    "title_confidence" TEXT NOT NULL DEFAULT 'interpolated',
    "start_sec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "end_sec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "words" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_doc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "knowledge_doc_corpus_idx" ON "bask"."knowledge_doc"("corpus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "knowledge_doc_corpus_audience_idx" ON "bask"."knowledge_doc"("corpus", "audience");

-- CreateTable
CREATE TABLE IF NOT EXISTS "bask"."knowledge_chunk" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "doc_id" UUID NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "embedding" public.vector(1536),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunk_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "knowledge_chunk_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "bask"."knowledge_doc"("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_chunk_doc_id_ordinal_key" ON "bask"."knowledge_chunk"("doc_id", "ordinal");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "knowledge_chunk_doc_id_idx" ON "bask"."knowledge_chunk"("doc_id");

-- This migration does not create an ivfflat or hnsw index on the embedding column.
-- Those need tuning against real row counts and a populated table, and adding one here would be guessing.

-- CreateFunction
CREATE OR REPLACE FUNCTION "bask"."match_knowledge"(
    query_embedding public.vector(1536),
    match_count int,
    match_threshold double precision,
    filter_corpus text
)
RETURNS TABLE(
    chunk_id uuid,
    doc_id uuid,
    text text,
    title text,
    speaker text,
    title_confidence text,
    start_sec double precision,
    similarity double precision
)
LANGUAGE sql STABLE
AS $function$
    SELECT
        knowledge_chunk.id AS chunk_id,
        knowledge_chunk.doc_id,
        knowledge_chunk.text,
        knowledge_doc.title,
        knowledge_doc.speaker,
        knowledge_doc.title_confidence,
        knowledge_doc.start_sec,
        1 - (knowledge_chunk.embedding OPERATOR(public.<=>) query_embedding) AS similarity
    FROM "bask"."knowledge_chunk"
    JOIN "bask"."knowledge_doc" ON knowledge_chunk.doc_id = knowledge_doc.id
    WHERE knowledge_chunk.embedding IS NOT NULL
    AND (filter_corpus IS NULL OR knowledge_doc.corpus = filter_corpus)
    AND 1 - (knowledge_chunk.embedding OPERATOR(public.<=>) query_embedding) >= match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
$function$;

-- Note: thresholds for this kind of retrieval are intentionally low.
-- Short passages score around 0.44 similarity even when they are the right answer,
-- so raising the threshold is how retrieval breaks rather than how it improves.