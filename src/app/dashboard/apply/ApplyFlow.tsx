"use client";

import { useState } from "react";
import Link from "next/link";
import { KitWorkspace } from "./KitWorkspace";
import type { KitData } from "./KitWorkspace";
import type { CoverLetterModel } from "@/lib/ai";
import type { MatchSummary } from "@/types/database";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  "Reading job description…",
  "Tailoring your resume…",
  "Writing cover letter…",
  "Analysing match…",
];

const MIN_LENGTH_WARNING = 150;

type InputMode = "full" | "summary" | "url";

const INPUT_MODES: { id: InputMode; label: string; placeholder: string }[] = [
  {
    id: "full",
    label: "Full posting",
    placeholder: "Paste the full job description here for best results…",
  },
  {
    id: "summary",
    label: "Short summary",
    placeholder: "Paste a brief summary of the role, key requirements, and responsibilities…",
  },
  {
    id: "url",
    label: "Job URL",
    placeholder: "URL parsing coming soon — paste the job description above for now.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ApplyFlow() {
  // Form state
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("full");

  // Generation state
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [kit, setKit] = useState<KitData | null>(null);

  const isUrlMode = inputMode === "url";

  const showLengthWarning =
    !isUrlMode && jobDescription.length > 0 && jobDescription.trim().length < MIN_LENGTH_WARNING;

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setKit(null);
    setLoading(true);
    setStepIndex(0);

    const tick = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 2200);

    try {
      const res = await fetch("/api/apply/one-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: jobDescription.trim(),
          job_title: jobTitle.trim() || undefined,
          company_name: companyName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setKit({
        tailoredResumeData: data.tailoredResumeData,
        coverLetter: data.coverLetter as CoverLetterModel,
        applicationId: data.applicationId,
        variantId: data.variantId,
        documentId: data.documentId,
        matchSummary: (data.matchSummary as MatchSummary | null) ?? null,
        atsScore: typeof data.atsScore === "number" ? data.atsScore : null,
        atsFeedback: data.atsFeedback ?? null,
        interviewPrep: null,
      });

      if (typeof window !== "undefined" && data.resumeId) {
        window.localStorage.setItem("smart-resume-last-used-resume-id", data.resumeId as string);
      }
    } finally {
      clearInterval(tick);
      setLoading(false);
    }
  }

  // ── Input form ─────────────────────────────────────────────────────────────

  if (!kit) {
    return (
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Input mode switcher */}
          <div>
            <div className="flex gap-1 p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] w-fit mb-4">
              {INPUT_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setInputMode(m.id)}
                  disabled={m.id === "url"}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed ${
                    inputMode === m.id
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)] disabled:opacity-40"
                  }`}
                  title={m.id === "url" ? "URL parsing coming soon" : undefined}
                >
                  {m.label}
                  {m.id === "url" && (
                    <span className="ml-1.5 text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded-full">
                      soon
                    </span>
                  )}
                </button>
              ))}
            </div>

            {isUrlMode ? (
              <div className="w-full px-4 py-4 rounded-xl bg-[var(--bg-elevated)] border border-dashed border-[var(--border-subtle)] text-center">
                <p className="text-sm text-[var(--text-tertiary)]">
                  Automatic URL parsing is coming soon.
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  For now, open the job posting and paste the description in the{" "}
                  <button
                    type="button"
                    className="text-[var(--accent)] underline"
                    onClick={() => setInputMode("full")}
                  >
                    Full posting
                  </button>{" "}
                  tab.
                </p>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="job_description"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  {inputMode === "full" ? "Job description" : "Job summary"}{" "}
                  <span className="text-[var(--accent)]">*</span>
                </label>
                <textarea
                  id="job_description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required={!isUrlMode}
                  rows={8}
                  className={`w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50 resize-none text-sm leading-relaxed transition-colors ${
                    showLengthWarning
                      ? "border-amber-500/40"
                      : "border-[var(--border-subtle)]"
                  }`}
                  placeholder={INPUT_MODES.find((m) => m.id === inputMode)?.placeholder}
                />
                {/* Length warning */}
                {showLengthWarning && (
                  <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs text-amber-400 leading-relaxed">
                      Short description detected — results are significantly stronger with a full job posting.
                      Paste the complete listing including responsibilities, requirements, and company context.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="job_title" className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5">
                Job title <span className="text-[var(--text-tertiary)]">(optional)</span>
              </label>
              <input
                id="job_title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-colors"
                placeholder="e.g. Senior Engineer"
              />
            </div>
            <div>
              <label htmlFor="company_name" className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5">
                Company <span className="text-[var(--text-tertiary)]">(optional)</span>
              </label>
              <input
                id="company_name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-colors"
                placeholder="e.g. Acme Inc"
              />
            </div>
          </div>

          {error && (
            error.toLowerCase().includes("free tier") || error.toLowerCase().includes("upgrade") ? (
              <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--accent)]/30 overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent)] px-5 py-4">
                  <p className="text-sm font-semibold text-white">Monthly limit reached</p>
                  <p className="text-xs text-white/70 mt-0.5">Free plan includes 3 kits/month. Upgrade for unlimited.</p>
                </div>
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    {["Unlimited application kits", "Voice mock interview coach", "All premium templates"].map((f) => (
                      <p key={f} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <svg className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </p>
                    ))}
                  </div>
                  <Link
                    href="/dashboard/upgrade"
                    className="shrink-0 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
                  >
                    Upgrade to Pro →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
                {error.includes("No resume") && (
                  <span className="block mt-2">
                    <Link href="/dashboard/resumes/new" className="underline font-medium">
                      Create a resume first →
                    </Link>
                  </span>
                )}
              </div>
            )
          )}

          <button
            type="submit"
            disabled={loading || isUrlMode || !jobDescription.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[var(--accent)] text-white text-base font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-[var(--accent)]/20"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {STEPS[stepIndex]}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate application kit
              </>
            )}
          </button>

          {!loading && (
            <p className="text-xs text-[var(--text-tertiary)]">
              Uses your career profile as the base. Keep your{" "}
              <Link href="/dashboard/profile" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
                profile
              </Link>{" "}
              and{" "}
              <Link href="/dashboard/resumes" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
                resumes
              </Link>{" "}
              up to date for best results.
            </p>
          )}
        </form>
      </div>
    );
  }

  // ── Kit result view ────────────────────────────────────────────────────────

  return (
    <KitWorkspace
      kit={kit}
      jobTitle={jobTitle}
      companyName={companyName}
      jobDescription={jobDescription}
      onNewJob={() => setKit(null)}
      onKitChange={setKit}
    />
  );
}
