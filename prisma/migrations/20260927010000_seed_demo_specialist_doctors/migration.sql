-- Demo doctors for AI specialty routing. These profiles are database-only demo records;
-- no Supabase Auth users are created by this migration.
-- Use a CTE per statement because migration runners may commit individual statements.
WITH demo_doctors (profile_id, doctor_id, email, full_name, license_number, specialty, seniority) AS (VALUES
  ('demo_profile_oncology', 'demo_doctor_oncology', 'demo.oncology@clinic.test', 'BS. Demo Da liễu ung thư', 'DEMO-ONCOLOGY-001', 'Da liễu ung thư và phẫu thuật', 'SPECIALIST'),
  ('demo_profile_inflammatory', 'demo_doctor_inflammatory', 'demo.inflammatory@clinic.test', 'BS. Demo Viêm và miễn dịch', 'DEMO-INFLAMMATORY-001', 'Da liễu viêm và miễn dịch', 'SENIOR'),
  ('demo_profile_infection', 'demo_doctor_infection', 'demo.infection@clinic.test', 'BS. Demo Nhiễm trùng da', 'DEMO-INFECTION-001', 'Da liễu nhiễm trùng và ký sinh trùng', 'SENIOR'),
  ('demo_profile_leprosy', 'demo_doctor_leprosy', 'demo.leprosy@clinic.test', 'BS. Demo Bệnh phong', 'DEMO-LEPROSY-001', 'Da liễu bệnh phong', 'SPECIALIST'),
  ('demo_profile_genetic', 'demo_doctor_genetic', 'demo.genetic@clinic.test', 'BS. Demo Di truyền và nhi khoa', 'DEMO-GENETIC-001', 'Da liễu di truyền và nhi khoa', 'SPECIALIST'),
  ('demo_profile_lesions', 'demo_doctor_lesions', 'demo.lesions@clinic.test', 'BS. Demo Tổn thương và thẩm mỹ', 'DEMO-LESIONS-001', 'Da liễu tổn thương và thẩm mỹ', 'JUNIOR'))

INSERT INTO "profiles" ("id", "supabase_user_id", "email", "fullName", "role", "createdAt", "updatedAt")
SELECT profile_id, 'demo-auth-' || profile_id, email, full_name, 'DOCTOR'::"Role", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM demo_doctors
ON CONFLICT ("id") DO UPDATE SET
  "email" = EXCLUDED."email", "fullName" = EXCLUDED."fullName", "role" = 'DOCTOR'::"Role", "updatedAt" = CURRENT_TIMESTAMP;

WITH demo_doctors (profile_id, doctor_id, email, full_name, license_number, specialty, seniority) AS (VALUES
  ('demo_profile_oncology', 'demo_doctor_oncology', 'demo.oncology@clinic.test', 'BS. Demo Da liễu ung thư', 'DEMO-ONCOLOGY-001', 'Da liễu ung thư và phẫu thuật', 'SPECIALIST'),
  ('demo_profile_inflammatory', 'demo_doctor_inflammatory', 'demo.inflammatory@clinic.test', 'BS. Demo Viêm và miễn dịch', 'DEMO-INFLAMMATORY-001', 'Da liễu viêm và miễn dịch', 'SENIOR'),
  ('demo_profile_infection', 'demo_doctor_infection', 'demo.infection@clinic.test', 'BS. Demo Nhiễm trùng da', 'DEMO-INFECTION-001', 'Da liễu nhiễm trùng và ký sinh trùng', 'SENIOR'),
  ('demo_profile_leprosy', 'demo_doctor_leprosy', 'demo.leprosy@clinic.test', 'BS. Demo Bệnh phong', 'DEMO-LEPROSY-001', 'Da liễu bệnh phong', 'SPECIALIST'),
  ('demo_profile_genetic', 'demo_doctor_genetic', 'demo.genetic@clinic.test', 'BS. Demo Di truyền và nhi khoa', 'DEMO-GENETIC-001', 'Da liễu di truyền và nhi khoa', 'SPECIALIST'),
  ('demo_profile_lesions', 'demo_doctor_lesions', 'demo.lesions@clinic.test', 'BS. Demo Tổn thương và thẩm mỹ', 'DEMO-LESIONS-001', 'Da liễu tổn thương và thẩm mỹ', 'JUNIOR'))
INSERT INTO "doctor_profiles" ("id", "profileId", "licenseNumber", "seniorityLevel", "specialty", "isActive", "createdAt", "updatedAt", "approvalStatus")
SELECT doctor_id, profile_id, license_number, seniority::"DoctorLevel", specialty, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'APPROVED'::"ApprovalStatus"
FROM demo_doctors
ON CONFLICT ("id") DO UPDATE SET
  "profileId" = EXCLUDED."profileId", "licenseNumber" = EXCLUDED."licenseNumber",
  "seniorityLevel" = EXCLUDED."seniorityLevel", "specialty" = EXCLUDED."specialty",
  "isActive" = true, "approvalStatus" = 'APPROVED'::"ApprovalStatus", "updatedAt" = CURRENT_TIMESTAMP;

-- One broad weekday rule per demo doctor makes availability scoring deterministic.
WITH demo_doctors (doctor_id) AS (VALUES
  ('demo_doctor_oncology'), ('demo_doctor_inflammatory'), ('demo_doctor_infection'),
  ('demo_doctor_leprosy'), ('demo_doctor_genetic'), ('demo_doctor_lesions'))
INSERT INTO "doctor_schedule_rules" ("id", "doctorId", "dayOfWeek", "maxPatients", "slotDuration", "startMinute", "endMinute", "isActive", "createdAt", "updatedAt")
SELECT 'demo-rule-' || d.doctor_id || '-' || day_code, d.doctor_id, day_code::"DayOfWeek", 2, 30, 480, 1020, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM demo_doctors d
CROSS JOIN unnest(ARRAY['MON','TUE','WED','THU','FRI']) AS day_code
ON CONFLICT ("doctorId", "dayOfWeek", "startMinute") DO UPDATE SET
  "maxPatients" = EXCLUDED."maxPatients", "slotDuration" = EXCLUDED."slotDuration",
  "endMinute" = EXCLUDED."endMinute", "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP;
