-- Retrieval over the DISTILLED CLAIMS, not the raw transcript chunks.
-- Decision + evidence: docs/plans/2026-08-29-rag-wiring.md §0.
--
-- `bask.knowledge_chunk` and `bask.match_knowledge` (migration 20260820000000)
-- are untouched and still correct. They index 400-word slabs of spoken
-- transcript. This adds a second, parallel index over `bask.knowledge_claim` —
-- 1,007 one-sentence directives, each carrying the verbatim quote it came from,
-- a category, a moment, and a review state. The claim is what a salon owner can
-- actually read, so the claim is what the product cites.
--
-- Hand-written, like the knowledge_claim migration itself: `prisma migrate diff`
-- needs a shadow database this project does not configure, and pgvector columns
-- are not expressible as a native Prisma type.

-- The column. IF NOT EXISTS so a partial apply can be re-run.
ALTER TABLE "bask"."knowledge_claim"
  ADD COLUMN IF NOT EXISTS "embedding" public.vector(1536);

-- No ivfflat or hnsw index, deliberately — the same reasoning the knowledge_base
-- migration wrote down. 1,007 rows is a single-digit-millisecond sequential scan,
-- and an index tuned against a row count this small would have to be rebuilt the
-- moment the corpus grows. Add one when the table is large, against real numbers.

-- CreateFunction
CREATE OR REPLACE FUNCTION "bask"."match_claims"(
    query_embedding public.vector(1536),
    match_count int,
    match_threshold double precision,
    filter_corpus text,
    filter_lens text
)
RETURNS TABLE(
    claim_id uuid,
    claim text,
    quote text,
    category text,
    moment text,
    specificity text,
    lens text,
    review_state text,
    t_start double precision,
    times_said int,
    similarity double precision
)
LANGUAGE sql STABLE
AS $function$
    SELECT
        knowledge_claim.id AS claim_id,
        knowledge_claim.claim,
        knowledge_claim.quote,
        knowledge_claim.category,
        knowledge_claim.moment,
        knowledge_claim.specificity,
        knowledge_claim.lens,
        knowledge_claim.review_state,
        knowledge_claim.t_start,
        knowledge_claim.times_said,
        1 - (knowledge_claim.embedding OPERATOR(public.<=>) query_embedding) AS similarity
    FROM "bask"."knowledge_claim"
    WHERE knowledge_claim.embedding IS NOT NULL
    -- The review queue finally gates something. A human who rejected a claim has
    -- said it must not be taught; this is where that decision takes effect.
    -- Only 'rejected' is excluded — 'unreviewed' still retrieves, and the UI says
    -- so on the citation rather than pretending review is complete.
    AND knowledge_claim.review_state <> 'rejected'
    AND (filter_corpus IS NULL OR knowledge_claim.corpus = filter_corpus)
    AND (filter_lens IS NULL OR knowledge_claim.lens = filter_lens)
    AND 1 - (knowledge_claim.embedding OPERATOR(public.<=>) query_embedding) >= match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
$function$;

-- `OPERATOR(public.<=>)` rather than a bare `<=>`: pgvector's operator lives in
-- `public`, and this migration's search_path does not include it. Writing it bare
-- is what made migration 20260820000000 fail on its first apply and block every
-- migration behind it.
--
-- The threshold is LOW on purpose and gets LOWER here, not higher. A 400-word
-- chunk that is exactly right scores ~0.44; a one-sentence claim is shorter still,
-- so it scores lower again for the same relevance. Raising this threshold is how
-- retrieval breaks, not how it improves. See packages/core/src/knowledge/retrieve.ts.
