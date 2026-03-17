"use client";

import { useState } from "react";
import Link from "next/link";

interface ApplicationInterviewPrepProps {
  applicationId: string;
  companyName: string;
  jobTitle: string;
}

export function ApplicationInterviewPrep({
  applicationId,
  companyName,
  jobTitle,
}: ApplicationInterviewPrepProps) {
  const [prepLoading, setPrepLoading] = useState(false);
  const [prep, setPrep] = useState<{
    questions: string[];
    brief: string;
    modelAnswers: string[];
  } | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUp, setFollowUp] = useState<{
    thankYouEmail: string;
    followUpLines: string;
  } | null>(null);
  const [copyDone, setCopyDone] = useState(false);

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

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
        <h2 className="text-sm font-medium text-[var(--text-primary)] mb-1">Prep for interview</h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          Get likely questions, a short brief, and model answers based on this job and your profile.
        </p>
        <button
          type="button"
          onClick={handlePrep}
          disabled={prepLoading}
          className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {prepLoading ? "Generating…" : "Prep me for this job"}
        </button>
        {prep && (
          <div className="mt-4 space-y-4">
            {prep.brief && (
              <div>
                <h3 className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Brief</h3>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{prep.brief}</p>
              </div>
            )}
            {prep.questions.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-[var(--text-tertiary)] mb-2">Likely questions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--text-primary)]">
                  {prep.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ol>
              </div>
            )}
            {prep.modelAnswers.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-[var(--text-tertiary)] mb-2">Suggested answers</h3>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  {prep.modelAnswers.map((a, i) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              href="/dashboard/interview"
              className="inline-block text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Practice with mock interview →
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
        <h2 className="text-sm font-medium text-[var(--text-primary)] mb-1">Post-interview: thank-you email</h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-3">
          I had an interview. Generate a thank-you email and follow-up lines.
        </p>
        <textarea
          value={followUpNotes}
          onChange={(e) => setFollowUpNotes(e.target.value)}
          placeholder="Optional: notes from the interview (topics discussed, names, etc.)"
          rows={2}
          className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm mb-3"
        />
        <button
          type="button"
          onClick={handleFollowUp}
          disabled={followUpLoading}
          className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {followUpLoading ? "Generating…" : "Get thank-you email"}
        </button>
        {followUp && (
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium text-[var(--text-tertiary)]">Thank-you email</h3>
                <button
                  type="button"
                  onClick={() => copyText(followUp.thankYouEmail)}
                  className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                >
                  {copyDone ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-sans p-3 rounded-lg bg-[var(--bg-tertiary)] max-h-48 overflow-auto">
                {followUp.thankYouEmail}
              </pre>
            </div>
            {followUp.followUpLines && (
              <div>
                <h3 className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Follow-up lines</h3>
                <p className="text-sm text-[var(--text-primary)]">{followUp.followUpLines}</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
