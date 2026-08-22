-- ==========================================================
-- SUPABASE SCHEMA MIGRATION: Team Chat Architecture Refactor
-- ==========================================================
-- Instruction: Run this script in your Supabase SQL Editor.
-- This establishes the database as the single source of truth.

-- 1. Create team channels table
CREATE TABLE IF NOT EXISTS public.team_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    deleted_by_user TEXT[] DEFAULT '{}'
);

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS public.team_messages (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES public.team_channels(id) ON DELETE CASCADE,
    sender_id TEXT,
    sender_name TEXT,
    text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_edited BOOLEAN NOT NULL DEFAULT false,
    deleted_for TEXT[] DEFAULT '{}',
    call_summary JSONB,
    attachments JSONB,
    reply_to JSONB,
    reactions JSONB,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    message_status TEXT DEFAULT 'read',
    is_voice_note BOOLEAN DEFAULT false,
    voice_duration NUMERIC,
    audio_url TEXT
);

-- Enable RLS
ALTER TABLE public.team_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Disable strict RLS for immediate compatibility with existing custom auth (or adjust as needed)
CREATE POLICY "Enable all access for team_channels" ON public.team_channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for team_messages" ON public.team_messages FOR ALL USING (true) WITH CHECK (true);

-- Turn on Realtime for the tables to enable synchronized updates across admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'team_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'team_channels'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_channels;
  END IF;
END $$;
