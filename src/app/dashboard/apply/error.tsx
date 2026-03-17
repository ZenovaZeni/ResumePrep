"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ApplyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Apply page error:", error);
  }, [error]);

  return (
    <div className="rounded-[var(--radius-lg)] bg-red-500/10 border border-red-500/30 p-6 max-w-xl">
      <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">Quick apply couldn’t load</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Something went wrong loading this page. Try again or go back.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="py-2 px-4 text-sm rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-glass)]"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
