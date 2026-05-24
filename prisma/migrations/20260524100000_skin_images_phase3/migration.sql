CREATE TABLE IF NOT EXISTS "skin_images" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "encounterId" TEXT,
  "medicalRecordId" TEXT,
  "driveFileId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSizeBytes" INTEGER,
  "thumbnailUrl" TEXT,
  "bodyArea" TEXT,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploadedBy" TEXT NOT NULL,
  "note" TEXT,
  "aiAnalysisId" TEXT,
  "deletedAt" TIMESTAMP(3),
  "deletedBy" TEXT,
  CONSTRAINT "skin_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "skin_images_encounterId_idx" ON "skin_images"("encounterId");
CREATE INDEX IF NOT EXISTS "skin_images_medicalRecordId_idx" ON "skin_images"("medicalRecordId");
CREATE INDEX IF NOT EXISTS "skin_images_patientId_capturedAt_idx" ON "skin_images"("patientId", "capturedAt");
CREATE INDEX IF NOT EXISTS "skin_images_uploadedBy_idx" ON "skin_images"("uploadedBy");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skin_images_patientId_fkey') THEN
    ALTER TABLE "skin_images"
      ADD CONSTRAINT "skin_images_patientId_fkey"
      FOREIGN KEY ("patientId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skin_images_encounterId_fkey') THEN
    ALTER TABLE "skin_images"
      ADD CONSTRAINT "skin_images_encounterId_fkey"
      FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skin_images_medicalRecordId_fkey') THEN
    ALTER TABLE "skin_images"
      ADD CONSTRAINT "skin_images_medicalRecordId_fkey"
      FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skin_images_uploadedBy_fkey') THEN
    ALTER TABLE "skin_images"
      ADD CONSTRAINT "skin_images_uploadedBy_fkey"
      FOREIGN KEY ("uploadedBy") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skin_images_deletedBy_fkey') THEN
    ALTER TABLE "skin_images"
      ADD CONSTRAINT "skin_images_deletedBy_fkey"
      FOREIGN KEY ("deletedBy") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
