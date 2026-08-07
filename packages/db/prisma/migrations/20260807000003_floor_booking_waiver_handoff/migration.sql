-- CreateEnum
CREATE TYPE "bask"."booking_state" AS ENUM ('booked', 'arrived', 'completed', 'cancelled', 'no_show');

-- CreateTable
CREATE TABLE "bask"."booking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "customer_id" UUID,
    "service_id" UUID,
    "room_id" UUID,
    "staff_id" UUID,
    "state" "bask"."booking_state" NOT NULL DEFAULT 'booked',
    "source" "bask"."visit_source" NOT NULL DEFAULT 'online_booking',
    "guest_name" TEXT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "minutes" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."waiver_signature" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "signed_name" TEXT NOT NULL,
    "image_data" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 0,
    "height" INTEGER NOT NULL DEFAULT 0,
    "strokes" INTEGER NOT NULL DEFAULT 0,
    "signed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waiver_signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."shift_handoff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "staff_id" UUID,
    "for_date" DATE NOT NULL,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "note" TEXT,
    "posted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shift_handoff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_salon_id_starts_at_idx" ON "bask"."booking"("salon_id", "starts_at");

-- CreateIndex
CREATE INDEX "booking_customer_id_idx" ON "bask"."booking"("customer_id");

-- CreateIndex
CREATE INDEX "waiver_signature_salon_id_signed_at_idx" ON "bask"."waiver_signature"("salon_id", "signed_at");

-- CreateIndex
CREATE INDEX "waiver_signature_customer_id_signed_at_idx" ON "bask"."waiver_signature"("customer_id", "signed_at");

-- CreateIndex
CREATE INDEX "shift_handoff_salon_id_for_date_idx" ON "bask"."shift_handoff"("salon_id", "for_date");

-- AddForeignKey
ALTER TABLE "bask"."booking" ADD CONSTRAINT "booking_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."booking" ADD CONSTRAINT "booking_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bask"."customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."booking" ADD CONSTRAINT "booking_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bask"."service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."booking" ADD CONSTRAINT "booking_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "bask"."room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."booking" ADD CONSTRAINT "booking_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."waiver_signature" ADD CONSTRAINT "waiver_signature_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."waiver_signature" ADD CONSTRAINT "waiver_signature_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bask"."customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."shift_handoff" ADD CONSTRAINT "shift_handoff_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."shift_handoff" ADD CONSTRAINT "shift_handoff_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Row Level Security, matching migration 20260807000001_bask_rls.
--
-- Every table here carries a mandatory salon_id, so they take the same
-- `salon_isolation` policy as the rest of the tenant-scoped schema: rows are
-- visible only when the request set the `app.salon_id` GUC to their salon, and
-- an unscoped connection sees nothing rather than everything.
-- ---------------------------------------------------------------------------

ALTER TABLE "bask"."booking" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."booking" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."waiver_signature" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."waiver_signature" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."shift_handoff" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."shift_handoff" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());
