-- Saved careers: users can save individual career suggestions to view, export, or dive deeper later
CREATE TABLE public.saved_careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  career_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_careers_user_id ON public.saved_careers(user_id);

ALTER TABLE public.saved_careers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_careers_all" ON public.saved_careers FOR ALL USING (auth.uid() = user_id);
