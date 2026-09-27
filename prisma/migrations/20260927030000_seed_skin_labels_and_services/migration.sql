-- Canonical 31-label routing catalog and clean dermatology service catalog.
-- Existing test services are kept for historical appointments but hidden from booking.
CREATE TABLE IF NOT EXISTS "doctor_expertise_labels" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "modelCode" TEXT NOT NULL,
  "labelEn" TEXT NOT NULL,
  "labelVi" TEXT NOT NULL,
  "groupCode" TEXT NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "doctor_expertise_labels_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "doctor_service_assignments" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "reason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "doctor_service_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "doctor_expertise_labels_doctorId_modelCode_key" ON "doctor_expertise_labels" ("doctorId", "modelCode");
CREATE INDEX IF NOT EXISTS "doctor_expertise_labels_modelCode_idx" ON "doctor_expertise_labels" ("modelCode");
CREATE INDEX IF NOT EXISTS "doctor_expertise_labels_groupCode_idx" ON "doctor_expertise_labels" ("groupCode");
CREATE UNIQUE INDEX IF NOT EXISTS "doctor_service_assignments_doctorId_serviceId_key" ON "doctor_service_assignments" ("doctorId", "serviceId");
CREATE INDEX IF NOT EXISTS "doctor_service_assignments_serviceId_isActive_idx" ON "doctor_service_assignments" ("serviceId", "isActive");
DO $$ BEGIN
  ALTER TABLE "doctor_expertise_labels" ADD CONSTRAINT "doctor_expertise_labels_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "doctor_service_assignments" ADD CONSTRAINT "doctor_service_assignments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "doctor_service_assignments" ADD CONSTRAINT "doctor_service_assignments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE "services" SET "isActive" = false WHERE "isActive" = true;
INSERT INTO "services" ("id","name","price","description","isActive","createdAt","updatedAt","durationMinutes") VALUES
 ('svc-derm-oncology','Khám tổn thương da nghi ngờ ung thư','500000','Đánh giá nốt ruồi, tổn thương sắc tố và tổn thương cần khám trực tiếp; không thay thế chẩn đoán mô bệnh học.',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,45),
 ('svc-derm-inflammatory','Khám da liễu viêm và miễn dịch','350000','Tư vấn bệnh viêm, miễn dịch và bệnh da mạn tính như chàm, vảy nến, lupus.',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,30),
 ('svc-derm-infection','Khám nhiễm trùng, nấm và ký sinh trùng da','300000','Đánh giá tổn thương nghi nhiễm khuẩn, virus, nấm hoặc ký sinh trùng.',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,30),
 ('svc-derm-leprosy','Khám và quản lý bệnh phong','400000','Khám chuyên sâu bệnh phong và theo dõi điều trị trực tiếp.',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,30),
 ('svc-derm-genetic-pediatric','Khám da liễu di truyền và nhi khoa','350000','Tư vấn bệnh da di truyền, bọng nước và bệnh da ở trẻ em.',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,30),
 ('svc-derm-lesions-cosmetic','Khám nốt ruồi, sắc tố và tổn thương lành tính','300000','Tư vấn nốt ruồi, dày sừng, tổn thương mạch máu và nhu cầu thẩm mỹ da.',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,30)
ON CONFLICT ("id") DO UPDATE SET "name"=EXCLUDED."name", "price"=EXCLUDED."price", "description"=EXCLUDED."description", "isActive"=true, "updatedAt"=CURRENT_TIMESTAMP, "durationMinutes"=EXCLUDED."durationMinutes";

WITH labels(code,en,vi,grp,risk,doctor) AS (VALUES
 ('0','Basal Cell Carcinoma','Ung thư tế bào đáy','ONCOLOGY','RED','demo_doctor_oncology'),('12','Melanoma','Ung thư hắc tố da','ONCOLOGY','RED','demo_doctor_oncology'),('14','Mycosis Fungoides','U sùi dạng nấm / ung thư hạch T','ONCOLOGY','RED','demo_doctor_oncology'),('29','squamous cell carcinoma','Ung thư tế bào vảy','ONCOLOGY','RED','demo_doctor_oncology'),
 ('1','Darier disease','Bệnh Darier','GENETIC_PEDIATRIC','YELLOW','demo_doctor_genetic'),('2','Epidermolysis bullosa','Ly thượng bì bọng nước','GENETIC_PEDIATRIC','YELLOW','demo_doctor_genetic'),('3','Hailey-Hailey disease','Bệnh Hailey-Hailey','GENETIC_PEDIATRIC','YELLOW','demo_doctor_genetic'),('15','Neurofibromatosis','U xơ thần kinh','GENETIC_PEDIATRIC','YELLOW','demo_doctor_genetic'),
 ('7','Leprosy Borderline','Phong trung gian','LEPROSY','YELLOW','demo_doctor_leprosy'),('8','Leprosy Lepromatous','Phong ác tính','LEPROSY','YELLOW','demo_doctor_leprosy'),('9','Leprosy Tuberculoid','Phong củ','LEPROSY','YELLOW','demo_doctor_leprosy'),
 ('10','Lichen Planus','Lichen phẳng','INFLAMMATORY','GREEN','demo_doctor_inflammatory'),('11','Lupus Erythematosus Chronicus Discoides','Lupus ban dạng đĩa','INFLAMMATORY','YELLOW','demo_doctor_inflammatory'),('18','Pityriasis Rosea','Vảy phấn hồng','INFLAMMATORY','GREEN','demo_doctor_inflammatory'),('20','Psoriasis','Vảy nến','INFLAMMATORY','GREEN','demo_doctor_inflammatory'),
 ('4','Herpes','Herpes','INFECTION','GREEN','demo_doctor_infection'),('5','Impetigo','Chốc lở','INFECTION','GREEN','demo_doctor_infection'),('6','Cutaneous Larva Migrans','Ấu trùng di chuyển','INFECTION','GREEN','demo_doctor_infection'),('13','Molluscum Contagiosum','U mềm lây','INFECTION','GREEN','demo_doctor_infection'),('17','Pediculosis','Chấy','INFECTION','GREEN','demo_doctor_infection'),('21','Tinea Corporis','Hắc lào','INFECTION','GREEN','demo_doctor_infection'),('22','Black Fungus','Nấm đen','INFECTION','GREEN','demo_doctor_infection'),('23','Sand Flea','Bọ chét cát','INFECTION','GREEN','demo_doctor_infection'),
 ('16','Lattice-like Lesion','Sùi dạng lưới','LESIONS_COSMETIC','GREEN','demo_doctor_lesions'),('19','Stucco Keratosis','Dày sừng thành dải','LESIONS_COSMETIC','GREEN','demo_doctor_lesions'),('24','Actinic Keratosis','Dày sừng quang hóa','LESIONS_COSMETIC','YELLOW','demo_doctor_lesions'),('25','Dermatofibroma','U xơ da','LESIONS_COSMETIC','GREEN','demo_doctor_lesions'),('26','Nevus','Nốt ruồi','LESIONS_COSMETIC','GREEN','demo_doctor_lesions'),('27','Acanthosis Nigricans','Dày sừng tăng sắc tố','LESIONS_COSMETIC','GREEN','demo_doctor_lesions'),('28','Seborrheic Keratosis','Dày sừng tiết bã','LESIONS_COSMETIC','GREEN','demo_doctor_lesions'),('30','Vascular Lesion','Tổn thương mạch máu','LESIONS_COSMETIC','GREEN','demo_doctor_lesions'))
INSERT INTO "doctor_expertise_labels" ("id","doctorId","modelCode","labelEn","labelVi","groupCode","riskLevel","aliases")
SELECT 'label-'||doctor||'-'||code,doctor,code,en,vi,grp,risk,ARRAY[en,vi]::TEXT[] FROM labels
ON CONFLICT ("doctorId","modelCode") DO UPDATE SET "labelEn"=EXCLUDED."labelEn", "labelVi"=EXCLUDED."labelVi", "groupCode"=EXCLUDED."groupCode", "riskLevel"=EXCLUDED."riskLevel", "aliases"=EXCLUDED."aliases", "updatedAt"=CURRENT_TIMESTAMP;

INSERT INTO "doctor_service_assignments" ("id","doctorId","serviceId","reason") VALUES
 ('assign-oncology','demo_doctor_oncology','svc-derm-oncology','Ung thư da và tổn thương cần phẫu thuật'),
 ('assign-inflammatory','demo_doctor_inflammatory','svc-derm-inflammatory','Bệnh viêm và miễn dịch có thể cùng theo dõi tại chuyên khoa da liễu'),
 ('assign-infection','demo_doctor_infection','svc-derm-infection','Nhiễm khuẩn, virus, nấm và ký sinh trùng da'),
 ('assign-leprosy','demo_doctor_leprosy','svc-derm-leprosy','Bệnh phong cần bác sĩ chuyên trách'),
 ('assign-genetic','demo_doctor_genetic','svc-derm-genetic-pediatric','Bệnh da di truyền và bệnh da trẻ em'),
 ('assign-lesions','demo_doctor_lesions','svc-derm-lesions-cosmetic','Tổn thương lành tính, sắc tố và thẩm mỹ')
ON CONFLICT ("doctorId","serviceId") DO UPDATE SET "reason"=EXCLUDED."reason", "isActive"=true, "updatedAt"=CURRENT_TIMESTAMP;
