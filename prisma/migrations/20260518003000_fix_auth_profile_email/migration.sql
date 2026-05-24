-- Ensure auth sign-up always creates or repairs the matching public profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metadata_birth_year integer;
BEGIN
  IF NEW.raw_user_meta_data ? 'birth_year'
     AND (NEW.raw_user_meta_data->>'birth_year') ~ '^[0-9]{4}$'
  THEN
    metadata_birth_year := (NEW.raw_user_meta_data->>'birth_year')::integer;
  ELSE
    metadata_birth_year := NULL;
  END IF;

  INSERT INTO public.profiles (
    id,
    supabase_user_id,
    email,
    phone,
    "fullName",
    "birthYear",
    province,
    district,
    role,
    "createdAt",
    "updatedAt"
  )
  VALUES (
    gen_random_uuid()::text,
    NEW.id::text,
    COALESCE(NULLIF(NEW.email, ''), NULLIF(NEW.raw_user_meta_data->>'email', '')),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Người dùng mới'),
    metadata_birth_year,
    NULLIF(NEW.raw_user_meta_data->>'province', ''),
    NULLIF(NEW.raw_user_meta_data->>'district', ''),
    'PATIENT'::"Role",
    NOW(),
    NOW()
  )
  ON CONFLICT (supabase_user_id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    "fullName" = COALESCE(NULLIF(public.profiles."fullName", ''), EXCLUDED."fullName"),
    "birthYear" = COALESCE(public.profiles."birthYear", EXCLUDED."birthYear"),
    province = COALESCE(public.profiles.province, EXCLUDED.province),
    district = COALESCE(public.profiles.district, EXCLUDED.district),
    "updatedAt" = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill users that were created in Auth while the profile trigger was missing
-- or before email/metadata fields were copied.
INSERT INTO public.profiles (
  id,
  supabase_user_id,
  email,
  phone,
  "fullName",
  "birthYear",
  province,
  district,
  role,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  users.id::text,
  COALESCE(NULLIF(users.email, ''), NULLIF(users.raw_user_meta_data->>'email', '')),
  NULLIF(users.raw_user_meta_data->>'phone', ''),
  COALESCE(NULLIF(users.raw_user_meta_data->>'full_name', ''), 'Người dùng mới'),
  CASE
    WHEN users.raw_user_meta_data ? 'birth_year'
       AND (users.raw_user_meta_data->>'birth_year') ~ '^[0-9]{4}$'
    THEN (users.raw_user_meta_data->>'birth_year')::integer
    ELSE NULL
  END,
  NULLIF(users.raw_user_meta_data->>'province', ''),
  NULLIF(users.raw_user_meta_data->>'district', ''),
  'PATIENT'::"Role",
  NOW(),
  NOW()
FROM auth.users AS users
ON CONFLICT (supabase_user_id) DO UPDATE SET
  email = COALESCE(EXCLUDED.email, public.profiles.email),
  phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
  "fullName" = COALESCE(NULLIF(public.profiles."fullName", ''), EXCLUDED."fullName"),
  "birthYear" = COALESCE(public.profiles."birthYear", EXCLUDED."birthYear"),
  province = COALESCE(public.profiles.province, EXCLUDED.province),
  district = COALESCE(public.profiles.district, EXCLUDED.district),
  "updatedAt" = NOW();
