"use client";

import Link from "next/link";

const PRO_FEATURES = [
  "Unlimited application kits",
  "All 5 premium resume templates",
  "Voice mock interview coach",
  "Unlimited career saves & roadmaps",
  "Priority AI — faster responses",
  "Public resume (no branding)",
];

interface UpgradeCardProps {
  reason?: string;
  compact?: boolean;
}

export function UpgradeCard({ reason, compact = false }: UpgradeCardProps) {
  if (compact) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/5 border border-[var(--accent)]/30 p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              {reason ?? "This is a Pro feature"}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Upgrade for $15/month — or $99/year (save 45%).
            </p>
            <Link
              href="/dashboard/upgrade"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
            >
              Upgrade to Pro
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover,var(--accent))] p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Upgrade to</p>
            <p className="text-xl font-bold">Pro</p>
          </div>
        </div>
        <p className="text-white/80 text-sm leading-relaxed">
          {reason ?? "Unlock the full platform and supercharge your job search."}
        </p>
      </div>

      {/* Pricing */}
      <div className="p-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold text-[var(--text-primary)]">$8</span>
              <span className="text-[var(--text-secondary)] text-sm mb-1">/month</span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">Billed as $99/year</p>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
              Save 45%
            </span>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">vs. $15/mo monthly</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="p-5">
        <ul className="space-y-2.5 mb-5">
          {PRO_FEATURES.map((f) => (
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
          Upgrade now — from $99/year
        </Link>
        <p className="text-center text-xs text-[var(--text-tertiary)] mt-2.5">Cancel anytime · 30-day money-back</p>
      </div>
    </div>
  );
}
