"use client";

import { useState, useEffect } from "react";

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
}

export function ApplicationActions({
  applicationId,
  companyName,
  jobTitle,
  jobDescription,
  resumes,
}: ApplicationActionsProps) {
  const [atsScore, setAtsScore] = useState<{ score: number; feedback: string[] } | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id ?? "");
  const [tailoring, setTailoring] = useState(false);
  const [tailoredId, setTailoredId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterHighlight, setCoverLetterHighlight] = useState("");

  useEffect(() => {
    if (typeof window === "undefined" || resumes.length === 0) return;
    const stored = localStorage.getItem(LAST_USED_RESUME_KEY);
    if (stored && resumes.some((r) => r.id === stored)) {
      setSelectedResumeId(stored);
    }
  }, [resumes]);

  function saveLastUsedResume(id: string) {
    if (typeof window !== "undefined") localStorage.setItem(LAST_USED_RESUME_KEY, id);
  }

  async function handleATSScore() {
    if (!selectedResumeId) return;
    setAtsLoading(true);
    setAtsScore(null);
    try {
      const res = await fetch("/api/resumes/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          job_description: jobDescription || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) setAtsScore({ score: data.score, feedback: data.feedback ?? [] });
    } finally {
      setAtsLoading(false);
    }
  }

  async function handleTailor() {
    if (!selectedResumeId || !jobDescription) return;
    setTailoring(true);
    setTailoredId(null);
    setAtsScore(null);
    try {
      const res = await fetch("/api/resumes/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          job_description: jobDescription,
          application_id: applicationId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.variantId) {
        setTailoredId(data.variantId);
        saveLastUsedResume(selectedResumeId);
      }
    } finally {
      setTailoring(false);
    }
  }

  async function handleTailorAndScore() {
    if (!selectedResumeId || !jobDescription) return;
    setTailoring(true);
    setTailoredId(null);
    setAtsScore(null);
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
        saveLastUsedResume(selectedResumeId);
      }
    } finally {
      setTailoring(false);
    }
  }

  async function handleCoverLetter() {
    setCoverLetterLoading(true);
    setCoverLetter(null);
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
        saveLastUsedResume(selectedResumeId);
      }
    } finally {
      setCoverLetterLoading(false);
    }
  }

  function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

return (
    <div className="space-y-4">
      {resumes.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1.5">Choose a resume</label>
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleATSScore}
          disabled={atsLoading || !selectedResumeId}
          className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)] disabled:opacity-50 transition-colors"
        >
          {atsLoading ? "Scoring…" : "Get ATS score"}
        </button>
        <button
          type="button"
          onClick={handleTailorAndScore}
          disabled={tailoring || !selectedResumeId || !jobDescription}
          className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {tailoring ? "Tailoring…" : "Tailor + ATS score"}
        </button>
        <button
          type="button"
          onClick={handleTailor}
          disabled={tailoring || !selectedResumeId || !jobDescription}
          className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)] disabled:opacity-50 transition-colors"
        >
          Tailor only
        </button>
        <button
          type="button"
          onClick={handleCoverLetter}
          disabled={coverLetterLoading || !jobDescription}
          className="btn-primary px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          {coverLetterLoading ? "Generating…" : "Generate cover letter"}
        </button>
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1">Anything to highlight? (optional)</label>
        <input
          type="text"
          value={coverLetterHighlight}
          onChange={(e) => setCoverLetterHighlight(e.target.value)}
          placeholder="e.g. Recent certification, relocation, passion for X"
          className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>
      {atsScore && (
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
          <p className="text-[var(--text-primary)] font-medium">ATS score: {atsScore.score}/100</p>
          {atsScore.feedback.length > 0 && (
            <ul className="mt-2 text-sm text-[var(--text-secondary)] list-disc list-inside space-y-1">
              {atsScore.feedback.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {tailoredId && (
        <p className="text-sm text-emerald-400">
          ✓ Tailored version saved. Export it from the resume’s Versions or Export page.
        </p>
      )}
      {coverLetter && (
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] max-h-64 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-[var(--text-tertiary)]">Your cover letter</p>
            <button
              type="button"
              onClick={() => copyToClipboard(coverLetter)}
              className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Copy to clipboard
            </button>
          </div>
          <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-sans">
            {coverLetter}
          </pre>
        </div>
      )}
    </div>
  );
}
