import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SampleResumes } from "./SampleResumes";
import { SchemaErrorBanner } from "@/components/SchemaErrorBanner";

export default async function ResumesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: resumes, error: resumesError }] = await Promise.all([
    user
      ? supabase.from("profiles").select("tier").eq("user_id", user.id).single()
      : Promise.resolve({ data: null }),
    supabase.from("resumes").select("id, name, updated_at").order("updated_at", { ascending: false }),
  ]);
  const tier = (profile?.tier as "free" | "pro" | null) ?? "free";
  const isTestAccount = user?.email === "test@example.com";
  const dbError = resumesError?.message ?? null;

  return (
    <div className="max-w-6xl mx-auto">
      <SchemaErrorBanner error={dbError} table="resumes" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Resumes
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xl">
            Build recruiter-ready resumes from your profile. Edit and export to PDF or DOCX.
          </p>
        </div>
        <Link
          href="/dashboard/resumes/new"
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New resume
        </Link>
      </div>

      {/* Two-column on desktop: resumes list left, templates right */}
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 items-start space-y-8 lg:space-y-0">

        {/* Left: my resumes */}
        <section className="min-w-0">
          <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">My resumes</h2>

          {dbError ? null : resumes && resumes.length > 0 ? (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {resumes.map((r) => (
                <li key={r.id}>
                  <div className="group flex flex-col gap-3 p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-sm transition-all h-full">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/resumes/${r.id}`}
                        className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors leading-snug block"
                      >
                        {r.name}
                      </Link>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        Updated {new Date(r.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 border-t border-[var(--border-subtle)] pt-3">
                      <Link href={`/dashboard/resumes/${r.id}`} className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                        Edit
                      </Link>
                      <Link href={`/dashboard/resumes/${r.id}/export`} className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                        Export
                      </Link>
                      <Link href={`/dashboard/resumes/${r.id}/versions`} className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors ml-auto">
                        Versions
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 sm:p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No resumes yet</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-5 max-w-sm mx-auto">
                Create a base resume from your profile, or paste a job and we&apos;ll generate a tailored version automatically.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/dashboard/resumes/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Create from profile
                </Link>
                <Link
                  href="/dashboard/apply"
                  className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                >
                  Or paste a job →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Right: templates (sticky) */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <SampleResumes tier={tier} isTestAccount={!!isTestAccount} />
        </div>

      </div>
    </div>
  );
}
