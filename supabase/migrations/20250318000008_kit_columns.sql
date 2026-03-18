-- Add full kit snapshot columns to applications table
-- This allows the saved kit to fully reload without joining other tables.
-- All columns are JSONB/integer and added idempotently.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS tailored_resume JSONB,
  ADD COLUMN IF NOT EXISTS cover_letter    JSONB,
  ADD COLUMN IF NOT EXISTS ats_score       INTEGER,
  ADD COLUMN IF NOT EXISTS ats_feedback    JSONB;

-- match_summary and interview_prep were added in 20250318000007;
-- repeat idempotently so this migration is self-contained.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS match_summary  JSONB,
  ADD COLUMN IF NOT EXISTS interview_prep JSONB;

-- Refresh PostgREST schema cache immediately after applying.
NOTIFY pgrst, 'reload schema';
