"use client";

import { useState } from "react";
import { roadmapToText, type RoadmapStep } from "@/lib/roadmap-format";
import { AuthToast } from "@/components/AuthToast";
import { SavedRoadmaps } from "./SavedRoadmaps";

type Toast = { kind: "success" | "error" | "info"; message: string };

export function CareerRoadmap() {
  const [targetRole, setTargetRole] = useState("");
  const [timelineYears, setTimelineYears] = useState<string>("3");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<RoadmapStep[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedForCurrent, setSavedForCurrent] = useState(false);
  const [savedRefreshKey, setSavedRefreshKey] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetRole.trim()) return;
    setLoading(true);
    setError(null);
    setSteps(null);
    setSavedForCurrent(false);
    try {
      const res = await fetch("/api/career/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_role: targetRole.trim(),
          timeline_years: timelineYears ? parseInt(timelineYears, 10) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate roadmap");
        return;
      }
      setSteps(data.steps ?? []);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function getText() {
    if (!steps) return "";
    return roadmapToText({
      title: targetRole.trim(),
      timelineYears: timelineYears ? parseInt(timelineYears, 10) : null,
      steps,
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(getText());
    setToast({ kind: "success", message: "Copied to clipboard" });
  }

  function handleDownload() {
    const text = getText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${targetRole.trim().replace(/[^a-z0-9]/gi, "-").toLowerCase()}-roadmap.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleEmail() {
    const text = getText();
    const subject = encodeURIComponent(`My Career Roadmap: ${targetRole.trim()}`);
    const body = encodeURIComponent(text);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  }

  async function handleSave() {
    if (!steps || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/career/roadmap/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: targetRole.trim(),
          timeline_years: timelineYears ? parseInt(timelineYears, 10) : null,
          steps,
        }),
      });
      if (res.ok) {
        setSavedForCurrent(true);
        setSavedRefreshKey((k) => k + 1);
        setToast({ kind: "success", message: `Roadmap saved: ${targetRole.trim()}` });
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({ kind: "error", message: data.error ?? "Failed to save roadmap" });
      }
    } catch {
      setToast({ kind: "error", message: "Could not reach the server" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6 space-y-6">
      {toast && (
        <AuthToast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} autoHideMs={3500} />
      )}

      <div>
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">Roadmap to a role</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Enter a target role and timeline. We'll suggest steps (skills, certs, projects) and how to reflect each on your resume.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1">Target role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Product Manager"
              className="w-56 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1">Timeline (years)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={timelineYears}
              onChange={(e) => setTimelineYears(e.target.value)}
              className="w-20 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !targetRole.trim()}
            className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate roadmap"}
          </button>
        </form>
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      </div>

      {steps && steps.length > 0 && (
        <div className="space-y-4">
          {/* Export/save action row */}
          <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || savedForCurrent}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : savedForCurrent ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Download
            </button>
            <button
              type="button"
              onClick={handleEmail}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Email
            </button>
          </div>

          {/* Steps list */}
          <ul className="space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-medium text-[var(--text-primary)]">
                    {i + 1}. {s.title}
                  </span>
                  {s.timeline && (
                    <span className="text-xs text-[var(--text-tertiary)]">{s.timeline}</span>
                  )}
                </div>
                {s.description && <p className="text-sm text-[var(--text-secondary)] mb-2">{s.description}</p>}
                {s.resumeTip && (
                  <p className="text-xs text-[var(--text-tertiary)]">
                    <strong>Resume tip:</strong> {s.resumeTip}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Saved roadmaps section */}
      <div>
        <h3 className="text-base font-medium text-[var(--text-primary)] mb-1">Saved roadmaps</h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-3">
          Roadmaps you've saved. View steps, copy, download, email, or remove.
        </p>
        <SavedRoadmaps refreshKey={savedRefreshKey} />
      </div>
    </section>
  );
}
