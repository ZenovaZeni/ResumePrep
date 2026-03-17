-- Fix saved_careers RLS: the original FOR ALL policy only had USING, which
-- PostgreSQL does not apply as the INSERT check. Split into explicit policies
-- with the correct WITH CHECK clause so inserts are permitted.

DROP POLICY IF EXISTS "saved_careers_all" ON public.saved_careers;

CREATE POLICY "saved_careers_select" ON public.saved_careers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_careers_insert" ON public.saved_careers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_careers_update" ON public.saved_careers
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_careers_delete" ON public.saved_careers
  FOR DELETE USING (auth.uid() = user_id);

-- Prevent saving the same career title twice for the same user.
-- Used by the upsert in the API route to silently de-duplicate.
ALTER TABLE public.saved_careers
  ADD CONSTRAINT saved_careers_user_title_unique UNIQUE (user_id, title);
