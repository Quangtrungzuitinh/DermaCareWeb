ALTER TABLE "doctor_profiles" DROP CONSTRAINT IF EXISTS "doctor_profiles_profileId_fkey";
ALTER TABLE "doctor_profiles" ALTER COLUMN "profileId" DROP NOT NULL;
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
