import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/profile";
import { ApplicationStatusBadge } from "./applications/ApplicationStatusBadge";
import { SchemaErrorBanner } from "@/components/SchemaErrorBanner";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: career }, { data: profileTier }] = user
    ? await Promise.all([
        supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single(),
        supabase.from("career_profiles").select("summary, raw_experience").eq("user_id", user.id).single(),
        supabase.from("profiles").select("tier").eq("user_id", user.id).single(),
      ])
    : [{ data: null }, { data: null }, { data: null }];
  const displayName = getDisplayName(profile);
  const isPro = profileTier?.tier === "pro";

  const resumesResult = user
    ? await supabase
        .from("resumes")
        .select("id, name, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(3)
    : { data: [], error: null };
  const { data: resumes, error: resumesError } = resumesResult;
  const { data: applications } = user
    ? await supabase
        .from("applications")
        .select("id, company_name, job_title, status, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(6)
    : { data: [] };

  const exp = career?.raw_experience as unknown;
  const hasExperience = Array.isArray(exp) && exp.length > 0;
  const profileComplete = Boolean(profile?.first_name?.trim()) && (Boolean(career?.summary?.trim()) || hasExperience);
  const hasResumes = resumes && resumes.length > 0;
  const dbError = resumesError?.message ?? null;
  const hasApplications = (applications ?? []).length > 0;

  return (
    <div className="max-w-6xl mx-auto">
      <SchemaErrorBanner error={dbError} table="resumes" />

      {/* Upgrade nudge — shown to free users who have used the app */}
      {!isPro && hasApplications && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-[var(--accent)]/15 to-[var(--accent)]/5 border border-[var(--accent)]/25 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Unlock unlimited kits and the voice interview coach
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Pro is $8/month (billed yearly) — less than a coffee per week while you're job searching.
            </p>
          </div>
          <Link
            href="/dashboard/upgrade"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Upgrade to Pro
          </Link>
        </div>
      )}

      {/* Two-column on desktop: left = hero + quick links, right = apps + how it works */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10 lg:items-start">

        {/* ── Left: hero + quick links ─────────────────── */}
        <div>
          {/* Hero */}
          <div className="mb-10 pt-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">
              {displayName ? `Welcome back, ${displayName}` : "Ready to apply?"}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight mb-3">
              Paste a job.<br />
              <span className="text-[var(--accent)]">Get hired faster.</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-base mb-8 max-w-lg leading-relaxed">
              Generate a tailored resume, cover letter, and interview prep for any job in one step.
            </p>

            <Link
              href="/dashboard/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] text-white px-6 py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[var(--accent)]/20"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Generate application kit
            </Link>
            <p className="mt-3 text-xs text-[var(--text-tertiary)]">Paste any job description. Takes about 30 seconds.</p>
          </div>

          {/* Onboarding nudge */}
          {!profileComplete && (
            <div className="mb-8 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 p-4">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                Add your career details for better results
              </p>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                The AI tailors your resume and cover letter using your profile. A complete profile means a stronger application.
              </p>
              <Link href="/dashboard/profile" className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]">
                Complete your profile →
              </Link>
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3 mb-8 lg:mb-0">
            {hasResumes ? (
              <Link
                href="/dashboard/resumes"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">Resumes</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{resumes!.length} saved</p>
                </div>
              </Link>
            ) : (
              <Link
                href="/dashboard/resumes/new"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-dashed border-[var(--border-subtle)] hover:border-[var(--accent)]/40 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">New resume</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Build from profile</p>
                </div>
              </Link>
            )}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Profile</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {profileComplete ? "Up to date" : "Needs info"}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Right: recent applications + how it works ─ */}
        <div className="space-y-6 lg:sticky lg:top-24">

          {/* Recent applications */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">Applications</h2>
              {(applications ?? []).length > 0 && (
                <Link href="/dashboard/applications" className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
                  View all →
                </Link>
              )}
            </div>
            {(applications ?? []).length > 0 ? (
              <ul className="space-y-2">
                {(applications ?? []).map((app) => (
                  <li key={app.id}>
                    <Link
                      href={`/dashboard/applications/${app.id}`}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--bg-tertiary)] transition-all group"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors text-sm">
                          {app.job_title}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{app.company_name}</p>
                      </div>
                      <ApplicationStatusBadge status={app.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-5 text-center">
                <p className="text-sm text-[var(--text-secondary)] mb-3">Applications you save will appear here.</p>
                <Link href="/dashboard/apply" className="text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]">
                  Start with a job description →
                </Link>
              </div>
            )}
          </section>

          {/* How it works — only shown to new users */}
          {(applications ?? []).length === 0 && (
            <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">How it works</p>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Paste a job description",
                    desc: "Copy any job posting and paste it into the Apply screen.",
                    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                  },
                  {
                    step: "2",
                    title: "Generate your kit",
                    desc: "The AI tailors your resume, writes a cover letter, and analyses your match — in about 30 seconds.",
                    icon: "M13 10V3L4 14h7v7l9-11h-7z",
                  },
                  {
                    step: "3",
                    title: "Review, export, and prep",
                    desc: "Download your resume, copy the cover letter, and use the Q&A to prep for the interview.",
                    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
