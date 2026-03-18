"use client";

import { useState, useEffect } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";

const LAST_USED_RESUME_KEY = "smart-resume-last-used-resume-id";

interface ResumeOption {
  id: string;
  name: string;
}

interface ApplicationActionsProps {
  applicationId: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  resumes: ResumeOption[];
  initialCoverLetter?: string | null;
  initialCoverLetterId?: string | null;
  initialVariantId?: string | null;
}

export function ApplicationActions({
  applicationId,
  companyName,
  jobTitle,
  jobDescription,
  resumes,
  initialCoverLetter,
  initialCoverLetterId,
  initialVariantId,
}: ApplicationActionsProps) {
  const [atsScore, setAtsScore] = useState<{ score: number; feedback: string[] } | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [tailoredId, setTailoredId] = useState<string | null>(initialVariantId ?? null);
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id ?? "");
  const [coverLetter, setCoverLetter] = useState<string | null>(initialCoverLetter ?? null);
  const [coverLetterId, setCoverLetterId] = useState<string | null>(initialCoverLetterId ?? null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterHighlight, setCoverLetterHighlight] = useState("");
  const [coverCopied, setCoverCopied] = useState(false);
  const [showCoverInput, setShowCoverInput] = useState(!!initialCoverLetter);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(initialCoverLetter ? new Date() : null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [downloading, setDownloading] = useState<"txt" | "docx" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || resumes.length === 0) return;
    const stored = localStorage.getItem(LAST_USED_RESUME_KEY);
    if (stored && resumes.some((r) => r.id === stored)) setSelectedResumeId(stored);
  }, [resumes]);

  function saveLastUsed(id: string) {
    if (typeof window !== "undefined") localStorage.setItem(LAST_USED_RESUME_KEY, id);
  }

  async function handleTailorAndScore() {
    if (!selectedResumeId || !jobDescription) return;
    setTailoring(true);
    setTailoredId(null);
    setAtsScore(null);
    setActionError(null);
    try {
      const res = await fetch("/api/apply/tailor-and-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          job_description: jobDescription,
          application_id: applicationId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.variantId) setTailoredId(data.variantId);
        if (typeof data.score === "number") setAtsScore({ score: data.score, feedback: data.feedback ?? [] });
        saveLastUsed(selectedResumeId);
      } else {
        setActionError(data.error ?? "Could not tailor resume");
      }
    } catch {
      setActionError("Network error — please try again");
    } finally {
      setTailoring(false);
    }
  }

  async function handleCoverLetter() {
    setCoverLetterLoading(true);
    setCoverLetter(null);
    setCoverLetterId(null);
    setActionError(null);
    setHasUnsavedChanges(false);
    setSavedAt(null);
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: jobDescription,
          company_name: companyName,
          job_title: jobTitle,
          application_id: applicationId,
          highlight: coverLetterHighlight.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setCoverLetter(data.content);
        setCoverLetterId(data.documentId ?? null);
        setSavedAt(new Date());
      } else if (!res.ok) {
        setActionError(data.error ?? "Could not generate cover letter");
      }
    } catch {
      setActionError("Network error — please try again");
    } finally {
      setCoverLetterLoading(false);
    }
  }

  function handleCoverLetterChange(value: string) {
    setCoverLetter(value);
    setHasUnsavedChanges(true);
  }

  async function handleSaveCoverLetter() {
    if (!coverLetter || !coverLetterId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cover-letter/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: coverLetterId, content: coverLetter }),
      });
      if (res.ok) {
        setSavedAt(new Date());
        setHasUnsavedChanges(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function copyCoverLetter() {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCoverCopied(true);
    setTimeout(() => setCoverCopied(false), 2000);
  }

  function downloadTxt() {
    if (!coverLetter) return;
    setDownloading("txt");
    const blob = new Blob([coverLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover-Letter-${(companyName || "Application").replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(null);
  }

  async function downloadDocx() {
    if (!coverLetter) return;
    setDownloading("docx");
    try {
      const paragraphs = coverLetter
        .split(/\n\n+/)
        .flatMap((block) => [
          new Paragraph({
            children: block.split("\n").map(
              (line, i, arr) =>
                new TextRun({ text: line, break: i < arr.length - 1 ? 1 : 0 })
            ),
            spacing: { after: 200 },
          }),
        ]);
      const doc = new Document({
        sections: [{ properties: {}, children: paragraphs }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cover-Letter-${(companyName || "Application").replace(/\s+/g, "-")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  }

  const scoreColor =
    atsScore
      ? atsScore.score >= 75
        ? "text-emerald-400"
        : atsScore.score >= 55
        ? "text-amber-400"
        : "text-red-400"
      : "";
  const scoreBarColor =
    atsScore
      ? atsScore.score >= 75
        ? "bg-emerald-500"
        : atsScore.score >= 55
        ? "bg-amber-400"
        : "bg-red-500"
      : "";

  const hasNoJD = !jobDescription;

  return (
    <div className="space-y-4">
      {/* Resume selector */}
      {resumes.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5">
            Resume
          </label>
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {hasNoJD && (
        <p className="text-xs text-[var(--text-tertiary)] italic">
          No job description saved — add one via Edit to use AI tools.
        </p>
      )}

      {/* Two primary actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleTailorAndScore}
          disabled={tailoring || !selectedResumeId || hasNoJD}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {tailoring ? (
            <>
              <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Tailoring…
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Tailor & score
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowCoverInput((v) => !v)}
          disabled={hasNoJD}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)] disabled:opacity-40 transition-all"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Cover letter
        </button>
      </div>

      {/* Cover letter generation panel */}
      {showCoverInput && (
        <div className="rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5">
              Anything to highlight? <span className="font-normal opacity-60">(optional)</span>
            </label>
            <input
              type="text"
              value={coverLetterHighlight}
              onChange={(e) => setCoverLetterHighlight(e.target.value)}
              placeholder="e.g. Recent certification, relocation, passion for X"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <button
            type="button"
            onClick={handleCoverLetter}
            disabled={coverLetterLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {coverLetterLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Writing…
              </>
            ) : coverLetter ? (
              "Regenerate"
            ) : (
              "Generate"
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {actionError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {actionError}
          {actionError.includes("No resume") && (
            <span className="block mt-1">
              <a href="/dashboard/resumes/new" className="underline font-medium">Create a resume first →</a>
            </span>
          )}
        </div>
      )}

      {/* Previously saved tailored resume indicator */}
      {tailoredId && !atsScore && (
        <p className="text-xs text-emerald-400 font-medium">
          Tailored resume saved — accessible from the resume&apos;s Versions page.
        </p>
      )}

      {/* Tailor result */}
      {atsScore && (
        <div className="rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">ATS score</p>
            <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>{atsScore.score}<span className="text-sm font-normal opacity-60">/100</span></span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-primary)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${scoreBarColor}`}
              style={{ width: `${atsScore.score}%` }}
            />
          </div>
          {atsScore.feedback.length > 0 && (
            <ul className="space-y-1">
              {atsScore.feedback.map((f, i) => (
                <li key={i} className="text-xs text-[var(--text-secondary)] flex gap-2">
                  <span className="text-[var(--text-tertiary)] shrink-0">•</span>
                  {f}
                </li>
              ))}
            </ul>
          )}
          {tailoredId && (
            <p className="text-xs text-emerald-400 font-medium">
              Tailored version saved — accessible from the resume&apos;s Versions page.
            </p>
          )}
        </div>
      )}

      {/* Cover letter — editable */}
      {coverLetter !== null && (
        <div className="rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Cover letter</p>
            <div className="flex items-center gap-2.5">
              {savedAt && !hasUnsavedChanges && (
                <span className="text-[10px] text-[var(--text-tertiary)]">Saved</span>
              )}
              {hasUnsavedChanges && coverLetterId && (
                <button
                  type="button"
                  onClick={handleSaveCoverLetter}
                  disabled={saving}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
              )}
              {/* Download TXT */}
              <button
                type="button"
                onClick={downloadTxt}
                disabled={downloading !== null}
                title="Download as .txt"
                className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                TXT
              </button>
              {/* Download DOCX */}
              <button
                type="button"
                onClick={downloadDocx}
                disabled={downloading !== null}
                title="Download as .docx"
                className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
              >
                {downloading === "docx" ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                )}
                DOCX
              </button>
              <button
                type="button"
                onClick={copyCoverLetter}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                {coverCopied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
          <textarea
            value={coverLetter}
            onChange={(e) => handleCoverLetterChange(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 bg-transparent text-sm text-[var(--text-primary)] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)]/40"
            spellCheck
          />
        </div>
      )}
    </div>
  );
}
