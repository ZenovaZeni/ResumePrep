-- Run this in Supabase Dashboard → SQL Editor to fix "Could not find the table 'public.profiles'" error
-- Copy and paste the entire file, then click Run.

-- 1. Create profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create career_profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.career_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT,
  summary TEXT,
  target_roles TEXT[],
  career_goals TEXT,
  raw_experience JSONB,
  skills TEXT[],
  certifications JSONB,
  education JSONB,
  projects JSONB,
  achievements JSONB,
  metrics JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Ensure first_name and last_name columns exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies (avoids "policy already exists" errors)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "career_profiles_select" ON public.career_profiles;
DROP POLICY IF EXISTS "career_profiles_insert" ON public.career_profiles;
DROP POLICY IF EXISTS "career_profiles_update" ON public.career_profiles;

-- 6. Create RLS policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "career_profiles_select" ON public.career_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "career_profiles_insert" ON public.career_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "career_profiles_update" ON public.career_profiles FOR UPDATE USING (auth.uid() = user_id);

-- 7. Grant usage to anon and authenticated (required for Supabase PostgREST)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.career_profiles TO authenticated;

-- 8. Trigger for new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.career_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Refresh PostgREST schema cache (critical!)
NOTIFY pgrst, 'reload schema';

-- If the cache still doesn't update, this query can help
-- (it triggers Postgres notification queue checks used by PostgREST).
SELECT pg_notification_queue_usage();
