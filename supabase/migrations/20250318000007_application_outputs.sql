-- Add match_summary and interview_prep columns to applications table
-- These store AI-generated outputs directly on the application row
-- for fast retrieval without extra joins.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS match_summary JSONB,
  ADD COLUMN IF NOT EXISTS interview_prep JSONB;
