-- Idempotent catch-up: audit_logs table
-- Contains auth.* in RLS policy → MUST run via Supabase SQL Editor (P3006-safe)
-- After running: npx prisma migrate resolve --applied "20260520090000_audit_logs"

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"          TEXT NOT NULL,
  "actorId"     TEXT,
  "actorRole"   "Role",
  "action"      TEXT NOT NULL,
  "targetTable" TEXT NOT NULL,
  "targetId"    TEXT NOT NULL,
  "oldValue"    JSONB,
  "newValue"    JSONB,
  "ipAddress"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_logs_actorId_idx"
  ON "audit_logs"("actorId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_createdAt_idx"
  ON "audit_logs"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_targetTable_targetId_idx"
  ON "audit_logs"("targetTable", "targetId");

DO $$ BEGIN
  ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "admin_read_audit" ON public.audit_logs
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.supabase_user_id = auth.uid()::text
          AND profiles.role = 'ADMIN'::"Role"
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
