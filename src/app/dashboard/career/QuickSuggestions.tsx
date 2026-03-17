"use client";

import { useState } from "react";
import { CareerCard } from "./CareerCard";
import type { CareerSuggestionItem } from "@/types/career";
import type { CareerCardActions } from "./CareerCard";
import { AuthToast } from "@/components/AuthToast";

export function QuickSuggestions({ onSaved }: { onSaved?: () => void }) {
  const [targetRole, setTargetRole] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingTitle, setSavingTitle] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);
  const [suggestions, setSuggestions] = useState<CareerSuggestionItem[]>([]);
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const role = targetRole.trim();
    if (!role) return;
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const res = await fetch("/api/career/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_role: role, context: context.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (data.type === "career_suggestions" && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(career: CareerSuggestionItem) {
    setSaveError(null);
    setSavingTitle(career.title);
    try {
      const res = await fetch("/api/career/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(career),
      });
      if (res.ok) {
        setSavedTitles((prev) => new Set(prev).add(career.title));
        onSaved?.();
        setToast({ kind: "success", message: `Saved: ${career.title}` });
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? "Failed to save career. Please try again.");
        setToast({ kind: "error", message: data.error ?? "Failed to save career" });
      }
    } catch {
      setSaveError("Could not reach the server. Please try again.");
      setToast({ kind: "error", message: "Could not reach the server" });
    } finally {
      setSavingTitle(null);
    }
  }

  const actions: CareerCardActions = {
    onSave: undefined,
    onCopy: () => {},
    onDownload: () => {},
  };

  return (
    <div className="space-y-6">
      {toast && (
        <AuthToast
          kind={toast.kind}
          message={toast.message}
          onDismiss={() => setToast(null)}
          autoHideMs={3500}
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label htmlFor="quick-role" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Job or career you’re curious about
          </label>
          <input
            id="quick-role"
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Data Scientist, Product Manager"
            required
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label htmlFor="quick-context" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Any context (optional)
          </label>
          <textarea
            id="quick-context"
            rows={2}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. I have 2 years in marketing, interested in switching to tech"
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50">
          {loading ? "Getting suggestions…" : "Get suggestions"}
        </button>
      </form>
      {suggestions.length > 0 && (
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-3">Save any career to your list, or copy / download to share or keep.</p>
          {saveError && <p className="text-xs text-red-400 mb-3">{saveError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {suggestions.map((c, i) => (
              <CareerCard
                key={i}
                career={c}
                actions={{
                  ...actions,
                  onSave: savedTitles.has(c.title) ? undefined : () => handleSave(c),
                  saving: savingTitle === c.title,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
