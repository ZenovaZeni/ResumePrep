"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { ResumeData } from "@/types/resume";

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchSummary = {
  matchScore: number;
  topKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  suggestedAngle: string;
};

type Kit = {
  tailoredResumeData: ResumeData;
  coverLetter: string;
  applicationId?: string;
  variantId: string;
  documentId: string;
  resumeId?: string;
  matchSummary?: MatchSummary | null;
};

type InterviewPrep = {
  questions: string[];
  brief: string;
  modelAnswers: string[];
};

type Tab = "resume" | "letter" | "interview";

const STEPS = [
  "Reading job description…",
  "Tailoring your resume…",
  "Writing cover letter…",
  "Analysing match…",
];

const TABS: { id: Tab; label: string; icon: string }[] = [
  {
    id: "resume",
    label: "Tailored resume",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    id: "letter",
    label: "Cover letter",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    id: "interview",
    label: "Interview prep",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MatchSummaryCard({ summary }: { summary: MatchSummary }) {
  const score = summary.matchScore;
  const scoreColor =
    score >= 75 ? "text-emerald-400" : score >= 55 ? "text-amber-400" : "text-red-400";
  const barColor =
    score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-amber-400" : "bg-red-500";
  const scoreLabel = score >= 75 ? "Strong fit" : score >= 55 ? "Decent fit" : "Weak fit";

  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
      {/* Score row */}
      <div className="flex items-center gap-5 px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="shrink-0 text-center w-14">
          <span className={`text-3xl font-bold tabular-nums ${scoreColor}`}>{score}</span>
          <span className="text-sm text-[var(--text-tertiary)]">%</span>
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] mt-1.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider">
            {scoreLabel}
          </p>
        </div>

        <div className="flex-1 min-w-0 space-y-2.5">
          {summary.matchedKeywords.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                Strong match
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.matchedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          {summary.missingKeywords.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                Address in cover letter
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.missingKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-400 border border-amber-500/25"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strengths and gaps */}
      {(summary.strengths.length > 0 || summary.gaps.length > 0) && (
        <div className="px-5 py-4 grid sm:grid-cols-2 gap-4 border-b border-[var(--border-subtle)]">
          {summary.strengths.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                Your strengths for this role
              </p>
              <ul className="space-y-1.5">
                {summary.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.gaps.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Worth addressing
              </p>
              <ul className="space-y-1.5">
                {summary.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Suggested angle */}
      {summary.suggestedAngle && (
        <div className="px-5 py-3 bg-[var(--accent)]/5">
          <p className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
            Suggested angle
          </p>
          <p className="text-xs text-[var(--text-primary)] leading-relaxed italic">
            {summary.suggestedAngle}
          </p>
        </div>
      )}
    </div>
  );
}

function InterviewCard({
  question,
  modelAnswer,
  index,
}: {
  question: string;
  modelAnswer: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(`Q: ${question}\n\nSuggested answer: ${modelAnswer}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-[var(--bg-glass)] transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-xs font-bold flex items-center justify-center mt-0.5">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-[var(--text-primary)] leading-snug">{question}</span>
        </div>
        <svg
          className={`w-4 h-4 shrink-0 text-[var(--text-tertiary)] transition-transform mt-1 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-secondary)] pt-3 pl-9 leading-relaxed">
            {modelAnswer}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-2.5 ml-9 flex items-center gap-1.5 text-xs text-[var(--accent)] hover:opacity-80 transition-opacity"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Q&A
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ApplyFlow() {
  const router = useRouter();

  // Form state
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Generation state
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [kit, setKit] = useState<Kit | null>(null);

  // Interview prep
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);

  // Result UI
  const [activeTab, setActiveTab] = useState<Tab>("resume");
  const [copyDone, setCopyDone] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [saving, setSaving] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  // Cover letter edit/save/download
  const [letterSaving, setLetterSaving] = useState(false);
  const [letterSavedAt, setLetterSavedAt] = useState<Date | null>(null);
  const [letterHasUnsaved, setLetterHasUnsaved] = useState(false);
  const [letterDownloading, setLetterDownloading] = useState<"txt" | "docx" | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setKit(null);
    setPrep(null);
    setPreviewExpanded(false);
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
        coverLetter: data.coverLetter,
        applicationId: data.applicationId,
        variantId: data.variantId,
        documentId: data.documentId,
        resumeId: data.resumeId,
        matchSummary: data.matchSummary ?? null,
      });
      setLetterSavedAt(new Date());
      setLetterHasUnsaved(false);
      if (typeof window !== "undefined" && data.resumeId) {
        window.localStorage.setItem("smart-resume-last-used-resume-id", data.resumeId);
      }
      fetchInterviewPrep(data.applicationId);
    } finally {
      clearInterval(tick);
      setLoading(false);
    }
  }

  async function fetchInterviewPrep(applicationId?: string) {
    setPrepLoading(true);
    try {
      const res = await fetch("/api/interview/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle.trim() || "This role",
          company_name: companyName.trim() || "This company",
          job_description: jobDescription.trim(),
          ...(applicationId ? { application_id: applicationId } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPrep({
          questions: data.questions ?? [],
          brief: data.brief ?? "",
          modelAnswers: data.modelAnswers ?? [],
        });
      }
    } finally {
      setPrepLoading(false);
    }
  }

  async function handleRegenerateLetter() {
    if (!kit) return;
    setRegenLoading(true);
    setLetterHasUnsaved(false);
    setLetterSavedAt(null);
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: jobDescription.trim(),
          company_name: companyName.trim() || "Company",
          job_title: jobTitle.trim() || "Role",
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setKit((k) =>
          k
            ? {
                ...k,
                coverLetter: data.content as string,
                documentId: (data.documentId as string | undefined) ?? k.documentId,
              }
            : k
        );
        setLetterSavedAt(new Date());
      }
    } finally {
      setRegenLoading(false);
    }
  }

  function handleLetterChange(value: string) {
    setKit((k) => (k ? { ...k, coverLetter: value } : k));
    setLetterHasUnsaved(true);
  }

  async function handleSaveLetter() {
    if (!kit?.documentId || !kit.coverLetter) return;
    setLetterSaving(true);
    try {
      const res = await fetch("/api/cover-letter/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: kit.documentId, content: kit.coverLetter }),
      });
      if (res.ok) {
        setLetterSavedAt(new Date());
        setLetterHasUnsaved(false);
      }
    } finally {
      setLetterSaving(false);
    }
  }

  function downloadLetterTxt() {
    if (!kit?.coverLetter) return;
    setLetterDownloading("txt");
    const blob = new Blob([kit.coverLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover-Letter-${(companyName || "Application").replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setLetterDownloading(null);
  }

  async function downloadLetterDocx() {
    if (!kit?.coverLetter) return;
    setLetterDownloading("docx");
    try {
      const paragraphs = kit.coverLetter
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
      const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cover-Letter-${(companyName || "Application").replace(/\s+/g, "-")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLetterDownloading(null);
    }
  }

  function handleCopyLetter() {
    if (!kit) return;
    void navigator.clipboard.writeText(kit.coverLetter);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }

  async function handleExportPDF() {
    if (!kit) return;
    setExporting("pdf");
    try {
      const { ResumePDFDocument } = await import("@/lib/resume-pdf");
      const blob = await pdf(<ResumePDFDocument data={kit.tailoredResumeData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tailored-Resume-${(companyName || "Application").replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportDOCX() {
    if (!kit) return;
    setExporting("docx");
    try {
      const d = kit.tailoredResumeData;
      const children: Paragraph[] = [];
      children.push(
        new Paragraph({
          children: [new TextRun({ text: d.contact?.name || "Your Name", bold: true, size: 32 })],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: [d.contact?.email, d.contact?.phone, d.contact?.location]
                .filter(Boolean)
                .join(" · "),
              size: 22,
            }),
          ],
        }),
        new Paragraph({ text: "" })
      );
      if (d.summary) {
        children.push(
          new Paragraph({
            text: "Summary",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({ text: d.summary, spacing: { after: 200 } })
        );
      }
      if ((d.experience ?? []).length > 0) {
        children.push(
          new Paragraph({
            text: "Experience",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        for (const exp of d.experience!) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `${exp.role} at ${exp.company}`, bold: true })],
              spacing: { before: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `${exp.start} – ${exp.end}`, italics: true, size: 20 }),
              ],
            })
          );
          for (const b of exp.bullets ?? []) {
            children.push(
              new Paragraph({ text: `• ${b}`, bullet: { level: 0 }, spacing: { before: 50 } })
            );
          }
        }
      }
      if ((d.education ?? []).length > 0) {
        children.push(
          new Paragraph({
            text: "Education",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        for (const edu of d.education!) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${edu.school} · ${edu.start} – ${edu.end}`,
                  size: 20,
                }),
              ],
            })
          );
        }
      }
      if ((d.skills ?? []).length > 0) {
        children.push(
          new Paragraph({
            text: "Skills",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({ text: d.skills!.join(", ") })
        );
      }
      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tailored-Resume-${(companyName || "Application").replace(/\s+/g, "-")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  async function handleSave() {
    if (!kit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/apply/save-to-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_id: kit.variantId,
          document_id: kit.documentId,
          company_name: companyName.trim() || "Company",
          job_title: jobTitle.trim() || "Role",
          job_description: jobDescription.trim() || null,
          match_summary: kit.matchSummary ?? undefined,
          interview_prep: prep ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      router.push(`/dashboard/applications/${data.applicationId}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Input form ─────────────────────────────────────────────────────────────

  if (!kit) {
    return (
      <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="job_description"
            className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Job description <span className="text-[var(--accent)]">*</span>
          </label>
          <textarea
            id="job_description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
            rows={8}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50 resize-none text-sm leading-relaxed transition-colors"
            placeholder="Paste the full job description here…"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="job_title"
              className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5"
            >
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
            <label
              htmlFor="company_name"
              className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5"
            >
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
          disabled={loading || !jobDescription.trim()}
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

  // ── Result view ────────────────────────────────────────────────────────────

  return (
    <div className="pb-24 lg:pb-0">
      {/* Header — full width */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1 mb-3">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Kit ready
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
            {jobTitle
              ? companyName
                ? `${jobTitle} at ${companyName}`
                : jobTitle
              : companyName
              ? companyName
              : "Application kit"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Tailored resume, cover letter, and interview prep — ready to use
          </p>
        </div>
        <button
          type="button"
          onClick={() => setKit(null)}
          className="shrink-0 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mt-1 whitespace-nowrap"
        >
          ← New job
        </button>
      </div>

      {/* Desktop: 2-column. Mobile: stacked. */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 space-y-6 lg:space-y-0 items-start">

      {/* ── Left: tabs + tab content ───────────────── */}
      <div className="space-y-4 min-w-0">

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)]"
            }`}
          >
            <svg
              className="w-4 h-4 shrink-0 hidden sm:block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
            </svg>
            <span className="truncate">{t.label}</span>
            {t.id === "interview" && prepLoading && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5">
        {/* Resume tab */}
        {activeTab === "resume" && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={exporting !== null}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exporting === "pdf" ? "Generating…" : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={handleExportDOCX}
                disabled={exporting !== null}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)] disabled:opacity-50 transition-all"
              >
                {exporting === "docx" ? "Generating…" : "Download DOCX"}
              </button>
            </div>

            {/* Resume preview */}
            <div>
              <button
                type="button"
                onClick={() => setPreviewExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-2"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${previewExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                {previewExpanded ? "Hide preview" : "Preview content"}
              </button>
              {previewExpanded && (
                <div className="rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] p-5 space-y-4 text-sm">
                  {kit.tailoredResumeData.contact?.name && (
                    <div>
                      <p className="text-lg font-bold text-[var(--text-primary)]">
                        {kit.tailoredResumeData.contact.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {[
                          kit.tailoredResumeData.contact.email,
                          kit.tailoredResumeData.contact.phone,
                          kit.tailoredResumeData.contact.location,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  )}
                  {kit.tailoredResumeData.summary && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                        Summary
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {kit.tailoredResumeData.summary}
                      </p>
                    </div>
                  )}
                  {(kit.tailoredResumeData.experience ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                        Experience
                      </p>
                      <div className="space-y-3">
                        {kit.tailoredResumeData.experience!.slice(0, 3).map((exp, i) => (
                          <div key={i}>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {exp.role}{" "}
                              <span className="font-normal text-[var(--text-secondary)]">
                                at {exp.company}
                              </span>
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mb-1">
                              {exp.start} – {exp.end}
                            </p>
                            <ul className="space-y-0.5">
                              {(exp.bullets ?? []).slice(0, 3).map((b, bi) => (
                                <li key={bi} className="text-xs text-[var(--text-secondary)] flex gap-1.5">
                                  <span className="shrink-0 mt-0.5 text-[var(--text-tertiary)]">•</span>
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(kit.tailoredResumeData.skills ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {kit.tailoredResumeData.skills!.slice(0, 12).map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                          >
                            {s}
                          </span>
                        ))}
                        {(kit.tailoredResumeData.skills?.length ?? 0) > 12 && (
                          <span className="text-xs text-[var(--text-tertiary)]">
                            +{kit.tailoredResumeData.skills!.length - 12} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cover letter tab */}
        {activeTab === "letter" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyLetter}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-glass)] transition-colors"
              >
                {copyDone ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy to clipboard
                  </>
                )}
              </button>
              {/* Download TXT */}
              <button
                type="button"
                onClick={downloadLetterTxt}
                disabled={letterDownloading !== null}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-glass)] disabled:opacity-40 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                TXT
              </button>
              {/* Download DOCX */}
              <button
                type="button"
                onClick={downloadLetterDocx}
                disabled={letterDownloading !== null}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-glass)] disabled:opacity-40 transition-colors"
              >
                {letterDownloading === "docx" ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    DOCX
                  </>
                )}
              </button>
              {letterHasUnsaved && kit.documentId && (
                <button
                  type="button"
                  onClick={handleSaveLetter}
                  disabled={letterSaving}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50 transition-colors"
                >
                  {letterSaving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save edits
                    </>
                  )}
                </button>
              )}
              {letterSavedAt && !letterHasUnsaved && (
                <span className="text-xs text-[var(--text-tertiary)]">Saved</span>
              )}
              <button
                type="button"
                onClick={handleRegenerateLetter}
                disabled={regenLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50 transition-colors"
              >
                {regenLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Regenerating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </>
                )}
              </button>
            </div>
            <textarea
              value={kit.coverLetter}
              onChange={(e) => handleLetterChange(e.target.value)}
              rows={16}
              className="w-full px-5 py-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] leading-[1.8] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              spellCheck
            />
          </div>
        )}

        {/* Interview prep tab */}
        {activeTab === "interview" && (
          <div className="space-y-4">
            {prepLoading ? (
              <div className="flex items-center gap-3 py-6 text-sm text-[var(--text-secondary)]">
                <svg className="w-4 h-4 animate-spin shrink-0 text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Preparing interview questions specific to this role…
              </div>
            ) : prep ? (
              <>
                {prep.brief && (
                  <div className="p-4 rounded-xl bg-[var(--accent)]/8 border border-[var(--accent)]/20">
                    <p className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                      How to approach this interview
                    </p>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">{prep.brief}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {prep.questions.map((q, i) => (
                    <InterviewCard
                      key={i}
                      question={q}
                      modelAnswer={prep.modelAnswers[i] ?? ""}
                      index={i}
                    />
                  ))}
                </div>
                <Link
                  href="/dashboard/interview"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                >
                  Practice with live mock interview →
                </Link>
              </>
            ) : (
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => fetchInterviewPrep(kit.applicationId)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={TABS[2].icon} />
                  </svg>
                  Generate interview prep
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      </div>{/* end left column */}

      {/* ── Right sidebar: match summary + save CTA (desktop) ── */}
      <div className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-24 min-w-0">
        {kit.matchSummary && <MatchSummaryCard summary={kit.matchSummary} />}

        {/* Save CTA */}
        {!kit.applicationId ? (
          <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Save to applications</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Track this job and access your full kit any time.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-[var(--accent)]/20"
            >
              {saving ? "Saving…" : "Save application"}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-300">Application saved</p>
              <p className="text-xs text-emerald-400/70">Kit stored and ready to reference any time.</p>
            </div>
            <Link
              href={`/dashboard/applications/${kit.applicationId}`}
              className="w-full mt-1 flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-500/20 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
            >
              View application →
            </Link>
          </div>
        )}
      </div>

      </div>{/* end 2-col grid */}

      {/* Mobile-only match summary (shown below tabs on mobile, hidden on desktop) */}
      {kit.matchSummary && (
        <div className="mt-4 lg:hidden">
          <MatchSummaryCard summary={kit.matchSummary} />
        </div>
      )}

      {/* Mobile-only save CTA — fixed above bottom nav */}
      <div
        className="fixed left-0 right-0 lg:hidden z-30 p-4 bg-[var(--bg-primary)]/90 backdrop-blur-md border-t border-[var(--border-subtle)]"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-2xl mx-auto">
          {!kit.applicationId ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Save to applications</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">Track this job and access your full kit.</p>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="shrink-0 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="flex-1 text-sm font-semibold text-emerald-300">Application saved</p>
              <Link
                href={`/dashboard/applications/${kit.applicationId}`}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                View →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
