DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TreatmentPlanStatus') THEN
    CREATE TYPE "TreatmentPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConditionStatus') THEN
    CREATE TYPE "ConditionStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'RECURRENT', 'MONITORING');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsentType') THEN
    CREATE TYPE "ConsentType" AS ENUM (
      'STORE_MEDICAL_RECORD',
      'STORE_SKIN_IMAGE',
      'USE_IMAGE_FOR_AI_ANALYSIS',
      'SHARE_WITH_DOCTOR',
      'MARKETING_COMMUNICATION'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "treatment_plans" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "medicalRecordId" TEXT,
  "diagnosis" TEXT,
  "goal" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "expectedEndDate" TIMESTAMP(3),
  "status" "TreatmentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "treatment_plan_steps" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "weekNumber" INTEGER NOT NULL,
  "instruction" TEXT NOT NULL,
  "medication" TEXT,
  "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
  "isDone" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "treatment_plan_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "clinical_observations" (
  "id" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "unit" TEXT,
  "note" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clinical_observations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conditions" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "encounterId" TEXT,
  "medicalRecordId" TEXT,
  "name" TEXT NOT NULL,
  "icdCode" TEXT,
  "severity" TEXT,
  "status" "ConditionStatus" NOT NULL DEFAULT 'ACTIVE',
  "onsetDate" TIMESTAMP(3),
  "resolvedDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "follow_up_notes" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "encounterId" TEXT,
  "treatmentPlanId" TEXT,
  "createdById" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "nextAction" TEXT,
  "scheduledDate" TIMESTAMP(3),
  "isDone" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "follow_up_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "consents" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "type" "ConsentType" NOT NULL,
  "granted" BOOLEAN NOT NULL,
  "grantedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "skin_analysis_results" (
  "id" TEXT NOT NULL,
  "skinImageId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "encounterId" TEXT,
  "acneSeverity" DOUBLE PRECISION,
  "rednessScore" DOUBLE PRECISION,
  "pigmentScore" DOUBLE PRECISION,
  "oilinessScore" DOUBLE PRECISION,
  "rawScores" JSONB,
  "conditionType" TEXT NOT NULL,
  "modelVersion" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "doctorConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "doctorOverrideScore" DOUBLE PRECISION,
  "doctorNote" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "confirmedById" TEXT,
  "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "error" TEXT,
  CONSTRAINT "skin_analysis_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "treatment_plans_doctorId_idx" ON "treatment_plans"("doctorId");
CREATE INDEX IF NOT EXISTS "treatment_plans_medicalRecordId_idx" ON "treatment_plans"("medicalRecordId");
CREATE INDEX IF NOT EXISTS "treatment_plans_patientId_status_idx" ON "treatment_plans"("patientId", "status");
CREATE INDEX IF NOT EXISTS "treatment_plan_steps_planId_idx" ON "treatment_plan_steps"("planId");
CREATE INDEX IF NOT EXISTS "clinical_observations_encounterId_type_idx" ON "clinical_observations"("encounterId", "type");
CREATE INDEX IF NOT EXISTS "conditions_encounterId_idx" ON "conditions"("encounterId");
CREATE INDEX IF NOT EXISTS "conditions_medicalRecordId_idx" ON "conditions"("medicalRecordId");
CREATE INDEX IF NOT EXISTS "conditions_patientId_status_idx" ON "conditions"("patientId", "status");
CREATE INDEX IF NOT EXISTS "follow_up_notes_createdById_idx" ON "follow_up_notes"("createdById");
CREATE INDEX IF NOT EXISTS "follow_up_notes_encounterId_idx" ON "follow_up_notes"("encounterId");
CREATE INDEX IF NOT EXISTS "follow_up_notes_patientId_idx" ON "follow_up_notes"("patientId");
CREATE INDEX IF NOT EXISTS "follow_up_notes_scheduledDate_isDone_idx" ON "follow_up_notes"("scheduledDate", "isDone");
CREATE INDEX IF NOT EXISTS "follow_up_notes_treatmentPlanId_idx" ON "follow_up_notes"("treatmentPlanId");
CREATE UNIQUE INDEX IF NOT EXISTS "consents_patientId_type_key" ON "consents"("patientId", "type");
CREATE INDEX IF NOT EXISTS "consents_patientId_idx" ON "consents"("patientId");
CREATE UNIQUE INDEX IF NOT EXISTS "skin_analysis_results_skinImageId_key" ON "skin_analysis_results"("skinImageId");
CREATE INDEX IF NOT EXISTS "skin_analysis_results_encounterId_idx" ON "skin_analysis_results"("encounterId");
CREATE INDEX IF NOT EXISTS "skin_analysis_results_patientId_analyzedAt_idx" ON "skin_analysis_results"("patientId", "analyzedAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'treatment_plans_patientId_fkey') THEN
    ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'treatment_plans_doctorId_fkey') THEN
    ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'treatment_plans_medicalRecordId_fkey') THEN
    ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'treatment_plan_steps_planId_fkey') THEN
    ALTER TABLE "treatment_plan_steps" ADD CONSTRAINT "treatment_plan_steps_planId_fkey" FOREIGN KEY ("planId") REFERENCES "treatment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clinical_observations_encounterId_fkey') THEN
    ALTER TABLE "clinical_observations" ADD CONSTRAINT "clinical_observations_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conditions_patientId_fkey') THEN
    ALTER TABLE "conditions" ADD CONSTRAINT "conditions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conditions_encounterId_fkey') THEN
    ALTER TABLE "conditions" ADD CONSTRAINT "conditions_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conditions_medicalRecordId_fkey') THEN
    ALTER TABLE "conditions" ADD CONSTRAINT "conditions_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follow_up_notes_patientId_fkey') THEN
    ALTER TABLE "follow_up_notes" ADD CONSTRAINT "follow_up_notes_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follow_up_notes_createdById_fkey') THEN
    ALTER TABLE "follow_up_notes" ADD CONSTRAINT "follow_up_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follow_up_notes_encounterId_fkey') THEN
    ALTER TABLE "follow_up_notes" ADD CONSTRAINT "follow_up_notes_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follow_up_notes_treatmentPlanId_fkey') THEN
    ALTER TABLE "follow_up_notes" ADD CONSTRAINT "follow_up_notes_treatmentPlanId_fkey" FOREIGN KEY ("treatmentPlanId") REFERENCES "treatment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consents_patientId_fkey') THEN
    ALTER TABLE "consents" ADD CONSTRAINT "consents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skin_analysis_results_skinImageId_fkey') THEN
    ALTER TABLE "skin_analysis_results" ADD CONSTRAINT "skin_analysis_results_skinImageId_fkey" FOREIGN KEY ("skinImageId") REFERENCES "skin_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skin_analysis_results_patientId_fkey') THEN
    ALTER TABLE "skin_analysis_results" ADD CONSTRAINT "skin_analysis_results_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skin_analysis_results_encounterId_fkey') THEN
    ALTER TABLE "skin_analysis_results" ADD CONSTRAINT "skin_analysis_results_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skin_analysis_results_confirmedById_fkey') THEN
    ALTER TABLE "skin_analysis_results" ADD CONSTRAINT "skin_analysis_results_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "consents" ("id", "patientId", "type", "granted", "grantedAt", "createdAt")
SELECT gen_random_uuid()::text, p."id", 'STORE_MEDICAL_RECORD', p."consentDataStorage", p."consentGivenAt", CURRENT_TIMESTAMP
FROM "profiles" p
WHERE p."role" = 'PATIENT'
ON CONFLICT ("patientId", "type") DO NOTHING;
