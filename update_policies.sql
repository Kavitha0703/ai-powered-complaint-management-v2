-- ====================================================================
-- SUPABASE SYSTEM SYNCHRONIZATION AND RLS POLICY UPGRADE (2026)
-- Run this entire script in your Supabase SQL Editor (https://supabase.com)
-- ====================================================================

-- --------------------------------------------------------------------
-- STEP 1: CLEAN UP ORPHANED TICKETS & ENFORCE FOREIGN KEY RELATIONSHIP
-- --------------------------------------------------------------------
-- Ensure that empty or invalid user_id entries won't prevent foreign key creation.
-- This deletes any tickets pointing to a non-existent public.users profile.
DELETE FROM tickets 
WHERE user_id NOT IN (SELECT id FROM users);

-- Safely drop old foreign key constraint if it already exists
ALTER TABLE tickets 
DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;

-- Create the foreign key relationship pointing tickets.user_id to users.id
ALTER TABLE tickets 
ADD CONSTRAINT tickets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE CASCADE;


-- --------------------------------------------------------------------
-- STEP 2: ENABLE ROW LEVEL SECURITY (RLS) ON ALL PLATFORM TABLES
-- --------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;


-- --------------------------------------------------------------------
-- STEP 3: CONFIGURE ULTRA-ROBUST POLICIES FOR 'users' (PROFILES)
-- --------------------------------------------------------------------
-- First drop all historical policies to clean up any conflicting names
DROP POLICY IF EXISTS "Enable insert for users" ON users;
DROP POLICY IF EXISTS "Enable select for users" ON users;
DROP POLICY IF EXISTS "Enable update for users" ON users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON users;

-- Grant authenticated users full control over the users table (enables upserts)
CREATE POLICY "Enable all for authenticated users" 
ON users 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- --------------------------------------------------------------------
-- STEP 4: CONFIGURE ULTRA-ROBUST POLICIES FOR 'tickets'
-- --------------------------------------------------------------------
-- Clean up all old/conflicting ticket policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON tickets;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON tickets;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON tickets;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON tickets;
DROP POLICY IF EXISTS "Enable all for tickets" ON tickets;

-- Allow authenticated users to perform all operations on tickets
CREATE POLICY "Enable all for tickets" 
ON tickets 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- --------------------------------------------------------------------
-- STEP 5: CONFIGURE ULTRA-ROBUST POLICIES FOR 'notices' (BROADCASTS)
-- --------------------------------------------------------------------
-- Clean up all old/conflicting notice policies
DROP POLICY IF EXISTS "Enable select for notices" ON notices;
DROP POLICY IF EXISTS "Enable all for notices" ON notices;

-- Ensure anyone authenticated can read and update notices (needed for admin tools)
CREATE POLICY "Enable all for notices" 
ON notices 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- --------------------------------------------------------------------
-- STEP 6: CONFIGURE ULTRA-ROBUST POLICIES FOR 'feedback'
-- --------------------------------------------------------------------
-- Clean up all old/conflicting feedback policies
DROP POLICY IF EXISTS "Enable all for feedback" ON feedback;

-- Ensure authenticated users can register and view system feedback
CREATE POLICY "Enable all for feedback" 
ON feedback 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- --------------------------------------------------------------------
-- STEP 7: EXPLICITLY GRANT SCHEMA PRIVILEGES AND TABLE PERMISSIONS
-- --------------------------------------------------------------------
-- Ensures postgres table levels roles match the defined permissions.
-- Safe, robust grants for 'authenticated' (app users), 'anon' (anonymous previewers), and 'service_role' (background systems).

-- Scope: Schema level usage permission
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Scope: Table level manipulation permissions
GRANT ALL PRIVILEGES ON TABLE public.tickets TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.users TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.notices TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.feedback TO postgres, anon, authenticated, service_role;

-- Scope: Sequence manipulation permissions (crucial for auto-increment keys)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
