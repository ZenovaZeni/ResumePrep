-- Saved roadmaps: users can save generated career roadmaps to view/export later.
CREATE TABLE public.saved_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  timeline_years INT,
  roadmap_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_roadmaps_user_id ON public.saved_roadmaps(user_id);

-- One saved roadmap per user+role+timeline combination.
ALTER TABLE public.saved_roadmaps
  ADD CONSTRAINT saved_roadmaps_user_title_timeline_unique UNIQUE (user_id, title, timeline_years);

ALTER TABLE public.saved_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_roadmaps_select" ON public.saved_roadmaps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_roadmaps_insert" ON public.saved_roadmaps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_roadmaps_update" ON public.saved_roadmaps
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_roadmaps_delete" ON public.saved_roadmaps
  FOR DELETE USING (auth.uid() = user_id);
