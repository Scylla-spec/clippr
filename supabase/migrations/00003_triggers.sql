-- =============================================================================
-- Migration 00003: Triggers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Auto-create a profile row when a new auth user is inserted.
--    The Edge Function (Step 4) calls admin.createUser() and then immediately
--    upserts the profile with the correct role and full_name.
--    This trigger is a safety net for any other signup path.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
-- Only run with the permissions of the function owner (postgres), not the
-- calling role, so the trigger can write to profiles even from the auth schema.
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'barber')
  )
  ON CONFLICT (id) DO NOTHING; -- Edge Function may have already inserted
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Keep bookings.updated_at current automatically.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Validate status transitions.
--
-- Allowed transitions (directed graph):
--
--   booked  ──► waiting   ──► in_service ──► done
--   booked  ──► in_service              ──► no_show
--   booked  ──► cancelled
--   waiting ──► cancelled
--   waiting ──► no_show
--   in_service ──► cancelled  (edge case: cancel mid-service)
--
-- Denied: any terminal → anything, done → *, no_show → *, cancelled → *
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_booking_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_old public.booking_status := OLD.status;
  v_new public.booking_status := NEW.status;
BEGIN
  -- No-op if status did not change
  IF v_old = v_new THEN
    RETURN NEW;
  END IF;

  -- Terminal statuses: no transitions out
  IF v_old IN ('done', 'no_show', 'cancelled') THEN
    RAISE EXCEPTION
      'booking status transition % → % is not allowed (% is terminal)',
      v_old, v_new, v_old
    USING ERRCODE = 'P0001';
  END IF;

  -- Allowed transitions per source status
  IF v_old = 'booked' AND v_new IN ('waiting', 'in_service', 'cancelled') THEN
    RETURN NEW;
  END IF;

  IF v_old = 'waiting' AND v_new IN ('in_service', 'cancelled', 'no_show') THEN
    RETURN NEW;
  END IF;

  IF v_old = 'in_service' AND v_new IN ('done', 'no_show', 'cancelled') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'booking status transition % → % is not allowed',
    v_old, v_new
  USING ERRCODE = 'P0001';
END;
$$;

CREATE TRIGGER bookings_validate_status_transition
  BEFORE UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_status_transition();

-- ---------------------------------------------------------------------------
-- 4. Derive and lock end_time.
--    end_time is computed from start_time + service.duration_min at INSERT
--    and cannot be changed directly after creation.
--    (Changing start_time requires cancelling and re-booking.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_booking_end_time()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_duration integer;
BEGIN
  SELECT duration_min INTO v_duration
  FROM public.services
  WHERE id = NEW.service_id;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Service % not found', NEW.service_id
    USING ERRCODE = 'P0002';
  END IF;

  NEW.end_time := NEW.start_time + (v_duration * INTERVAL '1 minute');
  RETURN NEW;
END;
$$;

-- On INSERT: always compute end_time from service duration
CREATE TRIGGER bookings_set_end_time_insert
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_end_time();

-- On UPDATE of start_time: recompute end_time
CREATE TRIGGER bookings_set_end_time_update
  BEFORE UPDATE OF start_time ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_end_time();
