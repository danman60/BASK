-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "bask";

-- CreateEnum
CREATE TYPE "bask"."salon_status" AS ENUM ('onboarding', 'active', 'paused', 'churned');

-- CreateEnum
CREATE TYPE "bask"."room_state" AS ENUM ('ready', 'in_session', 'cleaning', 'maintenance');

-- CreateEnum
CREATE TYPE "bask"."session_state" AS ENUM ('pending', 'in_session', 'cleaning', 'completed', 'cancelled', 'faulted');

-- CreateEnum
CREATE TYPE "bask"."session_started_by" AS ENUM ('staff', 'customer', 'manual_equipment', 'system');

-- CreateEnum
CREATE TYPE "bask"."equipment_driver_type" AS ENUM ('simulated', 'tmax', 'other');

-- CreateEnum
CREATE TYPE "bask"."customer_status" AS ENUM ('active', 'lapsed', 'inactive');

-- CreateEnum
CREATE TYPE "bask"."membership_status" AS ENUM ('active', 'frozen', 'cancelled');

-- CreateEnum
CREATE TYPE "bask"."payment_state" AS ENUM ('current', 'failed', 'past_due', 'recovered');

-- CreateEnum
CREATE TYPE "bask"."package_status" AS ENUM ('active', 'expired', 'used', 'refunded');

-- CreateEnum
CREATE TYPE "bask"."visit_source" AS ENUM ('walk_in', 'appointment', 'online_booking');

-- CreateEnum
CREATE TYPE "bask"."sale_state" AS ENUM ('completed', 'voided', 'refunded');

-- CreateEnum
CREATE TYPE "bask"."tender_type" AS ENUM ('cash', 'card', 'eft', 'gift_card', 'package_credit', 'membership_included', 'comp');

-- CreateEnum
CREATE TYPE "bask"."barcode_symbology" AS ENUM ('upc_a', 'upc_e', 'ean_13', 'ean_8', 'code_128', 'qr', 'custom');

-- CreateEnum
CREATE TYPE "bask"."barcode_source" AS ENUM ('scanned', 'manual', 'printed_label', 'catalog');

-- CreateEnum
CREATE TYPE "bask"."stock_event_type" AS ENUM ('received', 'sold', 'counted', 'adjusted', 'used_in_session');

-- CreateEnum
CREATE TYPE "bask"."insight_severity" AS ENUM ('info', 'low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "bask"."insight_state" AS ENUM ('new', 'seen', 'actioned', 'dismissed');

-- CreateEnum
CREATE TYPE "bask"."campaign_state" AS ENUM ('draft', 'scheduled', 'sent', 'measured', 'cancelled');

-- CreateEnum
CREATE TYPE "bask"."gift_card_state" AS ENUM ('active', 'redeemed', 'expired', 'void');

-- CreateEnum
CREATE TYPE "bask"."staff_role" AS ENUM ('owner', 'manager', 'front_desk', 'staff', 'uvalux_rep', 'uvalux_leadership');

-- CreateEnum
CREATE TYPE "bask"."actor_type" AS ENUM ('staff', 'customer', 'system');

-- CreateEnum
CREATE TYPE "bask"."consent_tier" AS ENUM ('private', 'benchmarks', 'coaching');

-- CreateEnum
CREATE TYPE "bask"."draft_order_state" AS ENUM ('draft', 'submitted', 'acknowledged', 'fulfilled', 'cancelled');

-- CreateEnum
CREATE TYPE "bask"."account_lifecycle" AS ENUM ('prospect', 'new_opening', 'established', 'expansion', 'at_risk', 'churned');

-- CreateEnum
CREATE TYPE "bask"."coaching_request_state" AS ENUM ('open', 'acknowledged', 'in_progress', 'closed');

-- CreateEnum
CREATE TYPE "bask"."contact_channel" AS ENUM ('call', 'email', 'text', 'visit', 'other');

-- CreateTable
CREATE TABLE "bask"."org" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."salon" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "bask"."salon_status" NOT NULL DEFAULT 'active',
    "address_line1" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CA',
    "postal_code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Vancouver',
    "logo_url" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'sunset',
    "opened_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "salon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."staff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" "bask"."staff_role" NOT NULL DEFAULT 'staff',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "shift_pattern" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hired_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."room_type" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'uv',
    "default_minutes" INTEGER NOT NULL DEFAULT 12,
    "cleaning_minutes" INTEGER NOT NULL DEFAULT 5,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_type_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "bask"."room" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "room_type_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" "bask"."room_state" NOT NULL DEFAULT 'ready',
    "maintenance_note" TEXT,
    "cleaning_minutes" INTEGER NOT NULL DEFAULT 5,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."equipment_device" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "driver_type" "bask"."equipment_driver_type" NOT NULL DEFAULT 'simulated',
    "address" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'idle',
    "last_seen_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "equipment_device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."service" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'uv',
    "room_type_key" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "customer_id" UUID,
    "service_id" UUID,
    "visit_id" UUID,
    "started_by_staff_id" UUID,
    "started_by" "bask"."session_started_by" NOT NULL DEFAULT 'staff',
    "state" "bask"."session_state" NOT NULL DEFAULT 'pending',
    "requested_minutes" INTEGER NOT NULL,
    "equipment_minutes" INTEGER,
    "delay_minutes" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "cleaning_ends_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."customer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "birth_date" DATE,
    "photo_url" TEXT,
    "skin_type" TEXT,
    "status" "bask"."customer_status" NOT NULL DEFAULT 'active',
    "email_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "sms_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "photo_consent" BOOLEAN NOT NULL DEFAULT false,
    "marketing_consent_at" TIMESTAMPTZ(6),
    "waiver_signed_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_visit_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."membership" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "tier" TEXT NOT NULL,
    "status" "bask"."membership_status" NOT NULL DEFAULT 'active',
    "payment_state" "bask"."payment_state" NOT NULL DEFAULT 'current',
    "monthly_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "billing_day_of_month" INTEGER NOT NULL DEFAULT 1,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_billing_at" TIMESTAMPTZ(6),
    "last_payment_at" TIMESTAMPTZ(6),
    "failed_payment_count" INTEGER NOT NULL DEFAULT 0,
    "frozen_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."package" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "service_id" UUID,
    "name" TEXT NOT NULL,
    "credits_total" INTEGER NOT NULL,
    "credits_remaining" INTEGER NOT NULL,
    "status" "bask"."package_status" NOT NULL DEFAULT 'active',
    "price_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "purchased_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."visit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "staff_id" UUID,
    "source" "bask"."visit_source" NOT NULL DEFAULT 'walk_in',
    "checked_in_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_out_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."sale" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "visit_id" UUID,
    "customer_id" UUID,
    "staff_id" UUID,
    "state" "bask"."sale_state" NOT NULL DEFAULT 'completed',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sold_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voided_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."sale_line" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "customer_id" UUID,
    "product_id" UUID,
    "service_id" UUID,
    "gift_card_id" UUID,
    "staff_id" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tender_type" "bask"."tender_type" NOT NULL DEFAULT 'card',
    "sold_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."uvalux_catalog_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_sku" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "size" TEXT,
    "upc" TEXT,
    "wholesale_price" DECIMAL(10,2),
    "msrp" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "uvalux_catalog_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "size" TEXT,
    "retail_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "wholesale_cost" DECIMAL(10,2),
    "uvalux_catalog_item_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."barcode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID,
    "product_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "symbology" "bask"."barcode_symbology" NOT NULL DEFAULT 'upc_a',
    "source" "bask"."barcode_source" NOT NULL DEFAULT 'scanned',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barcode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."inventory_level" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "on_hand" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER NOT NULL DEFAULT 0,
    "par_level" INTEGER,
    "last_counted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."stock_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "type" "bask"."stock_event_type" NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "quantity_after" INTEGER,
    "unit_cost" DECIMAL(10,2),
    "staff_id" UUID,
    "session_id" UUID,
    "sale_line_id" UUID,
    "note" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."insight" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "severity" "bask"."insight_severity" NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "impact_estimate" DECIMAL(10,2),
    "impact_currency" TEXT NOT NULL DEFAULT 'CAD',
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "state" "bask"."insight_state" NOT NULL DEFAULT 'new',
    "dismiss_reason" TEXT,
    "linked_action_type" TEXT,
    "linked_action_ref" JSONB,
    "outcome" JSONB,
    "for_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen_at" TIMESTAMPTZ(6),
    "actioned_at" TIMESTAMPTZ(6),
    "dismissed_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."segment" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "segment_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "bask"."campaign" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "segment_key" TEXT,
    "segment_snapshot" JSONB NOT NULL DEFAULT '{}',
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content" JSONB NOT NULL DEFAULT '{}',
    "state" "bask"."campaign_state" NOT NULL DEFAULT 'draft',
    "scheduled_for" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "measured_at" TIMESTAMPTZ(6),
    "results" JSONB,
    "source_insight_id" UUID,
    "created_by_staff_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."gift_card" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "initial_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "state" "bask"."gift_card_state" NOT NULL DEFAULT 'active',
    "purchaser_id" UUID,
    "recipient_id" UUID,
    "recipient_name" TEXT,
    "recipient_email" TEXT,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "gift_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."activity_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "actor_type" "bask"."actor_type" NOT NULL DEFAULT 'staff',
    "actor_staff_id" UUID,
    "actor_label" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."consent_profile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "tier" "bask"."consent_tier" NOT NULL DEFAULT 'benchmarks',
    "updated_by_staff_id" UUID,
    "effective_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "consent_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."consent_audit_entry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "consent_profile_id" UUID NOT NULL,
    "from_tier" "bask"."consent_tier",
    "to_tier" "bask"."consent_tier" NOT NULL,
    "changed_by_staff_id" UUID,
    "note" TEXT,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_audit_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."draft_order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "account_id" UUID,
    "state" "bask"."draft_order_state" NOT NULL DEFAULT 'draft',
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "created_by_staff_id" UUID,
    "submitted_at" TIMESTAMPTZ(6),
    "acknowledged_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "draft_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."draft_order_line" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "draft_order_id" UUID NOT NULL,
    "product_id" UUID,
    "uvalux_catalog_item_id" UUID,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_order_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."account" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "account_number" TEXT,
    "lifecycle" "bask"."account_lifecycle" NOT NULL DEFAULT 'established',
    "health_score" INTEGER,
    "annual_wholesale_value" DECIMAL(12,2),
    "territory" TEXT,
    "assigned_rep_id" UUID,
    "last_contact_at" TIMESTAMPTZ(6),
    "next_touch_at" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."signal_snapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "salon_id" UUID NOT NULL,
    "signal_type" TEXT NOT NULL,
    "severity" "bask"."insight_severity" NOT NULL DEFAULT 'medium',
    "headline" TEXT NOT NULL,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "for_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."coaching_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salon_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "topic" TEXT NOT NULL,
    "message" TEXT,
    "state" "bask"."coaching_request_state" NOT NULL DEFAULT 'open',
    "requested_by_staff_id" UUID,
    "assigned_rep_id" UUID,
    "response" TEXT,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "coaching_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."contact_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" UUID NOT NULL,
    "salon_id" UUID NOT NULL,
    "rep_id" UUID,
    "channel" "bask"."contact_channel" NOT NULL DEFAULT 'call',
    "outcome" TEXT,
    "notes" TEXT,
    "playbook_key" TEXT,
    "duration_minutes" INTEGER,
    "contacted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bask"."playbook" (
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "target_signal_type" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "playbook_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "bask"."demo_state" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "virtual_today" DATE NOT NULL,
    "seed" TEXT NOT NULL DEFAULT 'sunset-ridge-v1',
    "last_advanced_at" TIMESTAMPTZ(6),
    "last_pipeline_run_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "demo_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_slug_key" ON "bask"."org"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "salon_slug_key" ON "bask"."salon"("slug");

-- CreateIndex
CREATE INDEX "salon_org_id_idx" ON "bask"."salon"("org_id");

-- CreateIndex
CREATE INDEX "staff_salon_id_idx" ON "bask"."staff"("salon_id");

-- CreateIndex
CREATE INDEX "staff_role_idx" ON "bask"."staff"("role");

-- CreateIndex
CREATE INDEX "room_salon_id_idx" ON "bask"."room"("salon_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_salon_id_name_key" ON "bask"."room"("salon_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_device_room_id_key" ON "bask"."equipment_device"("room_id");

-- CreateIndex
CREATE INDEX "equipment_device_salon_id_idx" ON "bask"."equipment_device"("salon_id");

-- CreateIndex
CREATE INDEX "service_salon_id_idx" ON "bask"."service"("salon_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_salon_id_name_key" ON "bask"."service"("salon_id", "name");

-- CreateIndex
CREATE INDEX "session_salon_id_started_at_idx" ON "bask"."session"("salon_id", "started_at");

-- CreateIndex
CREATE INDEX "session_room_id_state_idx" ON "bask"."session"("room_id", "state");

-- CreateIndex
CREATE INDEX "session_customer_id_idx" ON "bask"."session"("customer_id");

-- CreateIndex
CREATE INDEX "customer_salon_id_last_name_idx" ON "bask"."customer"("salon_id", "last_name");

-- CreateIndex
CREATE INDEX "customer_salon_id_status_idx" ON "bask"."customer"("salon_id", "status");

-- CreateIndex
CREATE INDEX "customer_salon_id_email_idx" ON "bask"."customer"("salon_id", "email");

-- CreateIndex
CREATE INDEX "membership_salon_id_status_idx" ON "bask"."membership"("salon_id", "status");

-- CreateIndex
CREATE INDEX "membership_salon_id_payment_state_idx" ON "bask"."membership"("salon_id", "payment_state");

-- CreateIndex
CREATE INDEX "membership_customer_id_idx" ON "bask"."membership"("customer_id");

-- CreateIndex
CREATE INDEX "package_salon_id_status_idx" ON "bask"."package"("salon_id", "status");

-- CreateIndex
CREATE INDEX "package_customer_id_idx" ON "bask"."package"("customer_id");

-- CreateIndex
CREATE INDEX "visit_salon_id_checked_in_at_idx" ON "bask"."visit"("salon_id", "checked_in_at");

-- CreateIndex
CREATE INDEX "visit_customer_id_idx" ON "bask"."visit"("customer_id");

-- CreateIndex
CREATE INDEX "sale_salon_id_sold_at_idx" ON "bask"."sale"("salon_id", "sold_at");

-- CreateIndex
CREATE INDEX "sale_customer_id_idx" ON "bask"."sale"("customer_id");

-- CreateIndex
CREATE INDEX "sale_line_salon_id_sold_at_idx" ON "bask"."sale_line"("salon_id", "sold_at");

-- CreateIndex
CREATE INDEX "sale_line_product_id_idx" ON "bask"."sale_line"("product_id");

-- CreateIndex
CREATE INDEX "sale_line_customer_id_product_id_idx" ON "bask"."sale_line"("customer_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uvalux_catalog_item_official_sku_key" ON "bask"."uvalux_catalog_item"("official_sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_sku_key" ON "bask"."product"("sku");

-- CreateIndex
CREATE INDEX "product_salon_id_idx" ON "bask"."product"("salon_id");

-- CreateIndex
CREATE INDEX "product_category_idx" ON "bask"."product"("category");

-- CreateIndex
CREATE INDEX "barcode_value_idx" ON "bask"."barcode"("value");

-- CreateIndex
CREATE INDEX "barcode_salon_id_idx" ON "bask"."barcode"("salon_id");

-- CreateIndex
CREATE UNIQUE INDEX "barcode_product_id_value_key" ON "bask"."barcode"("product_id", "value");

-- CreateIndex
CREATE INDEX "inventory_level_salon_id_idx" ON "bask"."inventory_level"("salon_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_level_salon_id_product_id_key" ON "bask"."inventory_level"("salon_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_event_salon_id_occurred_at_idx" ON "bask"."stock_event"("salon_id", "occurred_at");

-- CreateIndex
CREATE INDEX "stock_event_product_id_occurred_at_idx" ON "bask"."stock_event"("product_id", "occurred_at");

-- CreateIndex
CREATE INDEX "insight_salon_id_state_idx" ON "bask"."insight"("salon_id", "state");

-- CreateIndex
CREATE INDEX "insight_salon_id_for_date_idx" ON "bask"."insight"("salon_id", "for_date");

-- CreateIndex
CREATE INDEX "insight_type_idx" ON "bask"."insight"("type");

-- CreateIndex
CREATE INDEX "campaign_salon_id_state_idx" ON "bask"."campaign"("salon_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_code_key" ON "bask"."gift_card"("code");

-- CreateIndex
CREATE INDEX "gift_card_salon_id_state_idx" ON "bask"."gift_card"("salon_id", "state");

-- CreateIndex
CREATE INDEX "activity_event_salon_id_occurred_at_idx" ON "bask"."activity_event"("salon_id", "occurred_at");

-- CreateIndex
CREATE INDEX "activity_event_target_type_target_id_idx" ON "bask"."activity_event"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "consent_profile_salon_id_key" ON "bask"."consent_profile"("salon_id");

-- CreateIndex
CREATE INDEX "consent_audit_entry_salon_id_changed_at_idx" ON "bask"."consent_audit_entry"("salon_id", "changed_at");

-- CreateIndex
CREATE INDEX "draft_order_salon_id_state_idx" ON "bask"."draft_order"("salon_id", "state");

-- CreateIndex
CREATE INDEX "draft_order_line_draft_order_id_idx" ON "bask"."draft_order_line"("draft_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_salon_id_key" ON "bask"."account"("salon_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_account_number_key" ON "bask"."account"("account_number");

-- CreateIndex
CREATE INDEX "account_lifecycle_idx" ON "bask"."account"("lifecycle");

-- CreateIndex
CREATE INDEX "account_assigned_rep_id_idx" ON "bask"."account"("assigned_rep_id");

-- CreateIndex
CREATE INDEX "signal_snapshot_account_id_for_date_idx" ON "bask"."signal_snapshot"("account_id", "for_date");

-- CreateIndex
CREATE INDEX "signal_snapshot_salon_id_idx" ON "bask"."signal_snapshot"("salon_id");

-- CreateIndex
CREATE INDEX "coaching_request_salon_id_state_idx" ON "bask"."coaching_request"("salon_id", "state");

-- CreateIndex
CREATE INDEX "coaching_request_account_id_state_idx" ON "bask"."coaching_request"("account_id", "state");

-- CreateIndex
CREATE INDEX "contact_log_account_id_contacted_at_idx" ON "bask"."contact_log"("account_id", "contacted_at");

-- CreateIndex
CREATE INDEX "contact_log_salon_id_idx" ON "bask"."contact_log"("salon_id");

-- AddForeignKey
ALTER TABLE "bask"."salon" ADD CONSTRAINT "salon_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "bask"."org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."staff" ADD CONSTRAINT "staff_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."room" ADD CONSTRAINT "room_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."room" ADD CONSTRAINT "room_room_type_key_fkey" FOREIGN KEY ("room_type_key") REFERENCES "bask"."room_type"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."equipment_device" ADD CONSTRAINT "equipment_device_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."equipment_device" ADD CONSTRAINT "equipment_device_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "bask"."room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."service" ADD CONSTRAINT "service_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."service" ADD CONSTRAINT "service_room_type_key_fkey" FOREIGN KEY ("room_type_key") REFERENCES "bask"."room_type"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."session" ADD CONSTRAINT "session_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."session" ADD CONSTRAINT "session_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "bask"."room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."session" ADD CONSTRAINT "session_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bask"."customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."session" ADD CONSTRAINT "session_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bask"."service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."session" ADD CONSTRAINT "session_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "bask"."visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."session" ADD CONSTRAINT "session_started_by_staff_id_fkey" FOREIGN KEY ("started_by_staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."customer" ADD CONSTRAINT "customer_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."membership" ADD CONSTRAINT "membership_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."membership" ADD CONSTRAINT "membership_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bask"."customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."package" ADD CONSTRAINT "package_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."package" ADD CONSTRAINT "package_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bask"."customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."package" ADD CONSTRAINT "package_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bask"."service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."visit" ADD CONSTRAINT "visit_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."visit" ADD CONSTRAINT "visit_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bask"."customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."visit" ADD CONSTRAINT "visit_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."sale" ADD CONSTRAINT "sale_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."sale" ADD CONSTRAINT "sale_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "bask"."visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."sale" ADD CONSTRAINT "sale_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bask"."customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."sale" ADD CONSTRAINT "sale_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."sale_line" ADD CONSTRAINT "sale_line_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."sale_line" ADD CONSTRAINT "sale_line_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "bask"."sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."sale_line" ADD CONSTRAINT "sale_line_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "bask"."customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."sale_line" ADD CONSTRAINT "sale_line_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "bask"."product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."sale_line" ADD CONSTRAINT "sale_line_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "bask"."service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."sale_line" ADD CONSTRAINT "sale_line_gift_card_id_fkey" FOREIGN KEY ("gift_card_id") REFERENCES "bask"."gift_card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."sale_line" ADD CONSTRAINT "sale_line_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."product" ADD CONSTRAINT "product_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."product" ADD CONSTRAINT "product_uvalux_catalog_item_id_fkey" FOREIGN KEY ("uvalux_catalog_item_id") REFERENCES "bask"."uvalux_catalog_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."barcode" ADD CONSTRAINT "barcode_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."barcode" ADD CONSTRAINT "barcode_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "bask"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."inventory_level" ADD CONSTRAINT "inventory_level_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."inventory_level" ADD CONSTRAINT "inventory_level_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "bask"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."stock_event" ADD CONSTRAINT "stock_event_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."stock_event" ADD CONSTRAINT "stock_event_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "bask"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."stock_event" ADD CONSTRAINT "stock_event_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."stock_event" ADD CONSTRAINT "stock_event_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "bask"."session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."insight" ADD CONSTRAINT "insight_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."campaign" ADD CONSTRAINT "campaign_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."campaign" ADD CONSTRAINT "campaign_segment_key_fkey" FOREIGN KEY ("segment_key") REFERENCES "bask"."segment"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."campaign" ADD CONSTRAINT "campaign_source_insight_id_fkey" FOREIGN KEY ("source_insight_id") REFERENCES "bask"."insight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."campaign" ADD CONSTRAINT "campaign_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."gift_card" ADD CONSTRAINT "gift_card_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."gift_card" ADD CONSTRAINT "gift_card_purchaser_id_fkey" FOREIGN KEY ("purchaser_id") REFERENCES "bask"."customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."gift_card" ADD CONSTRAINT "gift_card_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "bask"."customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."activity_event" ADD CONSTRAINT "activity_event_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."activity_event" ADD CONSTRAINT "activity_event_actor_staff_id_fkey" FOREIGN KEY ("actor_staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."consent_profile" ADD CONSTRAINT "consent_profile_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."consent_profile" ADD CONSTRAINT "consent_profile_updated_by_staff_id_fkey" FOREIGN KEY ("updated_by_staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."consent_audit_entry" ADD CONSTRAINT "consent_audit_entry_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."consent_audit_entry" ADD CONSTRAINT "consent_audit_entry_consent_profile_id_fkey" FOREIGN KEY ("consent_profile_id") REFERENCES "bask"."consent_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."consent_audit_entry" ADD CONSTRAINT "consent_audit_entry_changed_by_staff_id_fkey" FOREIGN KEY ("changed_by_staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."draft_order" ADD CONSTRAINT "draft_order_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."draft_order" ADD CONSTRAINT "draft_order_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "bask"."account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."draft_order" ADD CONSTRAINT "draft_order_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."draft_order_line" ADD CONSTRAINT "draft_order_line_draft_order_id_fkey" FOREIGN KEY ("draft_order_id") REFERENCES "bask"."draft_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."draft_order_line" ADD CONSTRAINT "draft_order_line_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "bask"."product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."draft_order_line" ADD CONSTRAINT "draft_order_line_uvalux_catalog_item_id_fkey" FOREIGN KEY ("uvalux_catalog_item_id") REFERENCES "bask"."uvalux_catalog_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."account" ADD CONSTRAINT "account_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."account" ADD CONSTRAINT "account_assigned_rep_id_fkey" FOREIGN KEY ("assigned_rep_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."signal_snapshot" ADD CONSTRAINT "signal_snapshot_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "bask"."account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."signal_snapshot" ADD CONSTRAINT "signal_snapshot_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."coaching_request" ADD CONSTRAINT "coaching_request_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."coaching_request" ADD CONSTRAINT "coaching_request_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "bask"."account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."coaching_request" ADD CONSTRAINT "coaching_request_requested_by_staff_id_fkey" FOREIGN KEY ("requested_by_staff_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."coaching_request" ADD CONSTRAINT "coaching_request_assigned_rep_id_fkey" FOREIGN KEY ("assigned_rep_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."contact_log" ADD CONSTRAINT "contact_log_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "bask"."account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."contact_log" ADD CONSTRAINT "contact_log_salon_id_fkey" FOREIGN KEY ("salon_id") REFERENCES "bask"."salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."contact_log" ADD CONSTRAINT "contact_log_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "bask"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bask"."contact_log" ADD CONSTRAINT "contact_log_playbook_key_fkey" FOREIGN KEY ("playbook_key") REFERENCES "bask"."playbook"("key") ON DELETE SET NULL ON UPDATE CASCADE;
