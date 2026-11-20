-- Permanently remove retired sample accounts and their sample data.

DO $$
DECLARE
  target_ids uuid[];
BEGIN
  SELECT array_agg(DISTINCT id)
  INTO target_ids
  FROM (
    SELECT id
    FROM public.profiles
    WHERE role = 'barber'
      AND lower(full_name) IN ('tendai moyo', 'rudo chikwanda')
    UNION
    SELECT id
    FROM auth.users
    WHERE lower(email) IN (
      'tendai@infinitybarbers.local',
      'rudo@infinitybarbers.local'
    )
  ) targets;

  IF target_ids IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.bookings
  WHERE barber_id = ANY(target_ids)
     OR created_by = ANY(target_ids);

  DELETE FROM auth.users
  WHERE id = ANY(target_ids);
END $$;
