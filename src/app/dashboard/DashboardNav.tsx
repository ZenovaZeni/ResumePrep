"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardNav } from "./DashboardNavContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/apply", label: "Apply" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/resumes", label: "Resumes" },
  { href: "/dashboard/applications", label: "Applications" },
  { href: "/dashboard/career", label: "Career" },
  { href: "/dashboard/interview", label: "Interview" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { drawerOpen, openDrawer, closeDrawer } = useDashboardNav();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-[var(--text-primary)]"
          onClick={closeDrawer}
        >
          Smart Resume
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => (
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
          <form action="/api/auth/signout" method="post" className="ml-2">
            <button
              type="submit"
              className="px-3 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-glass)] transition-colors"
            >
              Sign out
            </button>
          </form>
        </nav>

        {/* Mobile: hamburger */}
        <button
          type="button"
          onClick={openDrawer}
          className="md:hidden p-2 -mr-2 rounded-[var(--radius-sm)] text-[var(--text-primary)] hover:bg-[var(--bg-glass)] touch-manipulation"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer — portalled to body so the header's backdrop-filter doesn't trap fixed positioning */}
      {mounted && createPortal(
        <div
          className={`md:hidden fixed inset-0 z-[200] transition-opacity duration-200 ${
            drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
            aria-hidden
          />
          <aside
            className={`absolute top-0 left-0 bottom-0 z-10 w-[min(280px,85vw)] max-w-[280px] border-r border-zinc-700 shadow-2xl transition-transform duration-200 ease-out ${
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
              backgroundColor: "#18181b",
            }}
          >
            <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border-subtle)]">
              <span className="text-lg font-semibold text-[var(--text-primary)]">Menu</span>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-2 -mr-2 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)] touch-manipulation"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="py-4 flex flex-col">
              {NAV_ITEMS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeDrawer}
                  className={`px-4 py-3 text-[var(--text-primary)] text-base font-medium transition-colors ${
                    pathname === href ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "hover:bg-[var(--bg-glass)]"
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    className="w-full text-left px-4 py-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)] text-base font-medium transition-colors"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </nav>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}
