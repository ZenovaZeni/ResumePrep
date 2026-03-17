"use client";

import { useState } from "react";

interface AppOption {
  id: string;
  job_title: string;
  company_name: string;
}

export function CareerGapAnalysis({ applications }: { applications: AppOption[] }) {
  const [mode, setMode] = useState<"paste" | "saved">("paste");
  const [jobDescription, setJobDescription] = useState("");
  const [applicationId, setApplicationId] = useState(applications[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    strengths: string[];
    gaps: string[];
    suggestions: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body =
        mode === "saved" && applicationId
          ? { application_id: applicationId }
          : { job_description: jobDescription.trim() };
      if (mode === "paste" && !jobDescription.trim()) {
        setError("Paste a job description or select a saved job.");
        setLoading(false);
        return;
      }
      if (mode === "saved" && !applicationId) {
        setError("Select an application.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/career/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to run gap analysis");
        return;
      }
      setResult({
        strengths: data.strengths ?? [],
        gaps: data.gaps ?? [],
        suggestions: data.suggestions ?? [],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
      <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">Gap analysis</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Compare your profile to a job. See what fits, what’s missing, and what to add to be a strong fit.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 mb-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="radio"
              name="gapMode"
              checked={mode === "paste"}
              onChange={() => setMode("paste")}
              className="rounded border-[var(--border-default)] text-[var(--accent)]"
            />
            Paste job
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="radio"
              name="gapMode"
              checked={mode === "saved"}
              onChange={() => setMode("saved")}
              className="rounded border-[var(--border-default)] text-[var(--accent)]"
            />
            Saved job
          </label>
        </div>
        {mode === "paste" ? (
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description here..."
            rows={4}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm"
          />
        ) : (
          <select
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            className="w-full max-w-md px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm"
          >
            <option value="">Select an application</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.job_title} at {app.company_name}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Run gap analysis"}
        </button>
      </form>
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      {result && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
            <h3 className="text-sm font-medium text-emerald-400 mb-2">Strengths</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1 list-disc list-inside">
              {result.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
              {result.strengths.length === 0 && <li>—</li>}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
            <h3 className="text-sm font-medium text-amber-400 mb-2">Gaps</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1 list-disc list-inside">
              {result.gaps.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
              {result.gaps.length === 0 && <li>—</li>}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
            <h3 className="text-sm font-medium text-[var(--accent)] mb-2">Suggestions</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1 list-disc list-inside">
              {result.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
              {result.suggestions.length === 0 && <li>—</li>}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
