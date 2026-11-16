-- =============================================================================
-- rls_tests.sql — Prove RLS policies work correctly
--
-- Run this AFTER seeding: pnpm supabase db reset
-- Then execute these queries in Supabase Studio SQL editor or psql.
--
-- Each test prints PASS or FAIL and the reason.
-- =============================================================================

-- ── Setup: local variables ───────────────────────────────────────────────────
DO $$
DECLARE
  v_admin_id uuid := '00000000-0000-0000-0000-000000000001';
  v_barber1  uuid := '00000000-0000-0000-0000-000000000002';
  v_barber2  uuid := '00000000-0000-0000-0000-000000000003';
  v_count    integer;
  v_ok       boolean;
BEGIN

  RAISE NOTICE '=== RLS TEST SUITE ===';

  -- ── TEST 1: Barber can read own bookings ─────────────────────────────────
  -- Simulate barber1 session
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_barber1, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  SELECT count(*) INTO v_count
  FROM public.bookings
  WHERE barber_id = v_barber1;

  v_ok := v_count = 3; -- seed inserts 3 bookings for barber1
  RAISE NOTICE 'TEST 1 — Barber reads own bookings: % (count=%)', CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END, v_count;

  -- ── TEST 2: Barber CANNOT read other barber's bookings ───────────────────
  SELECT count(*) INTO v_count
  FROM public.bookings
  WHERE barber_id = v_barber2; -- barber1 session, querying barber2's rows

  v_ok := v_count = 0; -- Should see 0 (RLS blocks it)
  RAISE NOTICE 'TEST 2 — Barber cannot read other barber bookings: % (count=%)', CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END, v_count;

  -- ── TEST 3: Admin can read all bookings ───────────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id, 'role', 'authenticated')::text, true);

  SELECT count(*) INTO v_count FROM public.bookings;

  v_ok := v_count = 4; -- seed inserts 4 bookings total
  RAISE NOTICE 'TEST 3 — Admin reads all bookings: % (count=%)', CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END, v_count;

  -- ── TEST 4: Barber cannot INSERT a booking ────────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_barber1, 'role', 'authenticated')::text, true);

  BEGIN
    INSERT INTO public.bookings (client_id, barber_id, service_id, start_time, end_time, source, created_by)
    VALUES (
      '20000000-0000-0000-0000-000000000001',
      v_barber1,
      '10000000-0000-0000-0000-000000000001',
      now() + INTERVAL '2 hours',
      now() + INTERVAL '2 hours 30 minutes',
      'walk_in',
      v_barber1
    );
    RAISE NOTICE 'TEST 4 — Barber cannot INSERT booking: FAIL (insert succeeded, should have been blocked)';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 4 — Barber cannot INSERT booking: PASS (blocked with: %)', SQLERRM;
  END;

  -- ── TEST 5: Status transition — booked → done is ILLEGAL ─────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id, 'role', 'authenticated')::text, true);

  BEGIN
    UPDATE public.bookings
    SET status = 'done'
    WHERE barber_id = v_barber1 AND status = 'booked'
    LIMIT 1; -- Try skipping straight to done
    RAISE NOTICE 'TEST 5 — Illegal transition booked→done: FAIL (should have been blocked by trigger)';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 5 — Illegal transition booked→done blocked: PASS (error: %)', SQLERRM;
  END;

  -- ── TEST 6: Status transition — in_service → done is LEGAL ───────────────
  BEGIN
    UPDATE public.bookings
    SET status = 'done'
    WHERE barber_id = v_barber1 AND status = 'in_service';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_ok := v_count = 1;
    RAISE NOTICE 'TEST 6 — Legal transition in_service→done: % (rows updated=%)', CASE WHEN v_ok THEN 'PASS' ELSE 'FAIL' END, v_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 6 — Legal transition in_service→done: FAIL (unexpected error: %)', SQLERRM;
  END;

  -- ── TEST 7: Barber can only update status (not start_time) ───────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_barber1, 'role', 'authenticated')::text, true);

  BEGIN
    UPDATE public.bookings
    SET start_time = start_time + INTERVAL '1 hour'
    WHERE barber_id = v_barber1
    LIMIT 1;
    RAISE NOTICE 'TEST 7 — Barber cannot update start_time: FAIL (should have been blocked by RLS WITH CHECK)';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 7 — Barber cannot update start_time: PASS (blocked with: %)', SQLERRM;
  END;

  -- ── TEST 8: Duplicate phone on clients is rejected ────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id, 'role', 'authenticated')::text, true);

  BEGIN
    INSERT INTO public.clients (full_name, phone)
    VALUES ('Duplicate Person', '+263771000001'); -- same phone as client1
    RAISE NOTICE 'TEST 8 — Duplicate phone rejected: FAIL (insert succeeded)';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'TEST 8 — Duplicate phone rejected: PASS (unique constraint enforced)';
  END;

  -- ── TEST 9: Terminal status cannot transition ─────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id, 'role', 'authenticated')::text, true);

  -- First mark a booking as cancelled
  UPDATE public.bookings SET status = 'cancelled'
  WHERE barber_id = v_barber2 AND status = 'booked';

  BEGIN
    UPDATE public.bookings SET status = 'booked'
    WHERE barber_id = v_barber2 AND status = 'cancelled';
    RAISE NOTICE 'TEST 9 — Terminal status cannot transition: FAIL';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 9 — Terminal status cannot transition: PASS (error: %)', SQLERRM;
  END;

  RAISE NOTICE '=== END OF RLS TESTS ===';
END $$;
