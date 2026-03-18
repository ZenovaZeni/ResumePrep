"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { ResumeData, ResumeDesignTemplateId, ResumeDesignFontId } from "@/types/resume";
import { DESIGN_TEMPLATES, DESIGN_FONTS } from "@/types/resume";
import type { CoverLetterModel } from "@/lib/ai";
import type { MatchSummary, InterviewPrep } from "@/types/database";
import { TagInput } from "@/components/TagInput";

// ─── Types ────────────────────────────────────────────────────────────────────

export type KitData = {
  tailoredResumeData: ResumeData;
  coverLetter: CoverLetterModel;
  matchSummary?: MatchSummary | null;
  interviewPrep?: InterviewPrep | null;
  atsScore?: number | null;
  atsFeedback?: { gaps?: string[]; missingKeywords?: string[]; strengths?: string[]; feedback?: string[] } | null;
  applicationId?: string;
  variantId?: string;
  documentId?: string;
};

interface KitWorkspaceProps {
  kit: KitData;
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  isSavedMode?: boolean;
  onNewJob?: () => void;
  onKitChange?: (updated: KitData) => void;
}

type Tab = "resume" | "letter" | "interview";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  return score >= 75 ? "text-emerald-400" : score >= 55 ? "text-amber-400" : "text-red-400";
}
function scoreBarColor(score: number) {
  return score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-amber-400" : "bg-red-500";
}
function scoreLabel(score: number) {
  return score >= 75 ? "Strong fit" : score >= 55 ? "Decent fit" : "Weak fit";
}

function coverLetterToPlainText(cl: CoverLetterModel): string {
  return [
    cl.senderName,
    cl.senderEmail,
    [cl.senderPhone, cl.senderLocation].filter(Boolean).join(" · "),
    "",
    cl.date,
    "",
    cl.greeting,
    "",
    ...cl.paragraphs.map((p) => `${p}\n`),
    cl.closing,
    cl.signature,
  ]
    .filter((l) => l !== null && l !== undefined)
    .join("\n");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
          className={`w-4 h-4 shrink-0 text-[var(--text-tertiary)] transition-transform mt-1 ${open ? "rotate-180" : ""}`}
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
          <p className="text-sm text-[var(--text-secondary)] pt-3 pl-9 leading-relaxed">{modelAnswer}</p>
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
                Copy Q&amp;A
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Resume HTML Preview ──────────────────────────────────────────────────────

function ResumePreview({
  data,
  templateId,
  fontId,
}: {
  data: ResumeData;
  templateId: ResumeDesignTemplateId;
  fontId: ResumeDesignFontId;
}) {
  const isSerif = fontId === "serif";
  const fontClass = isSerif ? "font-serif" : "font-sans";
  const isModern = templateId === "modern";
  const isCompact = templateId === "compact";
  const isMinimal = templateId === "minimal";

  const accentClass = isModern
    ? "text-blue-600"
    : isMinimal
    ? "text-[var(--text-secondary)]"
    : "text-[var(--accent)]";

  const sectionHeadingClass = isModern
    ? "text-xs font-bold uppercase tracking-widest text-blue-600 border-b border-blue-200 pb-0.5 mb-2"
    : isMinimal
    ? "text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] pb-0.5 mb-2"
    : "text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-b border-[var(--accent)]/30 pb-0.5 mb-2";

  const gap = isCompact ? "mb-2" : "mb-4";

  return (
    <div
      className={`${fontClass} text-[var(--text-primary)] text-[11px] leading-relaxed`}
      style={{ minHeight: "400px" }}
    >
      {/* Header */}
      {data.contact && (
        <div className={`text-center ${gap}`}>
          {data.contact.name && (
            <p className={`text-xl font-bold ${isCompact ? "text-base" : ""} ${accentClass} mb-0.5`}>
              {data.contact.name}
            </p>
          )}
          <p className="text-[10px] text-[var(--text-tertiary)]">
            {[data.contact.email, data.contact.phone, data.contact.location, data.contact.linkedin]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <div className={gap}>
          <p className={sectionHeadingClass}>Summary</p>
          <p className="text-[var(--text-secondary)]">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {(data.experience ?? []).length > 0 && (
        <div className={gap}>
          <p className={sectionHeadingClass}>Experience</p>
          <div className={isCompact ? "space-y-1.5" : "space-y-3"}>
            {data.experience!.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-[var(--text-primary)] text-[11px]">
                    {exp.role}{" "}
                    <span className="font-normal text-[var(--text-secondary)]">· {exp.company}</span>
                  </p>
                  <span className="shrink-0 text-[9px] text-[var(--text-tertiary)] whitespace-nowrap">
                    {exp.start} – {exp.end}
                  </span>
                </div>
                {(exp.bullets ?? []).length > 0 && (
                  <ul className="mt-0.5 space-y-0.5 pl-2">
                    {exp.bullets.map((b, bi) => (
                      <li key={bi} className="text-[var(--text-secondary)] flex gap-1.5">
                        <span className="shrink-0 text-[var(--text-tertiary)]">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {(data.education ?? []).length > 0 && (
        <div className={gap}>
          <p className={sectionHeadingClass}>Education</p>
          <div className="space-y-1">
            {data.education!.map((edu, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-[var(--text-primary)]">
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                  <span className="font-normal text-[var(--text-secondary)]"> · {edu.school}</span>
                </p>
                <span className="shrink-0 text-[9px] text-[var(--text-tertiary)] whitespace-nowrap">
                  {edu.start} – {edu.end}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {(data.skills ?? []).length > 0 && (
        <div className={gap}>
          <p className={sectionHeadingClass}>Skills</p>
          <p className="text-[var(--text-secondary)]">{data.skills!.join(", ")}</p>
        </div>
      )}

      {/* Projects */}
      {(data.projects ?? []).length > 0 && (
        <div className={gap}>
          <p className={sectionHeadingClass}>Projects</p>
          <div className="space-y-1">
            {data.projects!.map((p, i) => (
              <div key={i}>
                <p className="font-semibold text-[var(--text-primary)]">{p.name}</p>
                {p.description && <p className="text-[var(--text-secondary)]">{p.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cover Letter Renderer ─────────────────────────────────────────────────────

function CoverLetterPreview({ model }: { model: CoverLetterModel }) {
  return (
    <div className="font-sans text-sm text-[var(--text-primary)] leading-relaxed space-y-4 p-6 rounded-xl bg-white/5 border border-[var(--border-subtle)]">
      {/* Sender block */}
      <div className="text-xs text-[var(--text-secondary)]">
        <p className="font-semibold text-[var(--text-primary)]">{model.senderName}</p>
        {model.senderEmail && <p>{model.senderEmail}</p>}
        {(model.senderPhone || model.senderLocation) && (
          <p>{[model.senderPhone, model.senderLocation].filter(Boolean).join(" · ")}</p>
        )}
      </div>

      <p className="text-xs text-[var(--text-tertiary)]">{model.date}</p>

      {/* Recipient block */}
      <div className="text-xs text-[var(--text-secondary)]">
        <p>{model.recipientName !== "Hiring Manager" ? model.recipientName : "Hiring Manager"}</p>
        <p>{model.companyName}</p>
        <p className="italic">{model.jobTitle}</p>
      </div>

      {/* Greeting */}
      <p className="font-medium">{model.greeting}</p>

      {/* Body paragraphs */}
      {model.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}

      {/* Closing */}
      <div>
        <p>{model.closing}</p>
        <p className="mt-4 font-medium">{model.signature}</p>
      </div>
    </div>
  );
}

// ─── Match Summary Sidebar ────────────────────────────────────────────────────

function MatchSummarySidebar({
  matchSummary,
  atsScore,
  atsFeedback,
}: {
  matchSummary?: MatchSummary | null;
  atsScore?: number | null;
  atsFeedback?: KitData["atsFeedback"];
}) {
  const score = atsScore ?? matchSummary?.matchScore ?? null;
  if (score === null && !matchSummary) return null;

  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
      {score !== null && (
        <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="shrink-0 text-center w-14">
            <span className={`text-3xl font-bold tabular-nums ${scoreColor(score)}`}>{score}</span>
            <span className="text-sm text-[var(--text-tertiary)]">%</span>
            <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider">
              {scoreLabel(score)}
            </p>
          </div>

          {matchSummary && (
            <div className="flex-1 min-w-0 space-y-2.5">
              {matchSummary.matchedKeywords.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    Strong match
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchSummary.matchedKeywords.slice(0, 5).map((kw) => (
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
              {matchSummary.missingKeywords.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                    Address in letter
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchSummary.missingKeywords.slice(0, 4).map((kw) => (
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
          )}
        </div>
      )}

      {matchSummary && (matchSummary.strengths.length > 0 || matchSummary.gaps.length > 0) && (
        <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-[var(--border-subtle)] text-xs">
          {matchSummary.strengths.length > 0 && (
            <div>
              <p className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] mb-1.5">Strengths</p>
              <ul className="space-y-1">
                {matchSummary.strengths.map((s, i) => (
                  <li key={i} className="flex gap-1.5 text-[var(--text-secondary)]">
                    <span className="text-emerald-500 shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {matchSummary.gaps.length > 0 && (
            <div>
              <p className="font-semibold text-amber-400 uppercase tracking-wider text-[10px] mb-1.5">Gaps</p>
              <ul className="space-y-1">
                {matchSummary.gaps.map((g, i) => (
                  <li key={i} className="flex gap-1.5 text-[var(--text-secondary)]">
                    <span className="text-amber-500 shrink-0">→</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {atsFeedback?.feedback && atsFeedback.feedback.length > 0 && (
        <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">ATS feedback</p>
          <ul className="space-y-1">
            {atsFeedback.feedback.map((f, i) => (
              <li key={i} className="text-xs text-[var(--text-secondary)] flex gap-1.5">
                <span className="text-[var(--text-tertiary)] shrink-0">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {matchSummary?.suggestedAngle && (
        <div className="px-5 py-3 bg-[var(--accent)]/5">
          <p className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
            Suggested angle
          </p>
          <p className="text-xs text-[var(--text-primary)] leading-relaxed italic">
            {matchSummary.suggestedAngle}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main KitWorkspace ────────────────────────────────────────────────────────

export function KitWorkspace({
  kit: initialKit,
  jobTitle,
  companyName,
  jobDescription,
  isSavedMode = false,
  onNewJob,
  onKitChange,
}: KitWorkspaceProps) {
  const [kit, setKit] = useState<KitData>(initialKit);
  const [activeTab, setActiveTab] = useState<Tab>("resume");

  // Resume editor state
  const [templateId, setTemplateIdState] = useState<ResumeDesignTemplateId>(
    (initialKit.tailoredResumeData.design?.templateId) ?? "clean"
  );
  const [fontId, setFontIdState] = useState<ResumeDesignFontId>(
    (initialKit.tailoredResumeData.design?.fontFamily) ?? "sans"
  );
  const setTemplateId = (id: ResumeDesignTemplateId) => {
    setTemplateIdState(id);
    setKit((prev) => ({
      ...prev,
      tailoredResumeData: prev.tailoredResumeData
        ? { ...prev.tailoredResumeData, design: { templateId: id, fontFamily: fontId } }
        : prev.tailoredResumeData,
    }));
  };
  const setFontId = (id: ResumeDesignFontId) => {
    setFontIdState(id);
    setKit((prev) => ({
      ...prev,
      tailoredResumeData: prev.tailoredResumeData
        ? { ...prev.tailoredResumeData, design: { templateId, fontFamily: id } }
        : prev.tailoredResumeData,
    }));
  };
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

  // Cover letter editor state
  const [letter, setLetter] = useState<CoverLetterModel>(initialKit.coverLetter);
  const [copyDone, setCopyDone] = useState(false);
  const [letterSaving, setLetterSaving] = useState(false);
  const [letterSaved, setLetterSaved] = useState(isSavedMode);
  const [letterHasUnsaved, setLetterHasUnsaved] = useState(false);
  const [letterDownloading, setLetterDownloading] = useState<"txt" | "docx" | null>(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [toneSelector, setToneSelector] = useState(initialKit.coverLetter.tone ?? "professional");
  const [lengthSelector, setLengthSelector] = useState(initialKit.coverLetter.lengthHint ?? "standard");

  // Interview prep state
  const [prep, setPrep] = useState<InterviewPrep | null>(initialKit.interviewPrep ?? null);
  const [prepLoading, setPrepLoading] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Resume mutations ──────────────────────────────────────────────────────

  const updateResume = useCallback(
    (updater: (r: ResumeData) => ResumeData) => {
      setKit((k) => {
        const updated = { ...k, tailoredResumeData: updater(k.tailoredResumeData) };
        onKitChange?.(updated);
        return updated;
      });
    },
    [onKitChange]
  );

  // ── Cover letter mutations ────────────────────────────────────────────────

  function handleLetterFieldChange<K extends keyof CoverLetterModel>(
    field: K,
    value: CoverLetterModel[K]
  ) {
    setLetter((l) => ({ ...l, [field]: value }));
    setLetterHasUnsaved(true);
    setLetterSaved(false);
  }

  function handleLetterParagraphChange(index: number, value: string) {
    setLetter((l) => {
      const paragraphs = [...l.paragraphs];
      paragraphs[index] = value;
      return { ...l, paragraphs };
    });
    setLetterHasUnsaved(true);
    setLetterSaved(false);
  }

  async function handleSaveLetter() {
    if (!kit.documentId) return;
    setLetterSaving(true);
    try {
      await fetch("/api/cover-letter/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: kit.documentId, content: coverLetterToPlainText(letter) }),
      });
      if (kit.applicationId) {
        await fetch(`/api/applications/${kit.applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cover_letter: letter }),
        });
      }
      setLetterSaved(true);
      setLetterHasUnsaved(false);
    } finally {
      setLetterSaving(false);
    }
  }

  async function handleRegenLetter() {
    setRegenLoading(true);
    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: jobDescription ?? "",
          company_name: companyName || "Company",
          job_title: jobTitle || "Role",
          ...(kit.applicationId ? { application_id: kit.applicationId } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data.coverLetter) {
        const newLetter = data.coverLetter as CoverLetterModel;
        setLetter({ ...newLetter, tone: toneSelector, lengthHint: lengthSelector });
        setLetterSaved(true);
        setLetterHasUnsaved(false);
        setKit((k) => ({ ...k, documentId: data.documentId ?? k.documentId }));
      }
    } finally {
      setRegenLoading(false);
    }
  }

  function handleCopyLetter() {
    void navigator.clipboard.writeText(coverLetterToPlainText(letter));
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }

  function downloadLetterTxt() {
    setLetterDownloading("txt");
    const blob = new Blob([coverLetterToPlainText(letter)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover-Letter-${(companyName || "Application").replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setLetterDownloading(null);
  }

  async function downloadLetterDocx() {
    setLetterDownloading("docx");
    try {
      const text = coverLetterToPlainText(letter);
      const paragraphs = text
        .split(/\n\n+/)
        .flatMap((block) => [
          new Paragraph({
            children: block.split("\n").map(
              (line, i, arr) => new TextRun({ text: line, break: i < arr.length - 1 ? 1 : 0 })
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

  // ── Resume exports ────────────────────────────────────────────────────────

  async function handleExportPDF() {
    setExporting("pdf");
    try {
      const { ResumePDFDocument } = await import("@/lib/resume-pdf");
      const blob = await pdf(
        <ResumePDFDocument data={{ ...kit.tailoredResumeData, design: { templateId, fontFamily: fontId } }} />
      ).toBlob();
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
              text: [d.contact?.email, d.contact?.phone, d.contact?.location].filter(Boolean).join(" · "),
              size: 22,
            }),
          ],
        }),
        new Paragraph({ text: "" })
      );
      if (d.summary) {
        children.push(
          new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
          new Paragraph({ text: d.summary, spacing: { after: 200 } })
        );
      }
      for (const exp of d.experience ?? []) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `${exp.role} at ${exp.company}`, bold: true })],
            spacing: { before: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `${exp.start} – ${exp.end}`, italics: true, size: 20 })],
          })
        );
        for (const b of exp.bullets ?? []) {
          children.push(new Paragraph({ text: `• ${b}`, bullet: { level: 0 }, spacing: { before: 50 } }));
        }
      }
      if ((d.education ?? []).length > 0) {
        children.push(
          new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } })
        );
        for (const edu of d.education!) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`, bold: true }),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: `${edu.school} · ${edu.start} – ${edu.end}`, size: 20 })],
            })
          );
        }
      }
      if ((d.skills ?? []).length > 0) {
        children.push(
          new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
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

  // ── Interview prep ────────────────────────────────────────────────────────

  async function fetchInterviewPrep() {
    setPrepLoading(true);
    try {
      const res = await fetch("/api/interview/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle || "This role",
          company_name: companyName || "This company",
          job_description: jobDescription ?? "",
          ...(kit.applicationId ? { application_id: kit.applicationId } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPrep({ questions: data.questions ?? [], brief: data.brief ?? "", modelAnswers: data.modelAnswers ?? [] });
      }
    } finally {
      setPrepLoading(false);
    }
  }

  // ── Save to applications (new kit mode) ──────────────────────────────────

  async function handleSaveKit() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/apply/save-to-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_id: kit.variantId,
          document_id: kit.documentId,
          company_name: companyName.trim() || "Company",
          job_title: jobTitle.trim() || "Role",
          job_description: jobDescription?.trim() ?? null,
          match_summary: kit.matchSummary ?? undefined,
          interview_prep: prep ?? undefined,
          tailored_resume: kit.tailoredResumeData,
          cover_letter: letter,
          ats_score: kit.atsScore ?? undefined,
          ats_feedback: kit.atsFeedback ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save");
        return;
      }
      setKit((k) => ({ ...k, applicationId: data.applicationId as string }));
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="pb-24 lg:pb-0">
      {/* Header */}
      {!isSavedMode && (
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
              {jobTitle ? (companyName ? `${jobTitle} at ${companyName}` : jobTitle) : companyName || "Application kit"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Tailored resume, cover letter, and interview prep — ready to use
            </p>
          </div>
          {onNewJob && (
            <button
              type="button"
              onClick={onNewJob}
              className="shrink-0 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mt-1 whitespace-nowrap"
            >
              ← New job
            </button>
          )}
        </div>
      )}

      {/* Main grid */}
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 space-y-6 lg:space-y-0 items-start">

        {/* ── Left: tabs + tab content ──────────────────────────────────── */}
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
                <svg className="w-4 h-4 shrink-0 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                </svg>
                <span className="truncate">{t.label}</span>
                {t.id === "interview" && prepLoading && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* ── Resume tab ──────────────────────────────────────────────── */}
          {activeTab === "resume" && (
            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
                {/* Template */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--text-tertiary)] shrink-0">Template</label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value as ResumeDesignTemplateId)}
                    className="text-xs bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    {DESIGN_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                {/* Font */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--text-tertiary)] shrink-0">Font</label>
                  <select
                    value={fontId}
                    onChange={(e) => setFontId(e.target.value as ResumeDesignFontId)}
                    className="text-xs bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    {DESIGN_FONTS.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1" />
                {/* Exports */}
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={exporting !== null}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {exporting === "pdf" ? "Generating…" : "PDF"}
                </button>
                <button
                  type="button"
                  onClick={handleExportDOCX}
                  disabled={exporting !== null}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--bg-glass)] disabled:opacity-50 transition-all"
                >
                  {exporting === "docx" ? "Generating…" : "DOCX"}
                </button>
              </div>

              {/* Split: editor left, preview right */}
              <div className="grid md:grid-cols-2 divide-x divide-[var(--border-subtle)]">
                {/* Editor */}
                <div className="p-5 space-y-5 overflow-auto max-h-[600px]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                    Edit content
                  </p>

                  {/* Contact */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Contact</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["name", "email", "phone", "location"] as const).map((field) => (
                        <input
                          key={field}
                          type="text"
                          value={kit.tailoredResumeData.contact?.[field] ?? ""}
                          onChange={(e) =>
                            updateResume((r) => ({
                              ...r,
                              contact: { ...r.contact, [field]: e.target.value },
                            }))
                          }
                          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Summary</p>
                    <textarea
                      value={kit.tailoredResumeData.summary ?? ""}
                      onChange={(e) => updateResume((r) => ({ ...r, summary: e.target.value }))}
                      rows={3}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>

                  {/* Experience */}
                  {(kit.tailoredResumeData.experience ?? []).length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-[var(--text-secondary)]">Experience</p>
                      {kit.tailoredResumeData.experience!.map((exp, ei) => (
                        <div key={ei} className="rounded-lg border border-[var(--border-subtle)] p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) =>
                                updateResume((r) => {
                                  const experience = [...(r.experience ?? [])];
                                  experience[ei] = { ...experience[ei], role: e.target.value };
                                  return { ...r, experience };
                                })
                              }
                              placeholder="Role"
                              className="px-2 py-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            />
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) =>
                                updateResume((r) => {
                                  const experience = [...(r.experience ?? [])];
                                  experience[ei] = { ...experience[ei], company: e.target.value };
                                  return { ...r, experience };
                                })
                              }
                              placeholder="Company"
                              className="px-2 py-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            />
                          </div>
                          {exp.bullets.map((b, bi) => (
                            <textarea
                              key={bi}
                              value={b}
                              onChange={(e) =>
                                updateResume((r) => {
                                  const experience = [...(r.experience ?? [])];
                                  const bullets = [...experience[ei].bullets];
                                  bullets[bi] = e.target.value;
                                  experience[ei] = { ...experience[ei], bullets };
                                  return { ...r, experience };
                                })
                              }
                              rows={2}
                              className="w-full px-2 py-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Skills</p>
                    <TagInput
                      tags={kit.tailoredResumeData.skills ?? []}
                      onChange={(tags) => updateResume((r) => ({ ...r, skills: tags }))}
                      placeholder="Type a skill, press Enter or comma to add…"
                    />
                  </div>
                </div>

                {/* Live preview */}
                <div className="p-5 overflow-auto max-h-[600px]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                    Live preview
                  </p>
                  <ResumePreview
                    data={{ ...kit.tailoredResumeData, design: { templateId, fontFamily: fontId } }}
                    templateId={templateId}
                    fontId={fontId}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Cover letter tab ─────────────────────────────────────────── */}
          {activeTab === "letter" && (
            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
              {/* Action bar */}
              <div className="flex flex-wrap items-center gap-2.5 px-5 py-4 border-b border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={handleCopyLetter}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-glass)] transition-colors"
                >
                  {copyDone ? (
                    <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Copied!</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={downloadLetterTxt}
                  disabled={letterDownloading !== null}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:bg-[var(--bg-glass)] disabled:opacity-40 transition-colors"
                >
                  TXT
                </button>
                <button
                  type="button"
                  onClick={downloadLetterDocx}
                  disabled={letterDownloading !== null}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:bg-[var(--bg-glass)] disabled:opacity-40 transition-colors"
                >
                  {letterDownloading === "docx" ? "…" : "DOCX"}
                </button>
                {letterHasUnsaved && (
                  <button
                    type="button"
                    onClick={handleSaveLetter}
                    disabled={letterSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50 transition-colors"
                  >
                    {letterSaving ? "Saving…" : "Save edits"}
                  </button>
                )}
                {letterSaved && !letterHasUnsaved && (
                  <span className="text-xs text-[var(--text-tertiary)]">Saved</span>
                )}
                <button
                  type="button"
                  onClick={handleRegenLetter}
                  disabled={regenLoading}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50 transition-colors"
                >
                  {regenLoading ? (
                    <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Regenerating…</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Regenerate</>
                  )}
                </button>
              </div>

              {/* Controls row: tone + length */}
              <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/50">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--text-tertiary)] shrink-0">Tone</label>
                  <select
                    value={toneSelector}
                    onChange={(e) => setToneSelector(e.target.value)}
                    className="text-xs bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    {["professional", "confident", "friendly", "formal"].map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--text-tertiary)] shrink-0">Length</label>
                  <select
                    value={lengthSelector}
                    onChange={(e) => setLengthSelector(e.target.value)}
                    className="text-xs bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    {["concise", "standard", "detailed"].map((l) => (
                      <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] ml-auto">
                  Change tone/length then Regenerate
                </p>
              </div>

              {/* Split: editable fields + formatted preview */}
              <div className="grid md:grid-cols-2 divide-x divide-[var(--border-subtle)]">
                {/* Edit fields */}
                <div className="p-5 space-y-4 overflow-auto max-h-[560px]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                    Edit letter
                  </p>

                  {/* Sender */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Your details</p>
                    {(["senderName", "senderEmail", "senderPhone", "senderLocation"] as const).map((field) => (
                      <input
                        key={field}
                        type="text"
                        value={(letter[field] as string | undefined) ?? ""}
                        onChange={(e) => handleLetterFieldChange(field, e.target.value)}
                        placeholder={{
                          senderName: "Your name",
                          senderEmail: "Your email",
                          senderPhone: "Phone (optional)",
                          senderLocation: "Location (optional)",
                        }[field]}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    ))}
                  </div>

                  {/* Recipient */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Recipient</p>
                    <input
                      type="text"
                      value={letter.recipientName}
                      onChange={(e) => handleLetterFieldChange("recipientName", e.target.value)}
                      placeholder="Hiring Manager"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                    <input
                      type="text"
                      value={letter.greeting}
                      onChange={(e) => handleLetterFieldChange("greeting", e.target.value)}
                      placeholder="Dear Hiring Manager,"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>

                  {/* Body paragraphs */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Body</p>
                    {letter.paragraphs.map((p, i) => (
                      <div key={i}>
                        <p className="text-[10px] text-[var(--text-tertiary)] mb-1">Paragraph {i + 1}</p>
                        <textarea
                          value={p}
                          onChange={(e) => handleLetterParagraphChange(i, e.target.value)}
                          rows={4}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          spellCheck
                        />
                      </div>
                    ))}
                  </div>

                  {/* Closing */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-[var(--text-tertiary)] mb-1">Closing</p>
                      <input
                        type="text"
                        value={letter.closing}
                        onChange={(e) => handleLetterFieldChange("closing", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-tertiary)] mb-1">Signature</p>
                      <input
                        type="text"
                        value={letter.signature}
                        onChange={(e) => handleLetterFieldChange("signature", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Formatted preview */}
                <div className="p-5 overflow-auto max-h-[560px]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                    Preview
                  </p>
                  <CoverLetterPreview model={letter} />
                </div>
              </div>
            </div>
          )}

          {/* ── Interview prep tab ──────────────────────────────────────── */}
          {activeTab === "interview" && (
            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5 space-y-4">
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
                  <div className="flex items-center gap-4">
                    <Link
                      href="/dashboard/interview"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                    >
                      Practice with live mock interview →
                    </Link>
                    <button
                      type="button"
                      onClick={fetchInterviewPrep}
                      className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Regenerate
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-4">
                  <button
                    type="button"
                    onClick={fetchInterviewPrep}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Generate interview prep
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: ATS + save CTA (desktop) ──────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-24 min-w-0">

          <MatchSummarySidebar
            matchSummary={kit.matchSummary}
            atsScore={kit.atsScore}
            atsFeedback={kit.atsFeedback}
          />

          {/* Save / saved CTA */}
          {!isSavedMode && (
            <>
              {!kit.applicationId ? (
                <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Save to applications</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Track this job and access your full kit any time.
                    </p>
                  </div>
                  {saveError && (
                    <p className="text-xs text-red-400">{saveError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveKit}
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
            </>
          )}
        </div>
      </div>

      {/* Mobile match summary */}
      {(kit.matchSummary || kit.atsScore) && (
        <div className="mt-4 lg:hidden">
          <MatchSummarySidebar
            matchSummary={kit.matchSummary}
            atsScore={kit.atsScore}
            atsFeedback={kit.atsFeedback}
          />
        </div>
      )}

      {/* Mobile save CTA */}
      {!isSavedMode && (
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
                  onClick={handleSaveKit}
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
      )}
    </div>
  );
}
