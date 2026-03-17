import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ApplicationStatusBadge } from "../ApplicationStatusBadge";
import { ApplicationActions } from "./ApplicationActions";
import { ApplicationInterviewPrep } from "./ApplicationInterviewPrep";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: app } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!app) notFound();

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, name")
    .eq("user_id", user.id);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{app.job_title}</h1>
          <p className="text-[var(--text-secondary)] mt-0.5">{app.company_name}</p>
        </div>
        <ApplicationStatusBadge status={app.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Details</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[var(--text-tertiary)]">Date applied</dt>
              <dd className="text-[var(--text-primary)]">
                {app.date_applied
                  ? new Date(app.date_applied).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
            {app.job_url && (
              <div>
                <dt className="text-[var(--text-tertiary)]">Job URL</dt>
                <dd>
                  <a
                    href={app.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:text-[var(--accent-hover)]"
                  >
                    Open link →
                  </a>
                </dd>
              </div>
            )}
            {app.notes && (
              <div>
                <dt className="text-[var(--text-tertiary)]">Notes</dt>
                <dd className="text-[var(--text-primary)] whitespace-pre-wrap">{app.notes}</dd>
              </div>
            )}
          </dl>
          <Link
            href={`/dashboard/applications/${app.id}/edit`}
            className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
          >
            Edit details
          </Link>
        </section>

        <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-1">AI tools for this job</h2>
          <p className="text-xs text-[var(--text-tertiary)] mb-4">Tailor a resume, get an ATS score, or generate a cover letter.</p>
          <ApplicationActions
            applicationId={app.id}
            companyName={app.company_name}
            jobTitle={app.job_title}
            jobDescription={app.job_description ?? ""}
            resumes={resumes ?? []}
          />
        </section>
      </div>

      {app.job_description && (
        <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Job description</h2>
          <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-sans max-h-64 overflow-auto">
            {app.job_description}
          </pre>
        </section>
      )}

      <section className="mt-8">
        <ApplicationInterviewPrep
          applicationId={app.id}
          companyName={app.company_name}
          jobTitle={app.job_title}
        />
      </section>

      <div className="mt-6">
        <Link href="/dashboard/applications" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          ← Back to applications
        </Link>
      </div>
    </div>
  );
}
