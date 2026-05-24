-- AddColumn: Privacy & Consent fields to Profile
ALTER TABLE "profiles" ADD COLUMN "consentDataStorage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN "consentGivenAt" TIMESTAMP(3);
