# Smart Resume Platform – Local setup

## Run the app locally

In the project folder, run:

```powershell
npx next dev
```

Then open **http://localhost:3000** in your browser.

- **Landing:** `/` – Log in / Sign up
- **Dashboard:** `/dashboard` (after login)
- **Profile:** `/dashboard/profile`
- **Resumes:** `/dashboard/resumes`
- **Applications:** `/dashboard/applications`
- **Career:** `/dashboard/career`
- **Interview:** `/dashboard/interview`

---

## Supabase (what’s in the project)

The app is built to use **Supabase** for auth and database. Nothing is hardcoded; it’s all driven by env and your Supabase project.

### 1. What’s already done in code

- **Auth:** Login/signup use Supabase Auth (email/password). Session is stored in cookies; middleware keeps the session in sync.
- **Database:** All tables are defined in SQL migrations under `supabase/migrations/`:
  - `20250316000001_initial_schema.sql` – profiles, career_profiles, resumes, resume_variants, applications, interview_sessions, generated_documents, career_suggestions + RLS + trigger to create profile/career_profile on signup
  - `20250316000002_public_resume_links.sql` – policy so resumes with a `slug` can be read publicly (for `/r/[slug]`)
- **Env:** `.env.local` has placeholders. The app reads:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY` (for AI features: resume generation, ATS score, tailor, cover letter, interview, career suggestions)

So: **Supabase is “wired in” in the app; you just need to point it at a real project and run the migrations.**

### 2. What you need to do to use Supabase

1. **Create a Supabase project**  
   Go to [supabase.com](https://supabase.com) → New project → pick org, name, region, database password.

2. **Get URL and anon key**  
   In the project: **Settings → API**. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Run the migrations**  
   Either:
   - **Supabase Dashboard:** **SQL Editor** → New query → paste and run each migration in order: `20250316000001_initial_schema.sql`, `20250316000002_public_resume_links.sql`, `20250316000003_first_last_name.sql`, `20250316000004_saved_careers.sql`.
   - Or use Supabase CLI: `supabase db push` (if you have the CLI and link the project).

4. **Put keys in `.env.local`**  
   Update:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   OPENAI_API_KEY=sk-...   # optional for AI; app will error on AI actions if missing
   ```

5. **Restart the dev server**  
   Stop `npx next dev` (Ctrl+C) and run `npx next dev` again so it picks up the new env.

6. **Dev: sign in without email confirmation (recommended)**  
   In Supabase: **Authentication → Providers → Email** → turn **off** “Confirm email”. Then sign up and login work immediately. You can turn it back on later for production.

7. **Dev: one-click test account**  
   On the **Login** page in development you’ll see a dev-only section:
   - **Use test account (create or sign in)** – creates `test@example.com` with password `TestPassword123!` if needed, then signs you in so you can open the dashboard.
   - **Create test user via API** – optional. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (from Supabase **Settings → API → service_role**). Click this once to create the test user with email pre-confirmed; then use the button above to sign in.

After that, sign up and login will create rows in `profiles` and `career_profiles` (via the trigger), and the rest of the app (resumes, applications, etc.) will work against your Supabase DB.

---

## Optional: run dev without Supabase

You can still run the app and click around:

- `npx next dev` and open http://localhost:3000

Without real Supabase credentials, login/signup will fail (network/401). To get a working flow end-to-end, you need at least step 1–4 above (create project, run migrations, set URL and anon key in `.env.local`).

---

## What’s “left” (from the plan)

All planned phases are implemented in code:

- **Phase 1:** Auth, profile, resume builder, AI improve bullet, PDF/DOCX export, dashboard
- **Phase 2:** ATS scoring, job tailoring, cover letter generator, application tracker, tier gating (free vs pro)
- **Phase 3:** Interview sessions + feedback, career advisor, voice (stub + env note)
- **Phase 4:** Resume versions (clone, variants), public resume links (`/r/[slug]`), extension scaffold in `extension/`

So there’s no remaining “to-do” from the plan. To **see** it working locally you only need to run the app (and optionally connect Supabase + OpenAI as above).
