-- =============================================================================
-- Migration 00005: Queue view + Realtime publication
-- =============================================================================

-- ---------------------------------------------------------------------------
-- today_queue view
--
-- Returns all bookings for a given barber today (Africa/Harare local time),
-- ordered by queue position:
--   1. in_service first
--   2. then booked/waiting ordered by start_time
--   3. then terminal statuses (done, no_show, cancelled) by start_time
--
-- This view is the single source of truth for queue order.
-- Both the admin day view and the barber dashboard query this view so they
-- can never disagree.
--
-- RLS: the underlying bookings table has RLS, so the view inherits it.
-- A barber querying this view only sees their own rows.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.today_queue
WITH (security_invoker = true)   -- Run as the calling user, respecting RLS
AS
SELECT
  b.id,
  b.client_id,
  b.barber_id,
  b.service_id,
  b.start_time,
  b.end_time,
  b.status,
  b.source,
  b.created_by,
  b.created_at,
  b.updated_at,
  -- Convenience join fields (avoids extra round-trips in the client)
  c.full_name  AS client_name,
  c.phone      AS client_phone,
  s.name       AS service_name,
  s.duration_min,
  s.price,
  p.full_name  AS barber_name,
  -- Queue ordering bucket:
  --   0 = active (in_service, booked, waiting)
  --   1 = terminal (done, no_show, cancelled)
  CASE
    WHEN b.status IN ('in_service', 'booked', 'waiting') THEN 0
    ELSE 1
  END AS queue_bucket,
  -- Within bucket 0: in_service first, then by start_time
  CASE
    WHEN b.status = 'in_service' THEN 0
    ELSE 1
  END AS in_service_first
FROM public.bookings b
JOIN public.clients  c ON c.id = b.client_id
JOIN public.services s ON s.id = b.service_id
JOIN public.profiles p ON p.id = b.barber_id
WHERE
  -- Today in Africa/Harare (UTC+2, no DST)
  b.start_time >= date_trunc('day', now() AT TIME ZONE 'Africa/Harare') AT TIME ZONE 'Africa/Harare'
  AND b.start_time <  date_trunc('day', now() AT TIME ZONE 'Africa/Harare') AT TIME ZONE 'Africa/Harare' + INTERVAL '1 day'
ORDER BY
  queue_bucket    ASC,
  in_service_first ASC,
  b.start_time    ASC;

COMMENT ON VIEW public.today_queue IS 'Single source of truth for the daily queue. Returns today''s bookings (Africa/Harare) ordered by queue position. Respects RLS: barbers only see their own rows.';

-- ---------------------------------------------------------------------------
-- Realtime publication
--
-- Supabase Realtime requires tables (not views) to be in the publication.
-- We publish bookings and profiles changes.
-- The client subscribes to filtered channels (barber_id = their own id).
-- ---------------------------------------------------------------------------

-- supabase_realtime publication is created by Supabase by default; we just
-- add the tables we want to broadcast.
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
