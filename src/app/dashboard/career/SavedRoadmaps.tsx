"use client";

import { useState, useEffect, useCallback } from "react";
import { roadmapToText, type RoadmapStep } from "@/lib/roadmap-format";
import { AuthToast } from "@/components/AuthToast";

type SavedRoadmapRow = {
  id: string;
  title: string;
  timeline_years: number | null;
  roadmap_data: { steps: RoadmapStep[] };
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function RoadmapActions({
  title,
  timelineYears,
  steps,
  savedId,
  onRemoved,
}: {
  title: string;
  timelineYears: number | null;
  steps: RoadmapStep[];
  savedId: string;
  onRemoved: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  function getText() {
    return roadmapToText({ title, timelineYears, steps });
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
    a.download = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-roadmap.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleEmail() {
    const text = getText();
    const subject = encodeURIComponent(`My Career Roadmap: ${title}`);
    const body = encodeURIComponent(text);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch(`/api/career/roadmap/saved/${savedId}`, { method: "DELETE" });
      if (res.ok) {
        onRemoved(savedId);
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({ kind: "error", message: data.error ?? "Failed to remove" });
      }
    } catch {
      setToast({ kind: "error", message: "Could not reach the server" });
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      {toast && (
        <AuthToast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} autoHideMs={3000} />
      )}
      <div className="flex flex-wrap gap-3 mt-3">
        <button type="button" onClick={handleCopy} className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]">
          Copy
        </button>
        <button type="button" onClick={handleDownload} className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]">
          Download
        </button>
        <button type="button" onClick={handleEmail} className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]">
          Email
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          {removing ? "Removing…" : "Remove"}
        </button>
      </div>
    </>
  );
}

function RoadmapCard({ row, onRemoved }: { row: SavedRoadmapRow; onRemoved: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const steps = row.roadmap_data?.steps ?? [];

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{row.title}</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {row.timeline_years ? `${row.timeline_years} yr${row.timeline_years === 1 ? "" : "s"} · ` : ""}
            {steps.length} steps · Saved {formatDate(row.created_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] shrink-0"
        >
          {expanded ? "Hide steps" : "View steps"}
        </button>
      </div>

      {expanded && steps.length > 0 && (
        <ul className="mt-3 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {i + 1}. {s.title}
                </span>
                {s.timeline && (
                  <span className="text-xs text-[var(--text-tertiary)]">{s.timeline}</span>
                )}
              </div>
              {s.description && <p className="text-xs text-[var(--text-secondary)] mb-1">{s.description}</p>}
              {s.resumeTip && (
                <p className="text-xs text-[var(--text-tertiary)]">
                  <strong>Resume tip:</strong> {s.resumeTip}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <RoadmapActions
        title={row.title}
        timelineYears={row.timeline_years}
        steps={steps}
        savedId={row.id}
        onRemoved={onRemoved}
      />
    </div>
  );
}

export function SavedRoadmaps({ refreshKey }: { refreshKey: number }) {
  const [roadmaps, setRoadmaps] = useState<SavedRoadmapRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoadmaps = useCallback(async () => {
    try {
      const res = await fetch("/api/career/roadmap/saved");
      const data = await res.json();
      if (res.ok && Array.isArray(data.roadmaps)) setRoadmaps(data.roadmaps);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRoadmaps();
  }, [fetchRoadmaps, refreshKey]);

  function handleRemoved(id: string) {
    setRoadmaps((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) return <p className="text-sm text-[var(--text-tertiary)]">Loading saved roadmaps…</p>;
  if (roadmaps.length === 0) return <p className="text-sm text-[var(--text-tertiary)]">No saved roadmaps yet. Generate a roadmap above and save it to access it later.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {roadmaps.map((r) => (
        <RoadmapCard key={r.id} row={r} onRemoved={handleRemoved} />
      ))}
    </div>
  );
}
