import type { Tier } from "@/types/database";

export function BillingSection({ tier }: { tier: Tier }) {
  const isPro = tier === "pro";

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-primary)]">
        Current plan: <span className="font-medium">{isPro ? "Pro" : "Free"}</span>
      </p>
      {!isPro && (
        <div className="rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] p-4">
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            Upgrade to Pro to unlock the mock interview coach and get more cover letters per month.
          </p>
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)]/20 text-[var(--accent)] text-sm font-medium cursor-not-allowed"
          >
            Upgrade to Pro (coming soon)
          </button>
        </div>
      )}
    </div>
  );
}
