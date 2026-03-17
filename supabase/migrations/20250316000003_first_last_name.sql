-- Replace full_name with first_name and last_name (last name optional)

-- Add new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrate existing full_name into first_name where column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    UPDATE public.profiles
      SET first_name = COALESCE(full_name, first_name)
      WHERE full_name IS NOT NULL AND (first_name IS NULL OR first_name = '');
  END IF;
END $$;

-- Drop old column (only if it exists; avoids error on fresh installs that use new schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN full_name;
  END IF;
END $$;

-- Update trigger to set first_name and last_name from signup metadata
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
