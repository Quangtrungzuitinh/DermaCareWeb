-- Idempotent catch-up: AI skin analysis fields on appointments
-- IF NOT EXISTS prevents crash when columns already exist on live DB
-- After running: npx prisma migrate resolve --applied "20260522000000_add_ai_skin_fields"

ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "aiPredictedCondition" TEXT;

ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "aiConfidenceScore" DOUBLE PRECISION;
