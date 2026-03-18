-- ============================================================
-- FULL SCHEMA REPAIR — paste this entire file into
-- Supabase Dashboard → SQL Editor → Run
--
-- Safe to run on any existing database: uses CREATE TABLE IF NOT EXISTS,
-- CREATE INDEX IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, DO blocks for
-- constraints (ADD CONSTRAINT IF NOT EXISTS is not supported in PostgreSQL),
-- and DROP POLICY IF EXISTS before re-creating policies.
-- ============================================================

-- ─── 1. GRANT SCHEMA ACCESS ──────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ─── 2. PROFILES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- ─── 3. CAREER PROFILES ───────────────────────────────────────
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

ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_profiles_select" ON public.career_profiles;
DROP POLICY IF EXISTS "career_profiles_insert" ON public.career_profiles;
DROP POLICY IF EXISTS "career_profiles_update" ON public.career_profiles;
CREATE POLICY "career_profiles_select" ON public.career_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "career_profiles_insert" ON public.career_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "career_profiles_update" ON public.career_profiles FOR UPDATE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE ON public.career_profiles TO authenticated;

-- ─── 4. RESUMES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  resume_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resumes_all" ON public.resumes;
DROP POLICY IF EXISTS "resumes_public_read" ON public.resumes;
CREATE POLICY "resumes_all" ON public.resumes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "resumes_public_read" ON public.resumes FOR SELECT USING (slug IS NOT NULL);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT SELECT ON public.resumes TO anon;

-- ─── 5. APPLICATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT,
  job_url TEXT,
  date_applied DATE,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN (
    'saved', 'applied', 'interview', 'final_interview', 'rejected', 'offer'
  )),
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'web',
  match_summary JSONB,
  interview_prep JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS match_summary JSONB,
  ADD COLUMN IF NOT EXISTS interview_prep JSONB;

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applications_all" ON public.applications;
CREATE POLICY "applications_all" ON public.applications FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;

-- ─── 6. RESUME VARIANTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resume_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_application_id UUID,
  name TEXT NOT NULL,
  resume_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resume_variants_resume_id ON public.resume_variants(resume_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_job_application'
      AND conrelid = 'public.resume_variants'::regclass
  ) THEN
    ALTER TABLE public.resume_variants
      ADD CONSTRAINT fk_job_application
      FOREIGN KEY (job_application_id) REFERENCES public.applications(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.resume_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resume_variants_all" ON public.resume_variants;
CREATE POLICY "resume_variants_all" ON public.resume_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_variants TO authenticated;

-- ─── 7. INTERVIEW SESSIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('behavioral', 'technical', 'situational')),
  role_context TEXT,
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interview_sessions_all" ON public.interview_sessions;
CREATE POLICY "interview_sessions_all" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;

-- ─── 8. GENERATED DOCUMENTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cover_letter', 'resume_export')),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_documents_user_id ON public.generated_documents(user_id);
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "generated_documents_all" ON public.generated_documents;
CREATE POLICY "generated_documents_all" ON public.generated_documents FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_documents TO authenticated;

-- ─── 9. CAREER SUGGESTIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.career_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_suggestions_user_id ON public.career_suggestions(user_id);
ALTER TABLE public.career_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_suggestions_all" ON public.career_suggestions;
CREATE POLICY "career_suggestions_all" ON public.career_suggestions FOR ALL USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_suggestions TO authenticated;

-- ─── 10. SAVED CAREERS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  career_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_careers_user_id ON public.saved_careers(user_id);
ALTER TABLE public.saved_careers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_careers_all" ON public.saved_careers;
DROP POLICY IF EXISTS "saved_careers_select" ON public.saved_careers;
DROP POLICY IF EXISTS "saved_careers_insert" ON public.saved_careers;
DROP POLICY IF EXISTS "saved_careers_update" ON public.saved_careers;
DROP POLICY IF EXISTS "saved_careers_delete" ON public.saved_careers;
CREATE POLICY "saved_careers_select" ON public.saved_careers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_careers_insert" ON public.saved_careers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_careers_update" ON public.saved_careers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_careers_delete" ON public.saved_careers FOR DELETE USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_careers_user_title_unique'
      AND conrelid = 'public.saved_careers'::regclass
  ) THEN
    ALTER TABLE public.saved_careers
      ADD CONSTRAINT saved_careers_user_title_unique UNIQUE (user_id, title);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_careers TO authenticated;

-- ─── 11. SAVED ROADMAPS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  timeline_years INT,
  roadmap_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_roadmaps_user_id ON public.saved_roadmaps(user_id);
ALTER TABLE public.saved_roadmaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_roadmaps_select" ON public.saved_roadmaps;
DROP POLICY IF EXISTS "saved_roadmaps_insert" ON public.saved_roadmaps;
DROP POLICY IF EXISTS "saved_roadmaps_update" ON public.saved_roadmaps;
DROP POLICY IF EXISTS "saved_roadmaps_delete" ON public.saved_roadmaps;
CREATE POLICY "saved_roadmaps_select" ON public.saved_roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_roadmaps_insert" ON public.saved_roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_roadmaps_update" ON public.saved_roadmaps FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_roadmaps_delete" ON public.saved_roadmaps FOR DELETE USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saved_roadmaps_user_title_timeline_unique'
      AND conrelid = 'public.saved_roadmaps'::regclass
  ) THEN
    ALTER TABLE public.saved_roadmaps
      ADD CONSTRAINT saved_roadmaps_user_title_timeline_unique UNIQUE (user_id, title, timeline_years);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_roadmaps TO authenticated;

-- ─── 12. SIGNUP TRIGGER ──────────────────────────────────────
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 13. RELOAD SCHEMA CACHE ─────────────────────────────────
NOTIFY pgrst, 'reload schema';
SELECT pg_notification_queue_usage();
