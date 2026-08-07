-- Daybreak briefs (M0 step 6).
--
-- Pre-generated morning briefs so the Today surface never waits on a model
-- (IMPLEMENTATION_SPEC §0.1). `prompt_hash` is the cache key: a pipeline rerun
-- whose underlying facts have not changed serves the stored row with no API
-- call at all, which is what makes the demo airplane-mode tolerant.
--
-- Hand-authored rather than generated: `prisma migrate diff --from-migrations`
-- requires a shadow database this project does not have. Every statement is
-- explicitly qualified to "bask", and `pnpm db:check` enforces that.

-- CreateTable
CREATE TABLE "bask"."daybreak_brief" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "for_date" DATE NOT NULL,
    "prompt_hash" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'fallback',
    "model" TEXT,
    "brief" JSONB NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "daybreak_brief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daybreak_brief_salon_id_for_date_idx" ON "bask"."daybreak_brief"("salon_id", "for_date");

-- CreateIndex
CREATE UNIQUE INDEX "daybreak_brief_salon_id_for_date_key" ON "bask"."daybreak_brief"("salon_id", "for_date");

-- AddForeignKey
ALTER TABLE "bask"."daybreak_brief" ADD CONSTRAINT "daybreak_brief_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS, matching the tenant-scoped pattern every other salon-scoped table uses.
ALTER TABLE "bask"."daybreak_brief" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daybreak_brief_salon_isolation" ON "bask"."daybreak_brief"
    USING ("salon_id" = "bask".current_salon_id());
