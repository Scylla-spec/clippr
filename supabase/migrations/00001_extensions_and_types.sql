-- =============================================================================
-- Migration 00001: Extensions and custom types (enums)
-- =============================================================================

-- btree_gist: needed for the exclusion constraint on bookings (overlap check)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- pgcrypto: for gen_random_uuid() (already available on Supabase but explicit)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM ('admin', 'barber');

CREATE TYPE public.booking_status AS ENUM (
  'booked',
  'waiting',
  'in_service',
  'done',
  'no_show',
  'cancelled'
);

CREATE TYPE public.booking_source AS ENUM ('appointment', 'walk_in');
