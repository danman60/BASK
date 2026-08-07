-- CreateTable
CREATE TABLE "bask"."app_log" (
    "id" BIGSERIAL NOT NULL,
    "ts" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL DEFAULT 'info',
    "tag" TEXT NOT NULL,
    "msg" TEXT NOT NULL,
    "data" JSONB,

    CONSTRAINT "app_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_log_ts_idx" ON "bask"."app_log"("ts");

