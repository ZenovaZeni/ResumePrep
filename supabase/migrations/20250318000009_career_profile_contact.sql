-- Add phone and location to career_profiles so contact autofill works
-- across resume generation, cover letter, and match analysis flows.
ALTER TABLE public.career_profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT;
