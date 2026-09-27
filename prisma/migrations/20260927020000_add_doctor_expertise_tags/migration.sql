ALTER TABLE "doctor_profiles"
  ADD COLUMN IF NOT EXISTS "expertiseTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "doctor_profiles"
SET "expertiseTags" = CASE "id"
  WHEN 'demo_doctor_oncology' THEN ARRAY['Melanoma']
  WHEN 'demo_doctor_inflammatory' THEN ARRAY['Psoriasis']
  WHEN 'demo_doctor_infection' THEN ARRAY['Tinea Corporis']
  WHEN 'demo_doctor_leprosy' THEN ARRAY['Leprosy Borderline']
  WHEN 'demo_doctor_genetic' THEN ARRAY['Neurofibromatosis']
  WHEN 'demo_doctor_lesions' THEN ARRAY['nevus']
  ELSE COALESCE("expertiseTags", ARRAY[]::TEXT[])
END,
"updatedAt" = CURRENT_TIMESTAMP
WHERE "id" LIKE 'demo_doctor_%';
