import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/profile";
import { ApplicationStatusBadge } from "./applications/ApplicationStatusBadge";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: career }] = user
    ? await Promise.all([
        supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single(),
        supabase.from("career_profiles").select("summary, raw_experience").eq("user_id", user.id).single(),
      ])
    : [{ data: null }, { data: null }];
  const displayName = getDisplayName(profile);

  const { data: resumes } = user
    ? await supabase
        .from("resumes")
        .select("id, name, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5)
    : { data: [] };
  const { data: applications } = user
    ? await supabase
        .from("applications")
        .select("id, company_name, job_title, status, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const appIds = (applications ?? []).map((a) => a.id);
  const [variantsRes, docsRes] =
    appIds.length > 0 && user
      ? await Promise.all([
          supabase
            .from("resume_variants")
            .select("job_application_id")
            .in("job_application_id", appIds),
          supabase
            .from("generated_documents")
            .select("application_id")
            .eq("type", "cover_letter")
            .in("application_id", appIds),
        ])
      : [{ data: [] }, { data: [] }];
  const appIdsWithVariant = new Set(
    (variantsRes.data ?? []).map((v) => v.job_application_id).filter(Boolean)
  );
  const appIdsWithCoverLetter = new Set(
    (docsRes.data ?? []).map((d) => d.application_id).filter(Boolean)
  );

  const hasResumes = resumes && resumes.length > 0;
  const hasName = Boolean(profile?.first_name?.trim());
  const hasSummary = Boolean(career?.summary?.trim());
  const exp = career?.raw_experience as unknown;
  const hasExperience = Array.isArray(exp) && exp.length > 0;
  const profileComplete = hasName && (hasSummary || hasExperience);
  const showOnboardingBanner = !profileComplete || !hasResumes;

  const nextToApply = (applications ?? []).find(
    (a) => !appIdsWithVariant.has(a.id) || !appIdsWithCoverLetter.has(a.id)
  );

  return (
    <div>
      {showOnboardingBanner && (
        <div className="mb-6 rounded-[var(--radius-lg)] bg-[var(--accent)]/10 border border-[var(--accent)]/30 p-4">
          <p className="text-[var(--text-primary)] font-medium mb-1">
            {!profileComplete ? "Complete your profile to get the most from AI" : "Create your first resume"}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            {!profileComplete
              ? "Add your name and career details so we can generate tailored resumes and cover letters."
              : "Generate a resume from your profile in one click."}
          </p>
          <div className="flex flex-wrap gap-2">
            {!profileComplete && (
              <Link href="/dashboard/profile" className="btn-primary py-2 px-4 text-sm">
                Complete profile
              </Link>
            )}
            <Link
              href="/dashboard/resumes/new"
              className="py-2 px-4 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              New resume
            </Link>
          </div>
        </div>
      )}

      <div className="mb-8">
        <Link
          href="/dashboard/apply"
          className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--accent)] text-white px-5 py-3 font-medium hover:opacity-90 transition-opacity"
        >
          Paste a job / Quick apply
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-1">
        {displayName ? `Welcome back, ${displayName}` : "Dashboard"}
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Your jobs and applications. Get a tailored resume and cover letter for any job in one step.
      </p>

      {nextToApply && (
        <section className="mb-8 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
          <h2 className="text-sm font-medium text-[var(--text-tertiary)] mb-2">Next job to apply to</h2>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-[var(--text-primary)]">{nextToApply.job_title}</p>
              <p className="text-sm text-[var(--text-secondary)]">{nextToApply.company_name}</p>
            </div>
            <Link
              href={`/dashboard/applications/${nextToApply.id}`}
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Get resume + letter →
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6 mb-8">
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">Applications (jobs)</h2>
        {(applications ?? []).length > 0 ? (
          <ul className="space-y-3">
            {(applications ?? []).map((app) => {
              const hasTailored = appIdsWithVariant.has(app.id);
              const hasLetter = appIdsWithCoverLetter.has(app.id);
              return (
                <li
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[var(--border-subtle)] last:border-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/applications/${app.id}`}
                      className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)]"
                    >
                      {app.job_title}
                    </Link>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{app.company_name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasTailored && (
                      <span className="text-xs text-emerald-500">Tailored</span>
                    )}
                    {hasLetter && (
                      <span className="text-xs text-emerald-500">Letter</span>
                    )}
                    <ApplicationStatusBadge status={app.status} />
                    <Link
                      href={`/dashboard/applications/${app.id}`}
                      className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                    >
                      {hasTailored && hasLetter ? "Open / Download both" : "Get resume + letter"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[var(--text-secondary)] text-sm mb-4">No applications yet. Paste a job above to get started.</p>
        )}
        <Link
          href="/dashboard/applications"
          className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          View all applications
        </Link>
      </section>

      <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-3">Resumes</h2>
        {resumes && resumes.length > 0 ? (
          <ul className="space-y-2">
            {resumes.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <Link
                  href={`/dashboard/resumes/${r.id}`}
                  className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
                >
                  {r.name}
                </Link>
                <span className="text-[var(--text-tertiary)] text-sm shrink-0">
                  {new Date(r.updated_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--text-secondary)] text-sm mb-1">No resumes yet.</p>
        )}
        <Link
          href="/dashboard/resumes/new"
          className="mt-4 inline-flex items-center text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          + New resume
        </Link>
      </section>

      <div className="mt-8">
        <Link
          href="/dashboard/profile"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Edit career profile →
        </Link>
      </div>
    </div>
  );
}
