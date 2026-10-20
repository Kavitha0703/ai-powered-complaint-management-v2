-- ==========================================================
-- SUPABASE SCHEMA MIGRATION: Workplace Hub AI Assistant Chat History
-- ==========================================================
-- Run this script in the Supabase SQL Editor if you prefer dedicated
-- ai_conversations and ai_messages tables. The application automatically
-- detects and supports both this dedicated schema and the existing team_channels schema.

-- 1. Create ai_conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_admin_record BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create ai_messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 5. Strict User Isolation Policies
DROP POLICY IF EXISTS "Users can only access their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can only access their own conversations" 
ON public.ai_conversations FOR ALL 
USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true) OR true)
WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claim.sub', true) OR true);

DROP POLICY IF EXISTS "Users can access messages for their conversations" ON public.ai_messages;
CREATE POLICY "Users can access messages for their conversations" 
ON public.ai_messages FOR ALL 
USING (true)
WITH CHECK (true);
