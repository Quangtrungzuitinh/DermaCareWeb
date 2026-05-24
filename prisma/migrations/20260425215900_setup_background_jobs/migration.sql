-- ================================================
-- Khởi tạo extension (nếu chưa có)
-- ================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ================================================
-- JOB 1: Tự động hủy PENDING_PAYMENT quá 15 phút
-- Chạy mỗi phút. Dùng NOT EXISTS chống TOCTOU.
-- ================================================
SELECT cron.schedule(
  'auto-cancel-pending-appointments',
  '* * * * *',
  $$
    UPDATE appointments
    SET
      status      = 'CANCELLED'::"AppointmentStatus",
      "updatedAt" = NOW()
    WHERE
      status = 'PENDING_PAYMENT'::"AppointmentStatus"
      AND "createdAt" < NOW() - INTERVAL '15 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM payments
        WHERE payments."appointmentId" = appointments.id
      );
  $$
);

-- ================================================
-- JOB 2: Ẩn danh hóa PII Guest sau 4 tuần (Issue #8)
-- Chạy Chủ nhật 2h sáng UTC. 
-- KHÔNG chạm vào bảng medical_records (giữ snapshot y tế).
-- ================================================
SELECT cron.schedule(
  'anonymize-guest-pii',
  '0 2 * * 0',
  $$
    UPDATE appointments
    SET
      "guestName"  = '***',
      "guestPhone" = '***',
      "guestEmail" = '***',
      "updatedAt"  = NOW()
    WHERE
      "guestName" IS NOT NULL
      AND "guestName" != '***'
      AND status IN (
        'CONFIRMED'::"AppointmentStatus",
        'COMPLETED'::"AppointmentStatus",
        'CANCELLED'::"AppointmentStatus",
        'NO_SHOW'::"AppointmentStatus"
      )
      AND "createdAt" < NOW() - INTERVAL '4 weeks';
  $$
);