-- Full database reset - drop all tables and recreate from scratch

-- Drop all tables
DROP TABLE IF EXISTS _prisma_migrations CASCADE;
DROP TABLE IF EXISTS background_jobs CASCADE;
DROP TABLE IF EXISTS doctor_blocked_slots CASCADE;
DROP TABLE IF EXISTS doctor_schedule_rules CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS treatments CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctor_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "DoctorLevel" CASCADE;
DROP TYPE IF EXISTS "AppointmentStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
DROP TYPE IF EXISTS "ConfirmationSource" CASCADE;
DROP TYPE IF EXISTS "DayOfWeek" CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_my_role();
