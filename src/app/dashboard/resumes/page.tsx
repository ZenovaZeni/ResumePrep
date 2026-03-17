import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SampleResumes } from "./SampleResumes";

export default async function ResumesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: resumes }] = await Promise.all([
    user ? supabase.from("profiles").select("tier").eq("user_id", user.id).single() : Promise.resolve({ data: null }),
    supabase.from("resumes").select("id, name, updated_at").order("updated_at", { ascending: false }),
  ]);
  const tier = (profile?.tier as "free" | "pro" | null) ?? "free";
  const isTestAccount = user?.email === "test@example.com";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero-style header */}
      <div className="mb-8 sm:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Resumes
            </h1>
            <p className="mt-1.5 text-[var(--text-secondary)] text-sm sm:text-base max-w-xl">
              Build recruiter-ready resumes from your profile. Pick a template, edit, and export to PDF or DOCX.
            </p>
          </div>
          <Link
            href="/dashboard/resumes/new"
            className="btn-primary px-5 py-3 text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-shadow shrink-0"
          >
            + New resume
          </Link>
        </div>
      </div>

      <SampleResumes tier={tier} isTestAccount={!!isTestAccount} />

      {/* My resumes — premium list */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">My resumes</h2>
        {resumes && resumes.length > 0 ? (
          <ul className="space-y-3">
            {resumes.map((r) => (
              <li
                key={r.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-md transition-all"
              >
                <Link
                  href={`/dashboard/resumes/${r.id}`}
                  className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                >
                  {r.name}
                </Link>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[var(--text-tertiary)]">
                    Updated {new Date(r.updated_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-4">
                    <Link
                      href={`/dashboard/resumes/${r.id}`}
                      className="text-[var(--accent)] font-medium hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/dashboard/resumes/${r.id}/export`}
                      className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    >
                      Export
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 sm:p-12 text-center">
            <p className="text-[var(--text-secondary)] mb-2 font-medium">
              No resumes yet
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mb-6 max-w-md mx-auto">
              Create your first resume from your career profile. We’ll generate a draft you can edit and export.
            </p>
            <Link
              href="/dashboard/resumes/new"
              className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl"
            >
              Create your first resume
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
