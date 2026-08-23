-- Knowledge curation: machine-extracted claims + an append-only review audit.
-- Spec: docs/superpowers/specs/2026-08-22-compass-knowledge-curation-design.md
--
-- Hand-written rather than generated: `prisma migrate diff` needs a shadow
-- database this project does not configure, and two of the constraints below
-- (the non-empty-quote CHECK and the FK out to the raw-SQL knowledge_doc table)
-- are not expressible in the Prisma schema anyway.
--
-- NOT tenant-scoped. This is UVALUX's own training corpus, not salon data, so it
-- carries no salon_id and no RLS salon-isolation policy — unlike every
-- salon-facing table in this schema. It is internal-only by construction.

-- CreateTable
CREATE TABLE "bask"."knowledge_claim" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "corpus" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "moment" TEXT NOT NULL DEFAULT 'none',
    "shape" TEXT,
    "specificity" TEXT NOT NULL DEFAULT 'general',
    "is_script" BOOLEAN NOT NULL DEFAULT false,
    "source_stream" TEXT NOT NULL,
    "source_file" TEXT NOT NULL,
    "audio_stream_ix" INTEGER NOT NULL DEFAULT 0,
    "t_start" DOUBLE PRECISION NOT NULL,
    "t_end" DOUBLE PRECISION NOT NULL,
    "doc_id" UUID,
    "times_said" INTEGER NOT NULL DEFAULT 1,
    "distinct_events" INTEGER NOT NULL DEFAULT 1,
    "extracted_by" TEXT NOT NULL,
    "lens" TEXT NOT NULL DEFAULT 'advice',
    "review_state" TEXT NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "review_note" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_claim_pkey" PRIMARY KEY ("id")
);

-- A claim without a verbatim quote is not a claim. The extractor gates on this,
-- the loader gates on this, and this is the last line of defence.
ALTER TABLE "bask"."knowledge_claim"
  ADD CONSTRAINT "knowledge_claim_quote_not_empty" CHECK (length(btrim("quote")) > 0);

ALTER TABLE "bask"."knowledge_claim"
  ADD CONSTRAINT "knowledge_claim_review_state_valid"
  CHECK ("review_state" IN ('unreviewed', 'verified', 'rejected', 'needs_edit'));

-- Idempotency key for the loader: the same sentence, from the same stream, at the
-- same offset, in the same corpus, is the same claim.
CREATE UNIQUE INDEX "knowledge_claim_anchor_key" ON "bask"."knowledge_claim"("corpus", "source_stream", "t_start", "quote");

CREATE INDEX "knowledge_claim_review_state_idx" ON "bask"."knowledge_claim"("review_state");
CREATE INDEX "knowledge_claim_lens_category_idx" ON "bask"."knowledge_claim"("lens", "category");
CREATE INDEX "knowledge_claim_corpus_idx" ON "bask"."knowledge_claim"("corpus");

-- knowledge_doc is a raw-SQL (pgvector) table and not a Prisma model, so this
-- relation exists only at the database level. ON DELETE SET NULL because losing a
-- session must orphan the claim, never delete a human's verified judgement.
ALTER TABLE "bask"."knowledge_claim"
  ADD CONSTRAINT "knowledge_claim_doc_id_fkey"
  FOREIGN KEY ("doc_id") REFERENCES "bask"."knowledge_doc"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "bask"."knowledge_claim_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "claim_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_claim_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "knowledge_claim_event_claim_id_created_at_idx" ON "bask"."knowledge_claim_event"("claim_id", "created_at");

ALTER TABLE "bask"."knowledge_claim_event"
  ADD CONSTRAINT "knowledge_claim_event_claim_id_fkey"
  FOREIGN KEY ("claim_id") REFERENCES "bask"."knowledge_claim"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
