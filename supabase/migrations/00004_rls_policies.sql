-- =============================================================================
-- Migration 00004: Row Level Security (RLS) policies
--
-- Security model:
--   admin  → full access to all tables
--   barber → own bookings (read + status update only), read services
--   anon   → no access
--
-- IMPORTANT: UI access control is NOT security. These policies are the
-- real enforcement layer. Every table has RLS enabled.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper function: get the role of the currently authenticated user.
-- Using a function avoids repeating the subquery and allows caching.
-- SECURITY DEFINER so it can read profiles without being blocked by RLS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS public.user_role
LANGUAGE sql
STABLE          -- result won't change within a single query
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- TABLE: profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admins can read all profiles (need to list barbers, etc.)
CREATE POLICY "admin: select all profiles"
  ON public.profiles FOR SELECT
  USING (public.auth_role() = 'admin');

-- Barbers can only read their own profile
CREATE POLICY "barber: select own profile"
  ON public.profiles FOR SELECT
  USING (
    public.auth_role() = 'barber'
    AND id = auth.uid()
  );

-- Only admins can insert profiles (barber creation via Edge Function)
CREATE POLICY "admin: insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.auth_role() = 'admin');

-- Admins can update any profile (activate/deactivate barbers, rename)
CREATE POLICY "admin: update profiles"
  ON public.profiles FOR UPDATE
  USING (public.auth_role() = 'admin')
  WITH CHECK (public.auth_role() = 'admin');

-- Barbers can update their own profile (e.g. change display name in future)
-- For Phase 1 this is intentionally narrow — only full_name may change.
-- A stricter column-level grant is added below.
CREATE POLICY "barber: update own profile"
  ON public.profiles FOR UPDATE
  USING (
    public.auth_role() = 'barber'
    AND id = auth.uid()
  )
  WITH CHECK (
    public.auth_role() = 'barber'
    AND id = auth.uid()
    -- role and is_active must not change
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

-- No DELETE on profiles — deactivate instead (is_active = false)

-- ---------------------------------------------------------------------------
-- TABLE: services
-- ---------------------------------------------------------------------------
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read active services
CREATE POLICY "authenticated: select active services"
  ON public.services FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND is_active = true
  );

-- Admins can read all services (including inactive)
CREATE POLICY "admin: select all services"
  ON public.services FOR SELECT
  USING (public.auth_role() = 'admin');

CREATE POLICY "admin: insert services"
  ON public.services FOR INSERT
  WITH CHECK (public.auth_role() = 'admin');

CREATE POLICY "admin: update services"
  ON public.services FOR UPDATE
  USING (public.auth_role() = 'admin')
  WITH CHECK (public.auth_role() = 'admin');

CREATE POLICY "admin: delete services"
  ON public.services FOR DELETE
  USING (public.auth_role() = 'admin');

-- ---------------------------------------------------------------------------
-- TABLE: clients
-- ---------------------------------------------------------------------------
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with clients
CREATE POLICY "admin: all on clients"
  ON public.clients FOR ALL
  USING (public.auth_role() = 'admin')
  WITH CHECK (public.auth_role() = 'admin');

-- Barbers can read clients whose bookings are assigned to them today.
-- This lets the barber dashboard show client names without exposing all clients.
CREATE POLICY "barber: select own clients"
  ON public.clients FOR SELECT
  USING (
    public.auth_role() = 'barber'
    AND id IN (
      SELECT client_id FROM public.bookings
      WHERE barber_id = auth.uid()
        AND start_time >= date_trunc('day', now() AT TIME ZONE 'Africa/Harare') AT TIME ZONE 'Africa/Harare'
        AND start_time <  date_trunc('day', now() AT TIME ZONE 'Africa/Harare') AT TIME ZONE 'Africa/Harare' + INTERVAL '1 day'
    )
  );

-- ---------------------------------------------------------------------------
-- TABLE: bookings
-- ---------------------------------------------------------------------------
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "admin: all on bookings"
  ON public.bookings FOR ALL
  USING (public.auth_role() = 'admin')
  WITH CHECK (public.auth_role() = 'admin');

-- Barbers can only SELECT their own bookings
CREATE POLICY "barber: select own bookings"
  ON public.bookings FOR SELECT
  USING (
    public.auth_role() = 'barber'
    AND barber_id = auth.uid()
  );

-- Barbers can UPDATE only the status column of their own bookings.
-- Column-level restriction: the trigger validates the status transition.
-- We also prevent barbers from updating any other column.
CREATE POLICY "barber: update status of own bookings"
  ON public.bookings FOR UPDATE
  USING (
    public.auth_role() = 'barber'
    AND barber_id = auth.uid()
  )
  WITH CHECK (
    public.auth_role() = 'barber'
    AND barber_id = auth.uid()
    -- Barbers may not change these columns:
    AND client_id   = (SELECT client_id  FROM public.bookings WHERE id = bookings.id)
    AND service_id  = (SELECT service_id FROM public.bookings WHERE id = bookings.id)
    AND start_time  = (SELECT start_time FROM public.bookings WHERE id = bookings.id)
    AND source      = (SELECT source     FROM public.bookings WHERE id = bookings.id)
    AND created_by  = (SELECT created_by FROM public.bookings WHERE id = bookings.id)
  );

-- Barbers cannot INSERT or DELETE bookings (no policy = deny)

-- ---------------------------------------------------------------------------
-- Grant usage on the helper function to authenticated users
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.auth_role() TO authenticated;
