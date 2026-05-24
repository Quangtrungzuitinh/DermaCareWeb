-- ================================================
-- Trigger: Tự động tạo Profile khi user đăng ký Auth
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    supabase_user_id,
    "fullName",
    role,
    "createdAt",
    "updatedAt"
  )
  VALUES (
    gen_random_uuid()::text,
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Người dùng mới'),
    'PATIENT'::"Role",
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();