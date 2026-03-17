"use client";

import type { ApplicationStatus } from "@/types/database";

const LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  final_interview: "Final Interview",
  rejected: "Rejected",
  offer: "Offer",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const label = LABELS[status] ?? status;
  const color =
    status === "offer"
      ? "bg-emerald-500/20 text-emerald-400"
      : status === "rejected"
        ? "bg-red-500/20 text-red-400"
        : status === "interview" || status === "final_interview"
          ? "bg-[var(--accent)]/20 text-[var(--accent)]"
          : "bg-[var(--bg-glass)] text-[var(--text-secondary)]";
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}
