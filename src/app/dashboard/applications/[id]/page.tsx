import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { ApplicationStatus, ApplicationsRow, CoverLetterModel } from "@/types/database";
import type { ResumeData } from "@/types/resume";
import type { KitData } from "@/app/dashboard/apply/KitWorkspace";
import { SavedKitView } from "./SavedKitView";
import Link from "next/link";

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

  // Load application + fallback data in parallel
  const [{ data: app }, variantResult, coverLetterResult] = await Promise.all([
    supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("resume_variants")
      .select("id, resume_data")
      .eq("job_application_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("generated_documents")
      .select("id, content")
      .eq("application_id", id)
      .eq("type", "cover_letter")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!app) notFound();

  const typedApp = app as ApplicationsRow;

  // ── Resolve resume data (direct column > variant fallback) ────────────────
  let tailoredResumeData: ResumeData | null = null;
  if (typedApp.tailored_resume) {
    tailoredResumeData = typedApp.tailored_resume as ResumeData;
  } else if (variantResult.data?.[0]?.resume_data) {
    tailoredResumeData = variantResult.data[0].resume_data as ResumeData;
  }

  // ── Resolve cover letter (direct column > parse text fallback) ────────────
  let coverLetter: CoverLetterModel | null = null;
  if (typedApp.cover_letter) {
    coverLetter = typedApp.cover_letter;
  } else if (coverLetterResult.data?.[0]?.content) {
    // Build a basic CoverLetterModel from the stored text
    const text = coverLetterResult.data[0].content;
    const paragraphs = text
      .split(/\n\n+/)
      .map((p: string) => p.trim())
      .filter(Boolean);
    coverLetter = {
      senderName: "",
      senderEmail: "",
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      recipientName: "Hiring Manager",
      companyName: typedApp.company_name,
      jobTitle: typedApp.job_title,
      greeting: "Dear Hiring Manager,",
      paragraphs: paragraphs.length > 0 ? paragraphs : [""],
      closing: "Best regards,",
      signature: "",
    };
  }

  // ── If no kit data at all, show a prompt to generate ──────────────────────
  const hasKit = tailoredResumeData !== null;

  if (!hasKit) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/applications"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All applications
        </Link>

        <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6 mb-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{typedApp.job_title}</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">{typedApp.company_name}</p>
        </div>

        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-10 text-center">
          <p className="text-[var(--text-secondary)] mb-4">
            No kit generated for this application yet.
          </p>
          {typedApp.job_description ? (
            <Link
              href={`/dashboard/apply?jd=${encodeURIComponent(typedApp.job_description)}&title=${encodeURIComponent(typedApp.job_title)}&company=${encodeURIComponent(typedApp.company_name)}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Generate kit now →
            </Link>
          ) : (
            <Link
              href="/dashboard/apply"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Generate kit now →
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Build the KitData for the workspace ───────────────────────────────────
  const kit: KitData = {
    tailoredResumeData: tailoredResumeData!,
    coverLetter: coverLetter ?? {
      senderName: "",
      senderEmail: "",
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      recipientName: "Hiring Manager",
      companyName: typedApp.company_name,
      jobTitle: typedApp.job_title,
      greeting: "Dear Hiring Manager,",
      paragraphs: [""],
      closing: "Best regards,",
      signature: "",
    },
    matchSummary: typedApp.match_summary,
    interviewPrep: typedApp.interview_prep,
    atsScore: typedApp.ats_score,
    atsFeedback: typedApp.ats_feedback as KitData["atsFeedback"],
    applicationId: typedApp.id,
    variantId: variantResult.data?.[0]?.id ?? undefined,
    documentId: coverLetterResult.data?.[0]?.id ?? undefined,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <SavedKitView
        applicationId={typedApp.id}
        jobTitle={typedApp.job_title}
        companyName={typedApp.company_name}
        jobDescription={typedApp.job_description}
        jobUrl={typedApp.job_url}
        status={typedApp.status as ApplicationStatus}
        dateApplied={typedApp.date_applied}
        createdAt={typedApp.created_at}
        kit={kit}
      />
    </div>
  );
}
