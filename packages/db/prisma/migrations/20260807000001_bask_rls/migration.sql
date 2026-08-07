-- Row Level Security for the `bask` schema on the SHARED CC&SS Supabase project.
--
-- M0 runs a single seeded demo tenant behind the service role (which carries
-- BYPASSRLS), so these policies are not yet load-bearing. They are written now
-- because retrofitting tenancy is the classic trap (IMPLEMENTATION_SPEC §1.2):
-- the schema pays the cost at creation time, auth hardening lands in M3.
--
-- Scoping model: the request's salon is carried in the `app.salon_id` session
-- GUC, set by the tRPC context (M0 step 3) on the connection handling the
-- request. `bask.current_salon_id()` reads it and returns NULL when unset, so an
-- unscoped connection sees nothing rather than everything.
--
-- Tables deliberately WITHOUT RLS (global reference / demo-harness data, no
-- tenant rows): room_type, segment, playbook, uvalux_catalog_item, demo_state.

-- ---------------------------------------------------------------------------
-- Scope helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "bask".current_salon_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SET search_path = ''
AS $$
  SELECT NULLIF(current_setting('app.salon_id', true), '')::uuid;
$$;

COMMENT ON FUNCTION "bask".current_salon_id() IS
  'Salon scope for RLS, read from the app.salon_id session GUC. NULL when unset.';

-- ---------------------------------------------------------------------------
-- Tenant root: a salon sees only itself; an org only orgs owning a visible salon
-- ---------------------------------------------------------------------------

ALTER TABLE "bask"."salon" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."salon" FOR ALL
  USING ("id" = "bask".current_salon_id())
  WITH CHECK ("id" = "bask".current_salon_id());

ALTER TABLE "bask"."org" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."org" FOR ALL
  USING (EXISTS (
    SELECT 1 FROM "bask"."salon" s
    WHERE s."org_id" = "org"."id" AND s."id" = "bask".current_salon_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "bask"."salon" s
    WHERE s."org_id" = "org"."id" AND s."id" = "bask".current_salon_id()
  ));

-- ---------------------------------------------------------------------------
-- Tenant-scoped tables with a mandatory salon_id
-- ---------------------------------------------------------------------------

ALTER TABLE "bask"."account" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."account" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."activity_event" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."activity_event" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."campaign" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."campaign" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."coaching_request" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."coaching_request" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."consent_audit_entry" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."consent_audit_entry" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."consent_profile" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."consent_profile" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."contact_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."contact_log" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."customer" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."customer" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."draft_order" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."draft_order" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."equipment_device" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."equipment_device" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."gift_card" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."gift_card" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."insight" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."insight" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."inventory_level" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."inventory_level" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."membership" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."membership" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."package" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."package" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."room" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."room" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."sale" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."sale" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."sale_line" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."sale_line" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."service" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."service" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."session" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."session" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."signal_snapshot" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."signal_snapshot" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."stock_event" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."stock_event" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."visit" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."visit" FOR ALL
  USING ("salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" = "bask".current_salon_id());

-- ---------------------------------------------------------------------------
-- Tenant-scoped tables where salon_id is nullable and NULL means "global"
--   staff   — NULL salon_id is UVALUX-side (rep / leadership)
--   product — NULL salon_id is a catalogue-wide product
--   barcode — NULL salon_id follows its catalogue-wide product
-- ---------------------------------------------------------------------------

ALTER TABLE "bask"."staff" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."staff" FOR ALL
  USING ("salon_id" IS NULL OR "salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" IS NULL OR "salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."product" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."product" FOR ALL
  USING ("salon_id" IS NULL OR "salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" IS NULL OR "salon_id" = "bask".current_salon_id());

ALTER TABLE "bask"."barcode" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."barcode" FOR ALL
  USING ("salon_id" IS NULL OR "salon_id" = "bask".current_salon_id())
  WITH CHECK ("salon_id" IS NULL OR "salon_id" = "bask".current_salon_id());

-- ---------------------------------------------------------------------------
-- Child table scoped through its parent (no salon_id column of its own)
-- ---------------------------------------------------------------------------

ALTER TABLE "bask"."draft_order_line" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_isolation" ON "bask"."draft_order_line" FOR ALL
  USING (EXISTS (
    SELECT 1 FROM "bask"."draft_order" d
    WHERE d."id" = "draft_order_line"."draft_order_id"
      AND d."salon_id" = "bask".current_salon_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "bask"."draft_order" d
    WHERE d."id" = "draft_order_line"."draft_order_id"
      AND d."salon_id" = "bask".current_salon_id()
  ));
