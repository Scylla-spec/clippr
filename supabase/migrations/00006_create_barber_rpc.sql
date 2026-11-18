-- =============================================================================
-- Migration 00006: Direct create_barber RPC procedure
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_barber(
  new_email text,
  new_full_name text,
  new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_new_id uuid := gen_random_uuid();
  v_profile jsonb;
BEGIN
  IF public.auth_role() != 'admin' THEN
    RAISE EXCEPTION 'Forbidden: only active administrators can create barbers';
  END IF;

  IF new_email IS NULL OR new_password IS NULL OR new_full_name IS NULL THEN
    RAISE EXCEPTION 'email, password, and full_name are required';
  END IF;

  IF length(new_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(new_email))) THEN
    RAISE EXCEPTION 'A user with this email already exists';
  END IF;

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    raw_app_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    v_new_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    lower(trim(new_email)),
    crypt(new_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('full_name', trim(new_full_name), 'role', 'barber'),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', '', '', ''
  );

  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_new_id, trim(new_full_name), 'barber', true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = 'barber',
    is_active = true;

  SELECT to_jsonb(p) INTO v_profile FROM public.profiles p WHERE p.id = v_new_id;
  RETURN v_profile;
END;
$$;

-- Alternate parameter order used by older clients.
CREATE OR REPLACE FUNCTION public.create_barber(
  new_email text,
  new_password text,
  new_full_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN public.create_barber(new_email, new_full_name, new_password);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_barber(text, text, text) TO authenticated;
NOTIFY pgrst, 'reload schema';
