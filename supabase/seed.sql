-- =============================================================================
-- seed.sql — Local development seed data
--
-- Creates:
--   • 1 admin user
--   • 2 barber users
--   • 4 services
--   • 4 clients
--   • Sample bookings for today
--
-- HOW TO RUN:
--   pnpm supabase db reset     ← wipes and re-runs all migrations + this seed
--
-- USERS CREATED (password: "password123" for all — local dev only):
--   admin@infinitybarbers.local   → admin role
--   tendai@infinitybarbers.local  → barber role
--   rudo@infinitybarbers.local    → barber role
--
-- WARNING: Never run this against a production database.
-- =============================================================================

-- Use Supabase's internal function to create auth users with known UUIDs
-- so foreign keys in bookings are predictable across resets.

DO $$
DECLARE
  v_admin_id  uuid := '00000000-0000-0000-0000-000000000001';
  v_barber1   uuid := '00000000-0000-0000-0000-000000000002';
  v_barber2   uuid := '00000000-0000-0000-0000-000000000003';

  v_svc_cut   uuid := '10000000-0000-0000-0000-000000000001';
  v_svc_shave uuid := '10000000-0000-0000-0000-000000000002';
  v_svc_beard uuid := '10000000-0000-0000-0000-000000000003';
  v_svc_combo uuid := '10000000-0000-0000-0000-000000000004';

  v_client1   uuid := '20000000-0000-0000-0000-000000000001';
  v_client2   uuid := '20000000-0000-0000-0000-000000000002';
  v_client3   uuid := '20000000-0000-0000-0000-000000000003';
  v_client4   uuid := '20000000-0000-0000-0000-000000000004';

  -- Today in Africa/Harare, as UTC
  v_today     date := (now() AT TIME ZONE 'Africa/Harare')::date;
  v_tz_offset interval := INTERVAL '2 hours'; -- Africa/Harare is UTC+2 (no DST)
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
    crypt('password123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "Shop Admin", "role": "admin"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', '', '', ''
  ),
  (
    v_barber1,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'tendai@infinitybarbers.local',
    crypt('password123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "Tendai Moyo", "role": "barber"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', '', '', ''
  ),
  (
    v_barber2,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'rudo@infinitybarbers.local',
    crypt('password123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "Rudo Chikwanda", "role": "barber"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', '', '', ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── Profiles ─────────────────────────────────────────────────────────────
  -- The trigger inserts these automatically, but we upsert to ensure correct role.
  INSERT INTO public.profiles (id, full_name, role, is_active) VALUES
    (v_admin_id, 'Shop Admin',     'admin',  true),
    (v_barber1,  'Tendai Moyo',    'barber', true),
    (v_barber2,  'Rudo Chikwanda', 'barber', true)
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

  -- ── Clients ──────────────────────────────────────────────────────────────
  INSERT INTO public.clients (id, full_name, phone) VALUES
    (v_client1, 'Farai Mutasa',    '+263771000001'),
    (v_client2, 'Blessing Dube',   '+263772000002'),
    (v_client3, 'Tatenda Ncube',   '+263773000003'),
    (v_client4, 'Simba Zvobgo',    '+263774000004')
  ON CONFLICT (id) DO NOTHING;

  -- ── Bookings (today, Africa/Harare) ──────────────────────────────────────
  -- Tendai's queue:
  --   09:00 Farai   haircut    (booked)
  --   09:30 Blessing shave     (in_service)
  --   10:00 Tatenda  beard trim (booked)
  --
  -- Rudo's queue:
  --   09:00 Simba   combo      (booked)

  INSERT INTO public.bookings (
    id, client_id, barber_id, service_id,
    start_time, end_time, status, source, created_by
  ) VALUES
  (
    gen_random_uuid(), v_client1, v_barber1, v_svc_cut,
    (v_today + TIME '09:00:00') - v_tz_offset,
    (v_today + TIME '09:30:00') - v_tz_offset,
    'booked', 'appointment', v_admin_id
  ),
  (
    gen_random_uuid(), v_client2, v_barber1, v_svc_shave,
    (v_today + TIME '09:30:00') - v_tz_offset,
    (v_today + TIME '09:50:00') - v_tz_offset,
    'in_service', 'walk_in', v_admin_id
  ),
  (
    gen_random_uuid(), v_client3, v_barber1, v_svc_beard,
    (v_today + TIME '10:00:00') - v_tz_offset,
    (v_today + TIME '10:15:00') - v_tz_offset,
    'booked', 'appointment', v_admin_id
  ),
  (
    gen_random_uuid(), v_client4, v_barber2, v_svc_combo,
    (v_today + TIME '09:00:00') - v_tz_offset,
    (v_today + TIME '09:45:00') - v_tz_offset,
    'booked', 'appointment', v_admin_id
  );

  -- NOTE: end_time above is set explicitly to match the trigger's calculation.
  -- In production, only start_time is provided; the trigger derives end_time.
  -- The seed bypasses the trigger by providing end_time directly (valid for seeding).

END $$;
