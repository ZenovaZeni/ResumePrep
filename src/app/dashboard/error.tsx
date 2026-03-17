"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="rounded-[var(--radius-lg)] bg-red-500/10 border border-red-500/30 p-6 max-w-xl">
      <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">Something went wrong</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        We couldn’t load this page. You can try again or go back to the dashboard.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-primary py-2 px-4 text-sm"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="py-2 px-4 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
