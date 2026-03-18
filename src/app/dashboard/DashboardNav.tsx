"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Tier } from "@/types/database";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/apply", label: "Apply" },
  { href: "/dashboard/applications", label: "Applications" },
  { href: "/dashboard/profile", label: "Profile" },
];

export function DashboardNav({ tier }: { tier?: Tier }) {
  const pathname = usePathname();
  const isPro = tier === "pro";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[var(--text-primary)]"
      >
        Smart Resume
        {isPro && (
          <span className="hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full px-2 py-0.5">
            Pro
          </span>
        )}
      </Link>

      {/* Desktop nav — lg+ only */}
      <nav className="hidden lg:flex items-center gap-1">
        {PRIMARY_NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 text-sm rounded-[var(--radius-sm)] transition-colors ${
              pathname === href
                ? "text-[var(--text-primary)] bg-[var(--bg-glass)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)]"
            }`}
          >
            {label}
          </Link>
        ))}

        {/* Upgrade nudge for free users */}
        {!isPro && (
          <Link
            href="/dashboard/upgrade"
            className="ml-1 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Upgrade
          </Link>
        )}

        <Link
          href="/dashboard/apply"
          className="ml-2 px-3 py-1.5 text-sm font-semibold rounded-[var(--radius-sm)] bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
        >
          Generate kit
        </Link>
        <form action="/api/auth/signout" method="post" className="ml-1">
          <button
            type="submit"
            className="px-3 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-glass)] transition-colors"
          >
            Sign out
          </button>
        </form>
      </nav>
    </div>
  );
}
