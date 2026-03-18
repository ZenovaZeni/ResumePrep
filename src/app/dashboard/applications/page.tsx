import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

const STATUS_ORDER: Record<string, number> = {
  saved: 0,
  applied: 1,
  interview: 2,
  final_interview: 3,
  offer: 4,
  rejected: 5,
};

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function FollowUpNudge({ status, dateApplied }: { status: string; dateApplied: string | null }) {
  if (status !== "applied") return null;
  const days = daysSince(dateApplied);
  if (days === null || days < 7) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
      <span className="w-1 h-1 rounded-full bg-amber-400" />
      Follow up? ({days}d)
    </span>
  );
}

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("applications")
    .select("id, company_name, job_title, date_applied, status, created_at")
    .order("created_at", { ascending: false });

  const sorted = [...(applications ?? [])].sort(
    (a, b) => (STATUS_ORDER[b.status] ?? 0) - (STATUS_ORDER[a.status] ?? 0)
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Applications</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Track jobs and access your tailored kit for each one.</p>
        </div>
        <Link
          href="/dashboard/apply"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">New kit</span>
        </Link>
      </div>

      {sorted.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((app) => (
            <li key={app.id}>
              <Link
                href={`/dashboard/applications/${app.id}`}
                className="flex flex-col gap-3 p-4 h-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--bg-tertiary)] transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors leading-snug mb-1">
                    {app.job_title}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] truncate">{app.company_name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ApplicationStatusBadge status={app.status} />
                  <FollowUpNudge status={app.status} dateApplied={app.date_applied} />
                  {app.date_applied && (
                    <span className="text-xs text-[var(--text-tertiary)] ml-auto">
                      {new Date(app.date_applied).toLocaleDateString()}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 sm:p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No applications yet</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-6">
            Paste a job description to generate a tailored resume, cover letter, and interview prep — then save it here.
          </p>
          <Link
            href="/dashboard/apply"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate your first kit
          </Link>
        </div>
      )}
    </div>
  );
}
