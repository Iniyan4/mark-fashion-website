-- Run in Supabase SQL Editor after markfashionglobal@gmail.com has signed up.
-- This promotes only that existing account; it does not create a login or password.
DO $$
DECLARE target_id uuid;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE lower(email) = 'markfashionglobal@gmail.com' LIMIT 1;
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'Account markfashionglobal@gmail.com not found. Sign up first.';
  END IF;
  INSERT INTO public.profiles (id, role) VALUES (target_id, 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';
END $$;

SELECT u.email, p.role FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) = 'markfashionglobal@gmail.com';
