CREATE TABLE IF NOT EXISTS "clinic_faq" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "keywords" TEXT[] NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clinic_faq_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "clinic_faq_question_key"
  ON "clinic_faq"("question");

CREATE INDEX IF NOT EXISTS "clinic_faq_isActive_idx"
  ON "clinic_faq"("isActive");

INSERT INTO "clinic_faq" ("id", "question", "answer", "keywords", "isActive", "createdAt")
VALUES
  (
    gen_random_uuid()::text,
    'Phòng khám làm việc vào thời gian nào?',
    'Phòng khám làm việc theo lịch của từng bác sĩ. Bạn có thể xem các khung giờ còn trống khi đặt lịch trên website.',
    ARRAY['gio lam viec', 'lich lam viec', 'mo cua', 'thoi gian', 'working hour'],
    true,
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'Tôi có thể đặt lịch khám như thế nào?',
    'Bạn có thể đặt lịch trực tiếp trên website bằng cách chọn dịch vụ, bác sĩ, ngày giờ phù hợp và xác nhận thông tin.',
    ARRAY['dat lich', 'booking', 'hen kham', 'lich hen', 'dang ky kham'],
    true,
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'Phòng khám hỗ trợ thanh toán bằng hình thức nào?',
    'Hệ thống hỗ trợ thanh toán chuyển khoản qua mã QR SePay và tùy chọn thanh toán tại phòng khám nếu lịch hẹn cho phép.',
    ARRAY['thanh toan', 'chuyen khoan', 'qr', 'sepay', 'tra tien'],
    true,
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'Tôi có thể hủy lịch hẹn không?',
    'Bạn có thể kiểm tra trạng thái lịch hẹn trong tài khoản bệnh nhân. Nếu cần hỗ trợ hủy hoặc đổi lịch, vui lòng liên hệ nhân viên phòng khám.',
    ARRAY['huy lich', 'doi lich', 'cancel', 'reschedule', 'hoan lich'],
    true,
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'Tôi xem thông tin dịch vụ ở đâu?',
    'Thông tin dịch vụ, giá và thời lượng khám được hiển thị trong phần Dịch vụ và trong luồng đặt lịch trên website.',
    ARRAY['dich vu', 'gia', 'bang gia', 'thoi luong', 'service'],
    true,
    NOW()
  )
ON CONFLICT ("question") DO NOTHING;
