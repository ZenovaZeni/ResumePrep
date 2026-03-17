-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Career profile (source of truth for resume content)
CREATE TABLE public.career_profiles (
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

-- Resumes
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  resume_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);

-- Resume variants (job-specific versions)
CREATE TABLE public.resume_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_application_id UUID,
  name TEXT NOT NULL,
  resume_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resume_variants_resume_id ON public.resume_variants(resume_id);

-- Applications (tracker)
CREATE TABLE public.applications (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_status ON public.applications(status);

-- Resume variants FK to applications (after applications exists)
ALTER TABLE public.resume_variants
  ADD CONSTRAINT fk_job_application
  FOREIGN KEY (job_application_id) REFERENCES public.applications(id) ON DELETE SET NULL;

-- Interview sessions
CREATE TABLE public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('behavioral', 'technical', 'situational')),
  role_context TEXT,
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interview_sessions_user_id ON public.interview_sessions(user_id);

-- Generated documents (cover letters, etc.)
CREATE TABLE public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cover_letter', 'resume_export')),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_documents_user_id ON public.generated_documents(user_id);

-- Career suggestions (cached AI output)
CREATE TABLE public.career_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_career_suggestions_user_id ON public.career_suggestions(user_id);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own rows
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "career_profiles_select" ON public.career_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "career_profiles_insert" ON public.career_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "career_profiles_update" ON public.career_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "resumes_all" ON public.resumes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "resume_variants_all" ON public.resume_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = auth.uid()));

CREATE POLICY "applications_all" ON public.applications FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "interview_sessions_all" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "generated_documents_all" ON public.generated_documents FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "career_suggestions_all" ON public.career_suggestions FOR ALL USING (auth.uid() = user_id);

-- Trigger: create profile and career_profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), '')
  );
  INSERT INTO public.career_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Public resume view (for share links): allow read when slug is set (Phase 4)
-- For now we don't add anon read; we'll add it in Phase 4.2.
