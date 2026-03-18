import Link from "next/link";
import { ManageBillingButton } from "@/components/ManageBillingButton";
import type { Tier } from "@/types/database";

export function BillingSection({ tier }: { tier: Tier }) {
  const isPro = tier === "pro";

  if (isPro) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Pro plan — active</p>
            <p className="text-xs text-[var(--text-secondary)]">All features unlocked. Thank you for supporting the platform.</p>
          </div>
        </div>
        <ManageBillingButton />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Free plan</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">3 kits/month · 2 templates · Limited features</p>
        </div>
        <span className="text-xs font-medium text-[var(--text-tertiary)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1">
          $0/mo
        </span>
      </div>

      {/* Upgrade card */}
      <div className="rounded-2xl overflow-hidden border border-[var(--accent)]/30">
        <div className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent)] p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Upgrade to Pro</p>
              <div className="flex items-end gap-1.5">
                <span className="text-3xl font-bold">$8</span>
                <span className="text-white/70 text-sm mb-1">/month</span>
              </div>
              <p className="text-xs text-white/60">Billed as $99/year — save 45%</p>
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white rounded-full px-2.5 py-1">
              Best value
            </span>
          </div>
        </div>
        <div className="p-5 bg-[var(--bg-elevated)] space-y-4">
          <ul className="space-y-2.5">
            {[
              "Unlimited application kits",
              "Voice mock interview coach",
              "All 5 premium resume templates",
              "Unlimited career saves & roadmaps",
              "Priority AI · 30-day money-back",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                <svg className="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/upgrade"
            className="block w-full text-center px-5 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[var(--accent)]/20"
          >
            View plans & upgrade →
          </Link>
          <p className="text-center text-xs text-[var(--text-tertiary)]">
            Or pay $15/month · Cancel anytime · Secure via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
