-- Store complete patient registration metadata in profiles.
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
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Người dùng mới'),
    CASE
      WHEN NEW.raw_user_meta_data ? 'birth_year'
      THEN (NEW.raw_user_meta_data->>'birth_year')::int
      ELSE NULL
    END,
    NULLIF(NEW.raw_user_meta_data->>'province', ''),
    NULLIF(NEW.raw_user_meta_data->>'district', ''),
    'PATIENT'::"Role",
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;
