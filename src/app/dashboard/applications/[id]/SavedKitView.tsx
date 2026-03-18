"use client";

import { useState } from "react";
import Link from "next/link";
import { KitWorkspace } from "@/app/dashboard/apply/KitWorkspace";
import type { KitData } from "@/app/dashboard/apply/KitWorkspace";
import type { ApplicationStatus } from "@/types/database";
import { ApplicationStatusBadge } from "../ApplicationStatusBadge";

interface SavedKitViewProps {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string | null;
  jobUrl: string | null;
  status: ApplicationStatus;
  dateApplied: string | null;
  createdAt: string;
  kit: KitData;
}

export function SavedKitView({
  applicationId,
  jobTitle,
  companyName,
  jobDescription,
  jobUrl,
  status,
  dateApplied,
  createdAt,
  kit,
}: SavedKitViewProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [statusSaving, setStatusSaving] = useState(false);

  async function handleStatusChange(newStatus: ApplicationStatus) {
    setCurrentStatus(newStatus);
    setStatusSaving(true);
    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } finally {
      setStatusSaving(false);
    }
  }

  const dateLabel = dateApplied
    ? new Date(dateApplied).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const createdLabel = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const STATUS_OPTIONS: ApplicationStatus[] = [
    "saved", "applied", "interview", "final_interview", "rejected", "offer",
  ];

  return (
    <div>
      {/* Back */}
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All applications
      </Link>

      {/* Job header */}
      <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5 mb-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
              {jobTitle}
            </h1>
            <p className="text-[var(--text-secondary)] mt-0.5 text-sm sm:text-base">{companyName}</p>
          </div>
          <Link
            href={`/dashboard/applications/${applicationId}/edit`}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </Link>
        </div>

        {/* Status picker */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStatusChange(s)}
              disabled={statusSaving}
              className={`transition-all disabled:opacity-50 ${
                currentStatus === s
                  ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-elevated)] rounded-full"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <ApplicationStatusBadge status={s} />
            </button>
          ))}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--text-tertiary)]">
          <span>Added {createdLabel}</span>
          {dateLabel && <span>Applied {dateLabel}</span>}
          {jobUrl && (
            <a
              href={jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
            >
              View job posting →
            </a>
          )}
        </div>
      </div>

      {/* Full kit workspace */}
      <KitWorkspace
        kit={kit}
        jobTitle={jobTitle}
        companyName={companyName}
        jobDescription={jobDescription ?? ""}
        isSavedMode={true}
      />
    </div>
  );
}
