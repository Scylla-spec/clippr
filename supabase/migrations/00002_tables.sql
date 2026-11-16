-- =============================================================================
-- Migration 00002: Core tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- One row per auth.users row; role determines access level.
-- Created automatically via trigger when a user signs up (see migration 00003).
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text        NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
  role        public.user_role NOT NULL DEFAULT 'barber',
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
  'One row per auth user. role controls RLS access throughout the app.';

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
CREATE TABLE public.services (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  duration_min integer     NOT NULL CHECK (duration_min > 0),
  price        numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.services IS
  'Barbershop services (haircut, shave, etc.) with duration used to auto-compute end_time.';

-- ---------------------------------------------------------------------------
-- clients
-- Minimal PII: name + phone only.
-- Phone stored normalised to E.164 (+263...).
-- ---------------------------------------------------------------------------
CREATE TABLE public.clients (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text        NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
  -- E.164 format, e.g. +263771234567. Max 15 digits + leading +.
  phone      text        NOT NULL CHECK (phone ~ '^\+[1-9]\d{6,14}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clients IS
  'Client PII: name and normalised phone number only.';

-- Unique on phone so the same client is not duplicated
CREATE UNIQUE INDEX clients_phone_unique ON public.clients (phone);

-- ---------------------------------------------------------------------------
-- bookings
-- Central table. Shared between admin and barber views.
-- ---------------------------------------------------------------------------
CREATE TABLE public.bookings (
  id          uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid              NOT NULL REFERENCES public.clients(id),
  barber_id   uuid              NOT NULL REFERENCES public.profiles(id),
  service_id  uuid              NOT NULL REFERENCES public.services(id),
  start_time  timestamptz       NOT NULL,
  -- end_time is derived at creation from service.duration_min; stored to enable
  -- the exclusion constraint without joining on every check.
  end_time    timestamptz       NOT NULL,
  status      public.booking_status NOT NULL DEFAULT 'booked',
  source      public.booking_source NOT NULL DEFAULT 'appointment',
  created_by  uuid              NOT NULL REFERENCES public.profiles(id),
  created_at  timestamptz       NOT NULL DEFAULT now(),
  updated_at  timestamptz       NOT NULL DEFAULT now(),

  -- end_time must be after start_time
  CONSTRAINT bookings_end_after_start CHECK (end_time > start_time),

  -- A barber can be in at most ONE booking with status 'in_service' at a time.
  -- Enforced by a partial unique index below (exclusion constraint can't do this
  -- cleanly for a single-row limit, but a partial unique index is clearer).

  -- Overlap exclusion: two active bookings for the same barber cannot overlap.
  -- Cancelled and no_show bookings are excluded from the check.
  -- Uses btree_gist (enabled in migration 00001).
  -- tstzrange(start_time, end_time) is an exclusive-end range: [start, end).
  CONSTRAINT bookings_no_overlap
    EXCLUDE USING gist (
      barber_id WITH =,
      tstzrange(start_time, end_time, '[)') WITH &&
    )
    WHERE (status NOT IN ('cancelled', 'no_show'))
);

COMMENT ON TABLE public.bookings IS 'All bookings (appointments and walk-ins) for all barbers. Overlap is prevented by an exclusion constraint. Status transitions are validated by a trigger (see migration 00003).';

-- One barber can have at most one booking in_service at a time
CREATE UNIQUE INDEX bookings_one_in_service_per_barber
  ON public.bookings (barber_id)
  WHERE status = 'in_service';

-- Performance indexes
CREATE INDEX bookings_barber_start ON public.bookings (barber_id, start_time);
CREATE INDEX bookings_status       ON public.bookings (status);
CREATE INDEX bookings_created_by   ON public.bookings (created_by);
