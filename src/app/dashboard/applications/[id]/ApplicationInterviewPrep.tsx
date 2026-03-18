"use client";

import { useState } from "react";
import Link from "next/link";

interface PrepData {
  questions: string[];
  brief: string;
  modelAnswers: string[];
}

interface ApplicationInterviewPrepProps {
  applicationId: string;
  companyName: string;
  jobTitle: string;
  initialPrep?: PrepData | null;
}

function QACard({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(`Q: ${question}\n\nA: ${answer}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-[var(--bg-glass)] transition-colors"
      >
        <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-xs font-bold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        <span className="flex-1 text-sm font-medium text-[var(--text-primary)] leading-snug">{question}</span>
        <svg
          className={`w-4 h-4 shrink-0 text-[var(--text-tertiary)] transition-transform mt-0.5 ${open ? "rotate-180" : ""}`}
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mt-3 mb-2">
            Suggested answer
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{answer}</p>
          <button
            type="button"
            onClick={copy}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            {copied ? (
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
                Copy Q&amp;A
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function ApplicationInterviewPrep({
  applicationId,
  companyName,
  jobTitle,
  initialPrep,
}: ApplicationInterviewPrepProps) {
  const [prepLoading, setPrepLoading] = useState(false);
  const [prep, setPrep] = useState<PrepData | null>(initialPrep ?? null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUp, setFollowUp] = useState<{
    thankYouEmail: string;
    followUpLines: string;
  } | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  async function handlePrep() {
    setPrepLoading(true);
    setPrep(null);
    try {
      const res = await fetch("/api/interview/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: applicationId }),
      });
      const data = await res.json();
      if (res.ok)
        setPrep({
          questions: data.questions ?? [],
          brief: data.brief ?? "",
          modelAnswers: data.modelAnswers ?? [],
        });
    } finally {
      setPrepLoading(false);
    }
  }

  async function handleFollowUp() {
    setFollowUpLoading(true);
    setFollowUp(null);
    try {
      const res = await fetch("/api/interview/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          job_title: jobTitle,
          interview_notes: followUpNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok)
        setFollowUp({
          thankYouEmail: data.thankYouEmail ?? "",
          followUpLines: data.followUpLines ?? "",
        });
    } finally {
      setFollowUpLoading(false);
    }
  }

  function copyEmail() {
    if (!followUp?.thankYouEmail) return;
    navigator.clipboard.writeText(followUp.thankYouEmail);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Interview prep */}
      <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Interview prep</h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Likely questions and model answers for this role
            </p>
          </div>
          {!prep && (
            <button
              type="button"
              onClick={handlePrep}
              disabled={prepLoading}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {prepLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                "Prep me"
              )}
            </button>
          )}
        </div>

        {prep ? (
          <div className="p-5 space-y-4">
            {prep.brief && (
              <div className="rounded-lg bg-[var(--accent)]/8 border border-[var(--accent)]/20 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
                  Brief
                </p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{prep.brief}</p>
              </div>
            )}

            {prep.questions.length > 0 && (
              <div className="space-y-2">
                {prep.questions.map((q, i) => (
                  <QACard
                    key={i}
                    question={q}
                    answer={prep.modelAnswers[i] ?? "Practice answering this in your own words using your actual experience."}
                    index={i}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <Link
                href="/dashboard/interview"
                className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                Practice with mock interview →
              </Link>
              <button
                type="button"
                onClick={handlePrep}
                disabled={prepLoading}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {prepLoading ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
          </div>
        ) : !prepLoading ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-[var(--text-tertiary)] mb-3">
              Get questions tailored to this exact role and company.
            </p>
            <button
              type="button"
              onClick={handlePrep}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-all"
            >
              Generate interview prep
            </button>
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <svg className="w-6 h-6 animate-spin text-[var(--accent)] mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-[var(--text-tertiary)]">Generating prep…</p>
          </div>
        )}
      </div>

      {/* Post-interview follow-up */}
      <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFollowUp((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Post-interview follow-up</h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Generate a thank-you email after the interview</p>
          </div>
          <svg
            className={`w-4 h-4 shrink-0 text-[var(--text-tertiary)] transition-transform ${showFollowUp ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showFollowUp && (
          <div className="px-5 pb-5 border-t border-[var(--border-subtle)] pt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5">
                Interview notes <span className="font-normal opacity-60">(optional)</span>
              </label>
              <textarea
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="Topics discussed, interviewer names, anything you want to reference…"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <button
              type="button"
              onClick={handleFollowUp}
              disabled={followUpLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {followUpLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Writing…
                </>
              ) : (
                "Get thank-you email"
              )}
            </button>

            {followUp && (
              <div className="rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Thank-you email
                  </p>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    {emailCopied ? (
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
                <div className="px-4 py-3 max-h-56 overflow-y-auto">
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                    {followUp.thankYouEmail}
                  </p>
                </div>
                {followUp.followUpLines && (
                  <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                      Follow-up lines
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">{followUp.followUpLines}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
