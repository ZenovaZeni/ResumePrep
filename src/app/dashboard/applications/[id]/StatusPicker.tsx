"use client";

import { useState } from "react";

type ApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "final_interview"
  | "offer"
  | "rejected";

const PIPELINE: { value: ApplicationStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "final_interview", label: "Final round" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

function getColor(status: ApplicationStatus, selected: boolean) {
  if (!selected) return "bg-[var(--bg-glass)] text-[var(--text-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]";
  if (status === "offer") return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
  if (status === "rejected") return "bg-red-500/20 text-red-400 border border-red-500/40";
  if (status === "interview" || status === "final_interview") return "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40";
  return "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]";
}

export function StatusPicker({
  applicationId,
  initialStatus,
}: {
  applicationId: string;
  initialStatus: ApplicationStatus;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [saving, setSaving] = useState(false);

  async function handleSelect(next: ApplicationStatus) {
    if (next === status || saving) return;
    setSaving(true);
    const prev = status;
    setStatus(next);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) setStatus(prev);
    } catch {
      setStatus(prev);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
        Status
        {saving && <span className="ml-2 normal-case tracking-normal font-normal opacity-60">Saving…</span>}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PIPELINE.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => handleSelect(s.value)}
            disabled={saving}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation ${getColor(s.value, status === s.value)}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
