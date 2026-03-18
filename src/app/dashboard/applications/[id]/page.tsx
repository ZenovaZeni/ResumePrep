import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ApplicationActions } from "./ApplicationActions";
import { ApplicationInterviewPrep } from "./ApplicationInterviewPrep";
import { ApplicationMatchSummary } from "./ApplicationMatchSummary";
import { StatusPicker } from "./StatusPicker";
import type { ApplicationStatus } from "@/types/database";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: app }, resumesResult, coverLetterResult, variantResult] = await Promise.all([
    supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("resumes")
      .select("id, name")
      .eq("user_id", user.id),
    supabase
      .from("generated_documents")
      .select("id, content")
      .eq("application_id", id)
      .eq("type", "cover_letter")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("resume_variants")
      .select("id")
      .eq("job_application_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!app) notFound();

  const resumes = resumesResult.data ?? [];
  const savedCoverLetter = coverLetterResult.data?.[0]?.content ?? null;
  const savedCoverLetterId = coverLetterResult.data?.[0]?.id ?? null;
  const savedVariantId = variantResult.data?.[0]?.id ?? null;

  type MatchSummary = {
    matchScore: number;
    topKeywords: string[];
    matchedKeywords: string[];
    missingKeywords: string[];
    strengths: string[];
    gaps: string[];
    suggestedAngle: string;
  };

  type InterviewPrep = {
    questions: string[];
    brief: string;
    modelAnswers: string[];
  };

  const matchSummary = (app.match_summary as MatchSummary | null) ?? null;
  const interviewPrep = (app.interview_prep as InterviewPrep | null) ?? null;

  const dateLabel = app.date_applied
    ? new Date(app.date_applied).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const createdLabel = new Date(app.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All applications
      </Link>

      {/* Two-column on desktop, single column on mobile */}
      <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-8 space-y-6 lg:space-y-0 items-start">

        {/* ── Left column: job info ───────────────────── */}
        <div className="space-y-6 min-w-0">

          {/* Header card */}
          <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                  {app.job_title}
                </h1>
                <p className="text-[var(--text-secondary)] mt-0.5 text-sm sm:text-base">{app.company_name}</p>
              </div>
              <Link
                href={`/dashboard/applications/${app.id}/edit`}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </Link>
            </div>

            {/* Status picker */}
            <StatusPicker
              applicationId={app.id}
              initialStatus={app.status as ApplicationStatus}
            />

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--text-tertiary)]">
              <span>Added {createdLabel}</span>
              {dateLabel && <span>Applied {dateLabel}</span>}
              {app.job_url && (
                <a
                  href={app.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
                >
                  View job posting →
                </a>
              )}
            </div>

            {app.notes && (
              <div className="pt-1 border-t border-[var(--border-subtle)]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-1">Notes</p>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{app.notes}</p>
              </div>
            )}
          </div>

          {/* Match summary */}
          {matchSummary && (
            <ApplicationMatchSummary summary={matchSummary} />
          )}

          {/* Job description — collapsible */}
          {app.job_description && (
            <details className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden group">
              <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none select-none hover:bg-[var(--bg-glass)] transition-colors">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Job description</h2>
                <svg
                  className="w-4 h-4 text-[var(--text-tertiary)] transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 border-t border-[var(--border-subtle)]">
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed pt-4 max-h-72 overflow-auto">
                  {app.job_description}
                </p>
              </div>
            </details>
          )}
        </div>

        {/* ── Right column: AI tools + interview prep ── */}
        <div className="space-y-4 lg:sticky lg:top-24 min-w-0">

          {/* AI tools */}
          <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">AI tools</h2>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">
              Tailor a resume to this job and get an ATS score, or generate a fresh cover letter.
            </p>
            <ApplicationActions
              applicationId={app.id}
              companyName={app.company_name}
              jobTitle={app.job_title}
              jobDescription={app.job_description ?? ""}
              resumes={resumes}
              initialCoverLetter={savedCoverLetter}
              initialCoverLetterId={savedCoverLetterId}
              initialVariantId={savedVariantId}
            />
          </div>

          {/* Interview prep + follow-up */}
          <ApplicationInterviewPrep
            applicationId={app.id}
            companyName={app.company_name}
            jobTitle={app.job_title}
            initialPrep={interviewPrep}
          />
        </div>

      </div>
    </div>
  );
}
