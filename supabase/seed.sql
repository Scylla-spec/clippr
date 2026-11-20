-- =============================================================================
-- seed.sql — Local development seed data
--
-- Creates:
--   • 1 admin user
--   • No pre-created barber users
--   • 4 services
--
-- HOW TO RUN:
--   pnpm supabase db reset     ← wipes and re-runs all migrations + this seed
--
-- USERS CREATED (local development only):
--   admin@infinitybarbers.local   → admin role
--
-- WARNING: Never run this against a production database.
-- =============================================================================

-- Use Supabase's internal function to create auth users with known UUIDs
-- so foreign keys in bookings are predictable across resets.

DO $$
DECLARE
  v_admin_id  uuid := '00000000-0000-0000-0000-000000000001';
  v_svc_cut   uuid := '10000000-0000-0000-0000-000000000001';
  v_svc_shave uuid := '10000000-0000-0000-0000-000000000002';
  v_svc_beard uuid := '10000000-0000-0000-0000-000000000003';
  v_svc_combo uuid := '10000000-0000-0000-0000-000000000004';

BEGIN

  -- ── Auth users ──────────────────────────────────────────────────────────
  -- Insert directly into auth.users (local dev only; use Edge Function in prod)

  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES
  (
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
  ON CONFLICT (id) DO NOTHING;

  -- ── Profiles ─────────────────────────────────────────────────────────────
  -- The trigger inserts these automatically, but we upsert to ensure correct role.
  INSERT INTO public.profiles (id, full_name, role, is_active) VALUES
    (v_admin_id, 'Shop Admin', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role      = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

  -- ── Services ─────────────────────────────────────────────────────────────
  INSERT INTO public.services (id, name, duration_min, price, is_active) VALUES
    (v_svc_cut,   'Haircut',           30, 5.00,  true),
    (v_svc_shave, 'Hot Towel Shave',   20, 3.00,  true),
    (v_svc_beard, 'Beard Trim',        15, 2.00,  true),
    (v_svc_combo, 'Haircut + Shave',   45, 7.50,  true)
  ON CONFLICT (id) DO NOTHING;

END $$;
