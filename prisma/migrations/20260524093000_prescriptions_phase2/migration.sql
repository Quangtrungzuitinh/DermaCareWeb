CREATE TABLE IF NOT EXISTS "prescriptions" (
  "id" TEXT NOT NULL,
  "medicalRecordId" TEXT NOT NULL,
  "patientId" TEXT,
  "doctorId" TEXT NOT NULL,
  "encounterId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "prescription_items" (
  "id" TEXT NOT NULL,
  "prescriptionId" TEXT NOT NULL,
  "medicationName" TEXT NOT NULL,
  "dosage" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "instruction" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "prescriptions_doctorId_idx" ON "prescriptions"("doctorId");
CREATE INDEX IF NOT EXISTS "prescriptions_encounterId_idx" ON "prescriptions"("encounterId");
CREATE INDEX IF NOT EXISTS "prescriptions_medicalRecordId_idx" ON "prescriptions"("medicalRecordId");
CREATE INDEX IF NOT EXISTS "prescriptions_patientId_idx" ON "prescriptions"("patientId");
CREATE INDEX IF NOT EXISTS "prescription_items_prescriptionId_idx" ON "prescription_items"("prescriptionId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_medicalRecordId_fkey') THEN
    ALTER TABLE "prescriptions"
      ADD CONSTRAINT "prescriptions_medicalRecordId_fkey"
      FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_patientId_fkey') THEN
    ALTER TABLE "prescriptions"
      ADD CONSTRAINT "prescriptions_patientId_fkey"
      FOREIGN KEY ("patientId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_doctorId_fkey') THEN
    ALTER TABLE "prescriptions"
      ADD CONSTRAINT "prescriptions_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_encounterId_fkey') THEN
    ALTER TABLE "prescriptions"
      ADD CONSTRAINT "prescriptions_encounterId_fkey"
      FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prescription_items_prescriptionId_fkey') THEN
    ALTER TABLE "prescription_items"
      ADD CONSTRAINT "prescription_items_prescriptionId_fkey"
      FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
