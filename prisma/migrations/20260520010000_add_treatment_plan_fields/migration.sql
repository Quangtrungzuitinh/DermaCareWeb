-- Feature 6-A: Treatment Plan Management (Simple)
-- Adds plan metadata to medical_records without creating a new table.

ALTER TABLE "medical_records" ADD COLUMN "planDescription" TEXT;
ALTER TABLE "medical_records" ADD COLUMN "targetSessions" INTEGER;
ALTER TABLE "medical_records" ADD COLUMN "completedSessions" INTEGER NOT NULL DEFAULT 0;
