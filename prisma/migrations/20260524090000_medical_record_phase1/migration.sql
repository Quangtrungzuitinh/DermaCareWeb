-- Phase 1 from medical_record.md: encounter lifecycle and draft/finalized records.

ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CHECKED_IN';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EncounterStatus') THEN
    CREATE TYPE "EncounterStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MedicalRecordStatus') THEN
    CREATE TYPE "MedicalRecordStatus" AS ENUM ('DRAFT', 'FINALIZED', 'AMENDED');
  END IF;
END $$;

ALTER TABLE "medical_records"
  ADD COLUMN IF NOT EXISTS "doctorId" TEXT,
  ADD COLUMN IF NOT EXISTS "encounterId" TEXT,
  ADD COLUMN IF NOT EXISTS "chiefComplaint" TEXT,
  ADD COLUMN IF NOT EXISTS "symptoms" TEXT,
  ADD COLUMN IF NOT EXISTS "doctorNote" TEXT,
  ADD COLUMN IF NOT EXISTS "followUpDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "status" "MedicalRecordStatus" NOT NULL DEFAULT 'DRAFT';

CREATE TABLE IF NOT EXISTS "encounters" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "patientId" TEXT,
  "doctorId" TEXT NOT NULL,
  "status" "EncounterStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "medical_record_amendments" (
  "id" TEXT NOT NULL,
  "medicalRecordId" TEXT NOT NULL,
  "amendedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "fieldChanged" TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "medical_record_amendments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "encounters_appointmentId_key" ON "encounters"("appointmentId");
CREATE INDEX IF NOT EXISTS "encounters_doctorId_status_idx" ON "encounters"("doctorId", "status");
CREATE INDEX IF NOT EXISTS "encounters_patientId_idx" ON "encounters"("patientId");
CREATE INDEX IF NOT EXISTS "encounters_status_idx" ON "encounters"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "medical_records_encounterId_key" ON "medical_records"("encounterId");
CREATE INDEX IF NOT EXISTS "medical_records_doctorId_idx" ON "medical_records"("doctorId");
CREATE INDEX IF NOT EXISTS "medical_records_encounterId_idx" ON "medical_records"("encounterId");
CREATE INDEX IF NOT EXISTS "medical_records_status_idx" ON "medical_records"("status");

CREATE INDEX IF NOT EXISTS "medical_record_amendments_amendedById_idx" ON "medical_record_amendments"("amendedById");
CREATE INDEX IF NOT EXISTS "medical_record_amendments_medicalRecordId_createdAt_idx"
  ON "medical_record_amendments"("medicalRecordId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'encounters_appointmentId_fkey') THEN
    ALTER TABLE "encounters"
      ADD CONSTRAINT "encounters_appointmentId_fkey"
      FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'encounters_patientId_fkey') THEN
    ALTER TABLE "encounters"
      ADD CONSTRAINT "encounters_patientId_fkey"
      FOREIGN KEY ("patientId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'encounters_doctorId_fkey') THEN
    ALTER TABLE "encounters"
      ADD CONSTRAINT "encounters_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medical_records_doctorId_fkey') THEN
    ALTER TABLE "medical_records"
      ADD CONSTRAINT "medical_records_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medical_records_encounterId_fkey') THEN
    ALTER TABLE "medical_records"
      ADD CONSTRAINT "medical_records_encounterId_fkey"
      FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medical_record_amendments_medicalRecordId_fkey') THEN
    ALTER TABLE "medical_record_amendments"
      ADD CONSTRAINT "medical_record_amendments_medicalRecordId_fkey"
      FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medical_record_amendments_amendedById_fkey') THEN
    ALTER TABLE "medical_record_amendments"
      ADD CONSTRAINT "medical_record_amendments_amendedById_fkey"
      FOREIGN KEY ("amendedById") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
