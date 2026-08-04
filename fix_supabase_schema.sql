-- Run this in the Supabase Dashboard SQL Editor to ensure your public.users table matches the code exactly.
-- This will add any missing columns and avoid the "400 Bad Request" PGRST204 errors.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS sub_role TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Verify columns by uncommenting this line:
-- SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users';
