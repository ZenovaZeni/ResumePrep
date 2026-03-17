"use client";

import { useState } from "react";

export function CareerAdvisor() {
  const [targetRole, setTargetRole] = useState("");
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setContent(null);
    try {
      const res = await fetch("/api/career/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_role: targetRole || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setContent(data.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSubmit} className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          What role are you aiming for? (optional)
        </label>
        <p className="text-xs text-[var(--text-tertiary)] mb-3">
          Leave blank for general advice, or enter a target role for tailored suggestions.
        </p>
        <input
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Senior Data Scientist, Product Manager"
          className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] mb-4"
        />
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-6 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Getting suggestions…" : "Get AI career suggestions"}
        </button>
      </form>
      {content && (
        <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-medium text-[var(--text-primary)] mb-3">Your suggestions</h2>
          <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-sans">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
