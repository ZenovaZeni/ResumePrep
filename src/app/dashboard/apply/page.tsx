import { Suspense } from "react";
import { ApplyFlow } from "./ApplyFlow";

function ApplyFormFallback() {
  return (
    <div className="animate-pulse space-y-4 max-w-2xl">
      <div className="h-40 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 rounded-lg bg-[var(--bg-elevated)]" />
        <div className="h-10 rounded-lg bg-[var(--bg-elevated)]" />
      </div>
      <div className="h-12 w-64 rounded-lg bg-[var(--bg-elevated)]" />
    </div>
  );
}

export default function ApplyPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">
        Quick apply
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Paste a job description to get a tailored resume and cover letter in one step. Download or copy, then save to your applications if you like.
      </p>
      <Suspense fallback={<ApplyFormFallback />}>
        <ApplyFlow />
      </Suspense>
    </div>
  );
}
