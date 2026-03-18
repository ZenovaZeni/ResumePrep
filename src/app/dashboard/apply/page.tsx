import { Suspense } from "react";
import { ApplyFlow } from "./ApplyFlow";

function ApplyFormFallback() {
  return (
    <div className="animate-pulse space-y-4 max-w-2xl">
      <div className="h-40 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 rounded-lg bg-[var(--bg-elevated)]" />
        <div className="h-10 rounded-lg bg-[var(--bg-elevated)]" />
      </div>
      <div className="h-14 w-56 rounded-xl bg-[var(--bg-elevated)]" />
    </div>
  );
}

export default function ApplyPage() {
  return (
    <div>
      <div className="max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Generate application kit
        </h1>
        <p className="text-[var(--text-secondary)] text-sm sm:text-base mb-8 leading-relaxed">
          Paste a job description. We&apos;ll generate a tailored resume, cover letter, key match highlights, and interview prep — in one step.
        </p>
      </div>
      <Suspense fallback={<ApplyFormFallback />}>
        <ApplyFlow />
      </Suspense>
    </div>
  );
}
