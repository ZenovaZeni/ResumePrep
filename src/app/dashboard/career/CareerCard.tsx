"use client";

import { useState } from "react";
import type { CareerSuggestionItem } from "@/types/career";
import { careerToText } from "@/lib/career-format";

export type CareerCardActions = {
  onSave?: () => void;
  onDiveDeeper?: (career: CareerSuggestionItem) => void;
  onCopy?: (career: CareerSuggestionItem) => void;
  onDownload?: (career: CareerSuggestionItem) => void;
  savedId?: string | null;
  onRemove?: (savedId: string) => void;
  saving?: boolean;
};

const QUICK_FIELDS: { key: keyof CareerSuggestionItem; label: string; icon: string }[] = [
  { key: "salary_range", label: "Pay", icon: "💰" },
  { key: "education_needed", label: "Education", icon: "🎓" },
  { key: "cost_to_become", label: "Cost to get there", icon: "📊" },
  { key: "time_to_qualify", label: "Time to qualify", icon: "⏱" },
  { key: "demand", label: "Demand", icon: "📈" },
];

const DETAIL_FIELDS: { key: keyof CareerSuggestionItem; label: string; icon: string }[] = [
  { key: "daily_life", label: "Daily life", icon: "☀️" },
  { key: "tips_to_get_job", label: "Tips to get the job", icon: "✅" },
  { key: "why_fit", label: "Why it fits you", icon: "✨" },
];

function Field({ label, icon, value }: { label: string; icon: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--text-tertiary)] flex items-center gap-1.5 mb-0.5">
        <span>{icon}</span> {label}
      </p>
      <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export function CareerCard({
  career,
  actions,
}: {
  career: CareerSuggestionItem;
  actions?: CareerCardActions;
}) {
  const [diveText, setDiveText] = useState<string | null>(null);
  const [diveLoading, setDiveLoading] = useState(false);
  const [bulletsText, setBulletsText] = useState<string | null>(null);
  const [bulletsLoading, setBulletsLoading] = useState(false);
  const [interviewText, setInterviewText] = useState<string | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const hasActions = actions && (
    actions.onSave ||
    actions.onDiveDeeper ||
    actions.onCopy ||
    actions.onDownload ||
    actions.onRemove
  );

  function handleCopy() {
    const text = careerToText(career, {
      moreDetail: diveText ?? undefined,
      resumeBullets: bulletsText ?? undefined,
      interviewQuestions: interviewText ?? undefined,
    });
    navigator.clipboard.writeText(text);
    actions?.onCopy?.(career);
  }

  function handleDownload() {
    const text = careerToText(career, {
      moreDetail: diveText ?? undefined,
      resumeBullets: bulletsText ?? undefined,
      interviewQuestions: interviewText ?? undefined,
    });
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${career.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-career.txt`;
    a.click();
    URL.revokeObjectURL(url);
    actions?.onDownload?.(career);
  }

  async function handleDiveDeeper() {
    if (diveText) {
      setDiveText(null);
      return;
    }
    setDiveLoading(true);
    try {
      const res = await fetch("/api/career/dive-deeper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(career),
      });
      const data = await res.json();
      if (res.ok && data.text) setDiveText(data.text);
    } finally {
      setDiveLoading(false);
    }
  }

  async function handleResumeBullets() {
    if (bulletsText) {
      setBulletsText(null);
      return;
    }
    setBulletsLoading(true);
    try {
      const res = await fetch("/api/career/resume-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(career),
      });
      const data = await res.json();
      if (res.ok && data.bullets) setBulletsText(data.bullets);
    } finally {
      setBulletsLoading(false);
    }
  }

  async function handleInterviewQuestions() {
    if (interviewText) {
      setInterviewText(null);
      return;
    }
    setInterviewLoading(true);
    try {
      const res = await fetch("/api/career/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(career),
      });
      const data = await res.json();
      if (res.ok && data.questions) setInterviewText(data.questions);
    } finally {
      setInterviewLoading(false);
    }
  }

  return (
    <article className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-subtle)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{career.title}</h3>
      </div>
      <div className="p-4 flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {QUICK_FIELDS.map(({ key, label, icon }) => {
            const value = career[key];
            if (!value || typeof value !== "string") return null;
            return (
              <div key={key} className="min-w-0">
                <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                  {icon} {label}
                </p>
                <p className="text-[var(--text-primary)] line-clamp-2" title={value}>{value}</p>
              </div>
            );
          })}
        </div>
        <div className="space-y-3 pt-1 border-t border-[var(--border-subtle)]">
          {DETAIL_FIELDS.map(({ key, label, icon }) => {
            const value = career[key];
            if (!value || typeof value !== "string") return null;
            return <Field key={key} label={label} icon={icon} value={value} />;
          })}
        </div>
        {diveText && (
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">More detail</p>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{diveText}</p>
          </div>
        )}
        {bulletsText && (
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Resume bullets</p>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{bulletsText}</p>
          </div>
        )}
        {interviewText && (
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Interview questions</p>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{interviewText}</p>
          </div>
        )}
        {hasActions && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-subtle)]">
            {actions.savedId && actions.onRemove ? (
              <button
                type="button"
                onClick={() => actions.onRemove!(actions.savedId!)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            ) : actions.onSave ? (
              <button
                type="button"
                onClick={actions.onSave}
                disabled={actions.saving}
                className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-50"
              >
                {actions.saving ? "Saving…" : "Save"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleDiveDeeper}
              disabled={diveLoading}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-50"
            >
              {diveLoading ? "Loading…" : diveText ? "Hide detail" : "Learn more"}
            </button>
            <button
              type="button"
              onClick={handleResumeBullets}
              disabled={bulletsLoading}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-50"
            >
              {bulletsLoading ? "Loading…" : bulletsText ? "Hide bullets" : "Resume bullets"}
            </button>
            <button
              type="button"
              onClick={handleInterviewQuestions}
              disabled={interviewLoading}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-50"
            >
              {interviewLoading ? "Loading…" : interviewText ? "Hide interview Qs" : "Interview Qs"}
            </button>
            <button type="button" onClick={handleCopy} className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]">
              Copy
            </button>
            <button type="button" onClick={handleDownload} className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]">
              Download
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
