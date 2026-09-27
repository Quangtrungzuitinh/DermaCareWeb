CREATE TABLE IF NOT EXISTS "doctor_specialty_groups" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "tags" TEXT[] NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "doctor_specialty_groups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "doctor_specialty_groups_code_key" ON "doctor_specialty_groups"("code");
CREATE INDEX IF NOT EXISTS "doctor_specialty_groups_isActive_idx" ON "doctor_specialty_groups"("isActive");

INSERT INTO "doctor_specialty_groups" ("id", "code", "name", "description", "tags") VALUES
  ('specialty_oncology', 'ONCOLOGY', 'Da liễu ung thư và phẫu thuật', 'Nhóm xử trí tổn thương nghi ngờ ung thư da; cần khám trực tiếp.', ARRAY['Basal Cell Carcinoma','Melanoma','Mycosis Fungoides','squamous cell carcinoma','Ung thư da','U da','Dermato-oncology','Surgical Dermatology','Oncologic Dermatology']),
  ('specialty_inflammatory', 'INFLAMMATORY', 'Da liễu viêm và miễn dịch', 'Bệnh viêm, tự miễn và bệnh da mạn tính.', ARRAY['Darier_s Disease','Lupus Erythematosus Chronicus Discoides','Lichen Planus','Pityriasis Rosea','Psoriasis','Medical Dermatology','General Dermatology','Genetic/Immunodermatology']),
  ('specialty_infection', 'INFECTION', 'Da liễu nhiễm trùng và ký sinh trùng', 'Nhiễm khuẩn, virus, nấm và ký sinh trùng da.', ARRAY['Herpes Simplex','Impetigo','Molluscum Contagiosum','Pediculosis Capitis','Tinea Corporis','Tinea Nigra','Larva Migrans','Tungiasis','Medical Dermatology','Infectious Disease','Parasitology']),
  ('specialty_leprosy', 'LEPROSY', 'Da liễu bệnh phong', 'Nhóm chuyên môn riêng cho các thể bệnh phong.', ARRAY['Leprosy Borderline','Leprosy Lepromatous','Leprosy Tuberculoid','Leprosy','Hansen disease','Medical Dermatology','Infectious Disease']),
  ('specialty_genetic_pediatric', 'GENETIC_PEDIATRIC', 'Da liễu di truyền và nhi khoa', 'Bệnh da di truyền, bóng nước và tổn thương ở trẻ em.', ARRAY['Epidermolysis Bullosa Pruriginosa','Hailey-Hailey Disease','Neurofibromatosis','Darier_s Disease','Genetic Dermatology','Pediatric Dermatology','Academic Dermatology','Genodermatoses']),
  ('specialty_lesions_cosmetic', 'LESIONS_COSMETIC', 'Da liễu tổn thương và thẩm mỹ', 'Nốt ruồi, tổn thương sắc tố, mạch máu và tổn thương lành tính.', ARRAY['actinic keratosis','Papilomatosis Confluentes And Reticulate','Porokeratosis Actinic','dermatofibroma','nevus','pigmented benign keratosis','seborrheic keratosis','vascular lesion','Cosmetic Dermatology','Surgical/Cosmetic Dermatology']),
  ('specialty_general', 'GENERAL', 'Da liễu tổng quát', 'Điểm tiếp nhận chung khi chưa có bác sĩ đúng nhóm.', ARRAY['General Dermatology','Medical Dermatology','Da liễu tổng quát','Da liễu'])
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name", "description" = EXCLUDED."description", "tags" = EXCLUDED."tags", "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP;

-- Existing doctor was incorrectly classified as Nội tổng quát. Preserve the profile,
-- appointments and medical records while moving the specialty to dermatology general.
UPDATE "doctor_profiles"
SET "specialty" = 'Da liễu tổng quát', "updatedAt" = CURRENT_TIMESTAMP
WHERE "specialty" = 'Nội tổng quát';
