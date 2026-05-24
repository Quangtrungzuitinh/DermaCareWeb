-- ============================================
-- CLEANUP SCRIPT: Remove RLS Policies & Triggers
-- ============================================

-- Disable RLS on all tables
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS treatments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS doctor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS doctor_schedule_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS doctor_blocked_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS background_jobs DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || 
            quote_ident(pol.schemaname) || '.' || quote_ident(pol.tablename);
  END LOOP;
END $$;

-- Drop trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_my_role();

-- Drop enum types
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "DoctorLevel" CASCADE;
DROP TYPE IF EXISTS "AppointmentStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
DROP TYPE IF EXISTS "ConfirmationSource" CASCADE;
DROP TYPE IF EXISTS "DayOfWeek" CASCADE;

-- Clear all data from tables (in order to respect foreign keys)
TRUNCATE TABLE background_jobs CASCADE;
TRUNCATE TABLE doctor_blocked_slots CASCADE;
TRUNCATE TABLE doctor_schedule_rules CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE doctor_profiles CASCADE;
TRUNCATE TABLE treatments CASCADE;
TRUNCATE TABLE medical_records CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Reset sequences
ALTER SEQUENCE IF EXISTS services_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS treatments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS medical_records_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS appointments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS doctor_schedule_rules_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS doctor_blocked_slots_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS background_jobs_id_seq RESTART WITH 1;
