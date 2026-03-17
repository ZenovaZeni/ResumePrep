-- Allow anonymous read of resumes that have a slug set (for public share links)
CREATE POLICY "resumes_public_read"
  ON public.resumes
  FOR SELECT
  USING (slug IS NOT NULL);
