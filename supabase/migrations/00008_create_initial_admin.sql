-- Create the initial production administrator.
-- This migration is idempotent and creates no sample bookings, clients, or barbers.

DO $$
DECLARE
  v_admin_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@infinitybarbers.local',
    '$2b$10$x7uxa6Xv2A5BBZYupDlc6eEDFCwQNzTyl9nffGvca0dEl7AD/LLqa',
    now(), now(), now(),
    '{"full_name": "Shop Admin", "role": "admin"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', '', '', ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    updated_at = now();

  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_admin_id, 'Shop Admin', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = 'admin',
    is_active = true;
END $$;
