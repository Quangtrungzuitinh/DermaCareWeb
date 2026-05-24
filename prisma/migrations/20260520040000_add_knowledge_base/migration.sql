CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "knowledge_base" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" vector(1536),
  "metadata" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_base_title_key"
  ON "knowledge_base"("title");

CREATE INDEX IF NOT EXISTS "knowledge_base_category_isActive_idx"
  ON "knowledge_base"("category", "isActive");

CREATE INDEX IF NOT EXISTS "knowledge_base_isActive_idx"
  ON "knowledge_base"("isActive");

CREATE INDEX IF NOT EXISTS "knowledge_base_embedding_idx"
  ON "knowledge_base"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100)
  WHERE "embedding" IS NOT NULL;

INSERT INTO "knowledge_base" ("id", "category", "title", "content", "metadata", "isActive", "createdAt")
VALUES
  (
    gen_random_uuid()::text,
    'policy',
    'Chính sách đặt lịch và đổi lịch',
    'Bệnh nhân có thể đặt lịch trên website bằng cách chọn dịch vụ, bác sĩ và khung giờ phù hợp. Nếu cần đổi lịch hoặc hủy lịch, bệnh nhân nên liên hệ nhân viên phòng khám để được hỗ trợ kiểm tra trạng thái lịch hẹn và phương án xử lý phù hợp.',
    '{"source":"phase2_seed"}'::jsonb,
    true,
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'policy',
    'Hướng dẫn thanh toán lịch hẹn',
    'Hệ thống hỗ trợ thanh toán chuyển khoản bằng mã QR SePay. Một số lịch hẹn có thể cho phép thanh toán tại phòng khám tùy theo thiết lập của hệ thống. Bệnh nhân nên kiểm tra màn hình xác nhận hoặc trang thanh toán của lịch hẹn.',
    '{"source":"phase2_seed"}'::jsonb,
    true,
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'aftercare',
    'Chăm sóc da sau điều trị mụn',
    'Sau buổi điều trị mụn, bệnh nhân nên giữ da sạch, tránh tự nặn mụn, hạn chế trang điểm dày trong ngày đầu và sử dụng kem chống nắng khi ra ngoài. Nếu da đỏ rát kéo dài hoặc có dấu hiệu bất thường, bệnh nhân nên liên hệ phòng khám để được hướng dẫn.',
    '{"source":"phase2_seed","topic":"acne"}'::jsonb,
    true,
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'aftercare',
    'Chăm sóc da sau laser hoặc peel',
    'Sau laser hoặc chemical peel, da có thể nhạy cảm hơn bình thường. Bệnh nhân nên tránh nắng trực tiếp, không tẩy da chết mạnh, không dùng hoạt chất treatment khi chưa được hướng dẫn và ưu tiên dưỡng ẩm phục hồi. Thông tin này chỉ mang tính hướng dẫn, không thay thế tư vấn của bác sĩ.',
    '{"source":"phase2_seed","topic":"laser_peel"}'::jsonb,
    true,
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'service',
    'Tư vấn chọn dịch vụ da liễu',
    'Nếu chưa biết chọn dịch vụ nào, bệnh nhân nên bắt đầu bằng khám da liễu tổng quát hoặc tư vấn với bác sĩ. Bác sĩ sẽ đánh giá tình trạng da và đề xuất dịch vụ phù hợp như điều trị mụn, laser, peel, chăm sóc da cơ bản hoặc các liệu trình chuyên sâu khác.',
    '{"source":"phase2_seed"}'::jsonb,
    true,
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'faq',
    'Giới hạn tư vấn của chatbot',
    'Chatbot chỉ hỗ trợ thông tin chung về phòng khám, dịch vụ, lịch làm việc, chính sách và hướng dẫn chăm sóc cơ bản. Chatbot không chẩn đoán bệnh, không kê đơn và không thay thế tư vấn y tế trực tiếp từ bác sĩ.',
    '{"source":"phase2_seed"}'::jsonb,
    true,
    NOW()
  )
ON CONFLICT ("title") DO NOTHING;
