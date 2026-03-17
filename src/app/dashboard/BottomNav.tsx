"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardNav } from "./DashboardNavContext";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/dashboard/apply", label: "Apply", icon: "M12 4v16m8-8H4" },
  { href: "/dashboard/resumes", label: "Resumes", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { href: "/dashboard/applications", label: "Jobs", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { label: "More", icon: "M4 6h16M4 12h16M4 18h16", action: "drawer" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { openDrawer } = useDashboardNav();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-[var(--border-subtle)] safe-area-bottom"
      role="navigation"
      aria-label="Primary"
    >
      <div className="max-w-6xl mx-auto px-2 flex items-center justify-around h-16">
        {ITEMS.map((item) => {
          if (item.action === "drawer") {
            return (
              <button
                key="more"
                type="button"
                onClick={openDrawer}
                className="flex flex-col items-center justify-center flex-1 min-w-0 py-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors touch-manipulation"
              >
                <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </button>
            );
          }
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2 transition-colors touch-manipulation ${
                active ? "text-[var(--accent)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2 : 1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
