# Fix: Schema cache errors ("Could not find the table 'public.resumes'" etc.)

This error means either:
1. **Migrations haven't been applied** – the table doesn't exist in your database
2. **Schema cache is stale** – the table exists but PostgREST hasn't picked it up

---

## Quick fix (recommended — covers all tables)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → select your project
2. Go to **SQL Editor**
3. Open `supabase/fix_all_tables.sql` from this project
4. Copy its entire contents, paste into the SQL Editor, and click **Run**

This creates all tables (`profiles`, `career_profiles`, `resumes`, `resume_variants`, `applications`,
`interview_sessions`, `generated_documents`, `career_suggestions`, `saved_careers`, `saved_roadmaps`)
idempotently, sets up RLS policies, and refreshes the schema cache.

---

## Option B: Apply full migrations in order (Supabase Cloud)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → select your project
2. Go to **SQL Editor**
3. Run each migration file in order:
   - `migrations/20250316000001_initial_schema.sql`
   - `migrations/20250316000002_public_resume_links.sql`
   - `migrations/20250316000003_first_last_name.sql`
   - `migrations/20250316000004_saved_careers.sql`
   - `migrations/20250317000005_fix_saved_careers.sql`
   - `migrations/20250317000006_saved_roadmaps.sql`

---

## Option C: Supabase CLI

```bash
# Push all migrations to your linked remote project
supabase db push

# Or reset local dev database
supabase db reset
```

---

## Option D: Refresh schema cache only (table already exists)

If migrations are applied but PostgREST hasn't reloaded, run this in the SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

Then wait a few seconds and retry. If that doesn't work, pause and resume your project:
**Supabase Dashboard → Settings → General → Pause project**, then unpause.
