-- Feature 5: Dynamic Waitlist
-- Creates waitlist_entries table for patient slot-availability notifications.

DO $$ BEGIN
  CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'NOTIFIED', 'BOOKED', 'EXPIRED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "waitlist_entries" (
  "id"                TEXT NOT NULL,
  "patientId"         TEXT NOT NULL,
  "serviceId"         TEXT NOT NULL,
  "preferredDoctorId" TEXT,
  "status"            "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
  "notifiedAt"        TIMESTAMP(3),
  "expiresAt"         TIMESTAMP(3),
  "notes"             TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "waitlist_entries_patientId_status_idx"
  ON "waitlist_entries"("patientId", "status");
CREATE INDEX IF NOT EXISTS "waitlist_entries_serviceId_status_idx"
  ON "waitlist_entries"("serviceId", "status");
CREATE INDEX IF NOT EXISTS "waitlist_entries_preferredDoctorId_status_idx"
  ON "waitlist_entries"("preferredDoctorId", "status");

ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "waitlist_entries"
  ADD CONSTRAINT "waitlist_entries_preferredDoctorId_fkey"
  FOREIGN KEY ("preferredDoctorId") REFERENCES "doctor_profiles"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
