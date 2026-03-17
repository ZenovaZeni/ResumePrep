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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          Applications
        </h1>
        <Link
          href="/dashboard/applications/new"
          className="btn-primary px-4 py-2.5 text-sm font-medium"
        >
          + Add application
        </Link>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Track jobs and use AI to tailor resumes and generate cover letters for each one.
      </p>
      {sorted.length > 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg-elevated)] text-left text-sm text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Date applied</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {sorted.map((app) => (
                <tr key={app.id} className="bg-[var(--bg-primary)] hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{app.company_name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{app.job_title}</td>
                  <td className="px-4 py-3 text-[var(--text-tertiary)]">
                    {app.date_applied
                      ? new Date(app.date_applied).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ApplicationStatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/applications/${app.id}`}
                      className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-8 text-center">
          <p className="text-[var(--text-secondary)] mb-4">No applications yet. Add a job to get tailored resumes and cover letters.</p>
          <Link
            href="/dashboard/applications/new"
            className="btn-primary inline-block px-4 py-2.5 text-sm font-medium"
          >
            Add your first application
          </Link>
        </div>
      )}
    </div>
  );
}
