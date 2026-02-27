-- Migration: 20260227_add_integration_tables
-- Description: Adds tables for storing OAuth tokens, API keys, and Webhooks for external integrations.

-- 1. user_integrations table for OAuth tokens
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g., 'google'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    scopes TEXT[],
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, provider)
);

-- RLS for user_integrations
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations"
    ON public.user_integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
    ON public.user_integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
    ON public.user_integrations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
    ON public.user_integrations FOR DELETE
    USING (auth.uid() = user_id);

-- 2. api_keys table for Public API access
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE, -- Store hashed key, not plaintext
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name)
);

-- RLS for api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
    ON public.api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
    ON public.api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
    ON public.api_keys FOR DELETE
    USING (auth.uid() = user_id);

-- 3. webhooks table for Event notifications
CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret TEXT NOT NULL, -- Used to sign webhook payloads
    events TEXT[] DEFAULT '{scan.completed}'::text[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for webhooks
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhooks"
    ON public.webhooks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhooks"
    ON public.webhooks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks"
    ON public.webhooks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks"
    ON public.webhooks FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Triggers to update updated_at columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_user_integrations_updated_at
    BEFORE UPDATE ON public.user_integrations
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_webhooks_updated_at
    BEFORE UPDATE ON public.webhooks
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
