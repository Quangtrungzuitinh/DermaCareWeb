-- Create ApprovalStatus enum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- Add approvalStatus column with safe default
ALTER TABLE "doctor_profiles" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill: isActive = true → APPROVED
UPDATE "doctor_profiles" SET "approvalStatus" = 'APPROVED' WHERE "isActive" = true;

-- Backfill: filled info but not yet approved → SUBMITTED
UPDATE "doctor_profiles"
SET "approvalStatus" = 'SUBMITTED'
WHERE "isActive" = false
  AND "specialty" IS NOT NULL
  AND "licenseNumber" NOT LIKE 'PENDING-%';

-- Fix isActive default to false (new profiles start inactive)
ALTER TABLE "doctor_profiles" ALTER COLUMN "isActive" SET DEFAULT false;
