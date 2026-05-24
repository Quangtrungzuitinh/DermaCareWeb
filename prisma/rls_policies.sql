-- ================================================
-- Bật RLS cho tất cả bảng
-- ================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedule_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- Helper function: lấy role của user hiện tại
-- STABLE: Postgres cache kết quả trong cùng transaction → tối ưu hiệu năng
-- ================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.profiles
  WHERE supabase_user_id = auth.uid()::text;
$$;

-- ================================================
-- PROFILES
-- ================================================
CREATE POLICY "profiles: user xem profile của mình"
  ON public.profiles FOR SELECT
  USING (supabase_user_id = auth.uid()::text);

CREATE POLICY "profiles: user update profile của mình"
  ON public.profiles FOR UPDATE
  USING (supabase_user_id = auth.uid()::text);

CREATE POLICY "profiles: admin và staff xem tất cả"
  ON public.profiles FOR SELECT
  USING (get_my_role() IN ('ADMIN', 'STAFF'));

-- ================================================
-- APPOINTMENTS
-- ================================================
CREATE POLICY "appointments: patient xem lịch của mình"
  ON public.appointments FOR SELECT
  USING (
    "patientId" IN (
      SELECT id FROM public.profiles WHERE supabase_user_id = auth.uid()::text
    )
  );

CREATE POLICY "appointments: staff/admin toàn quyền"
  ON public.appointments
  USING (get_my_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "appointments: doctor xem lịch của mình"
  ON public.appointments FOR SELECT
  USING (
    "doctorId" IN (
      SELECT dp.id FROM public.doctor_profiles dp
      JOIN public.profiles p ON dp."profileId" = p.id
      WHERE p.supabase_user_id = auth.uid()::text
    )
  );

-- ================================================
-- SERVICES: public catalog — mọi người đọc được
-- ================================================
CREATE POLICY "services: mọi người đọc được"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "services: admin toàn quyền"
  ON public.services
  USING (get_my_role() = 'ADMIN');

-- ================================================
-- DOCTOR_PROFILES & SCHEDULE_RULES: public read
-- ================================================
CREATE POLICY "doctor_profiles: mọi người đọc được"
  ON public.doctor_profiles FOR SELECT
  USING (true);

CREATE POLICY "doctor_schedule_rules: mọi người đọc được"
  ON public.doctor_schedule_rules FOR SELECT
  USING (true);

CREATE POLICY "doctor_blocked_slots: admin/staff toàn quyền"
  ON public.doctor_blocked_slots
  USING (get_my_role() IN ('ADMIN', 'STAFF', 'DOCTOR'));

-- ================================================
-- MEDICAL_RECORDS: nhạy cảm — phân quyền chặt
-- ================================================
CREATE POLICY "medical_records: patient xem của mình"
  ON public.medical_records FOR SELECT
  USING (
    "patientId" IN (
      SELECT id FROM public.profiles WHERE supabase_user_id = auth.uid()::text
    )
  );

CREATE POLICY "medical_records: doctor xem ca của mình"
  ON public.medical_records FOR SELECT
  USING (
    "appointmentId" IN (
      SELECT a.id FROM public.appointments a
      JOIN public.doctor_profiles dp ON a."doctorId" = dp.id
      JOIN public.profiles p ON dp."profileId" = p.id
      WHERE p.supabase_user_id = auth.uid()::text
    )
  );

CREATE POLICY "medical_records: doctor update ca của mình"
  ON public.medical_records FOR UPDATE
  USING (
    "appointmentId" IN (
      SELECT a.id FROM public.appointments a
      JOIN public.doctor_profiles dp ON a."doctorId" = dp.id
      JOIN public.profiles p ON dp."profileId" = p.id
      WHERE p.supabase_user_id = auth.uid()::text
    )
  );

CREATE POLICY "medical_records: staff chỉ đọc"
  ON public.medical_records FOR SELECT
  USING (get_my_role() = 'STAFF');

CREATE POLICY "medical_records: admin toàn quyền"
  ON public.medical_records
  USING (get_my_role() = 'ADMIN');

-- ================================================
-- PAYMENTS: staff/admin đọc, không ai tự tạo được từ client
-- ================================================
CREATE POLICY "payments: staff/admin toàn quyền"
  ON public.payments
  USING (get_my_role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "payments: patient xem payment của mình"
  ON public.payments FOR SELECT
  USING (
    "appointmentId" IN (
      SELECT a.id FROM public.appointments a
      JOIN public.profiles p ON a."patientId" = p.id
      WHERE p.supabase_user_id = auth.uid()::text
    )
  );

-- ================================================
-- TREATMENTS: bác sĩ và staff đọc, chỉ doctor tạo/sửa
-- ================================================
CREATE POLICY "treatments: doctor toàn quyền ca của mình"
  ON public.treatments
  USING (
    "medicalRecordId" IN (
      SELECT mr.id FROM public.medical_records mr
      JOIN public.appointments a ON mr."appointmentId" = a.id
      JOIN public.doctor_profiles dp ON a."doctorId" = dp.id
      JOIN public.profiles p ON dp."profileId" = p.id
      WHERE p.supabase_user_id = auth.uid()::text
    )
  );

CREATE POLICY "treatments: staff đọc để in hóa đơn"
  ON public.treatments FOR SELECT
  USING (get_my_role() IN ('STAFF', 'ADMIN'));

-- ================================================
-- AUDIT_LOGS: only ADMIN can read; no client INSERT/UPDATE/DELETE policies
-- ================================================
CREATE POLICY "admin_read_audit"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.supabase_user_id = auth.uid()::text
        AND profiles.role = 'ADMIN'::"Role"
    )
  );
