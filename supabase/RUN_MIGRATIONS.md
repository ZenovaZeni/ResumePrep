# Fix: "Could not find the table 'public.profiles' in the schema cache"

This error means either:
1. **Migrations haven't been applied** – the `profiles` table doesn't exist in your database
2. **Schema cache is stale** – the table exists but PostgREST hasn't picked it up

## Quick fix (recommended)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → select your project
2. Go to **SQL Editor**
3. Open `supabase/fix_profiles.sql` from this project
4. Copy its entire contents, paste into the SQL Editor, and click **Run**

This creates `profiles` and `career_profiles` if missing, sets up RLS policies, and refreshes the schema cache.

## Option B: Apply full migrations (Supabase Cloud)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → select your project
2. Go to **SQL Editor**
3. Run each migration file in order:
   - `migrations/20250316000001_initial_schema.sql`
   - `migrations/20250316000003_first_last_name.sql` (20250316000002 is for resume links)
   - `migrations/20250316000002_public_resume_links.sql`
   - `migrations/20250316000004_saved_careers.sql`

   Or run them all at once by copying the contents of each file into the SQL Editor (in that order) and executing.

## Option C: Using Supabase CLI (local or linked project)

```bash
# If using local Supabase
supabase db reset

# Or push migrations to a linked remote project
supabase db push
```

## Option D: Refresh schema cache only (if table already exists)

If you've already run migrations and the table exists, PostgREST may need to reload its schema cache. In the Supabase SQL Editor, run:

```sql
NOTIFY pgrst, 'reload schema';
```

Then wait a few seconds and try saving your profile again. If that doesn't work, try pausing and resuming your project in the Supabase Dashboard (Settings → General).
