"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PRIMARY = [
  {
    href: "/dashboard",
    label: "Home",
    path: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  },
  {
    href: "/dashboard/apply",
    label: "Apply",
    path: "M13 10V3L4 14h7v7l9-11h-7z",
    accent: true,
  },
  {
    href: "/dashboard/applications",
    label: "Jobs",
    path: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    path: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
];

const MORE_ITEMS = [
  {
    href: "/dashboard/resumes",
    label: "Resumes",
    path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    href: "/dashboard/career",
    label: "Career explorer",
    path: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  },
  {
    href: "/dashboard/interview",
    label: "Interview practice",
    path: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    path: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] safe-area-bottom"
        style={{ backgroundColor: "rgba(15,15,18,0.95)", backdropFilter: "blur(16px)" }}
        role="navigation"
        aria-label="Primary"
      >
        <div className="flex items-center h-16 px-1">
          {PRIMARY.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-1 transition-colors touch-manipulation ${
                  item.accent
                    ? active
                      ? "text-[var(--accent)]"
                      : "text-[var(--accent)]/70"
                    : active
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-tertiary)]"
                }`}
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={active ? 2.25 : 1.75}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.path} />
                </svg>
                <span className={`text-[10px] font-medium tracking-wide ${active ? "text-[var(--accent)]" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More — opens bottom sheet */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors touch-manipulation"
            aria-label="More options"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
            <span className="text-[10px] font-medium tracking-wide">More</span>
          </button>
        </div>
      </nav>

      {/* Bottom sheet popup — portalled to body */}
      {mounted &&
        createPortal(
          <div
            className={`lg:hidden fixed inset-0 z-[200] transition-opacity duration-200 ${
              menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />

            {/* Sheet */}
            <div
              className={`absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-[var(--border-subtle)] shadow-2xl transition-transform duration-300 ease-out ${
                menuOpen ? "translate-y-0" : "translate-y-full"
              }`}
              style={{
                backgroundColor: "#111113",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-8 h-1 rounded-full bg-zinc-700" />
              </div>

              {/* Menu items */}
              <nav className="px-4 pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] px-2 pb-2">
                  Tools
                </p>
                {MORE_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "text-[var(--text-primary)] hover:bg-[var(--bg-glass)]"
                    }`}
                  >
                    <svg
                      className="w-5 h-5 shrink-0 text-[var(--text-secondary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.75}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.path} />
                    </svg>
                    {item.label}
                  </Link>
                ))}

                <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                  <form action="/api/auth/signout" method="post">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)] transition-colors"
                    >
                      <svg
                        className="w-5 h-5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.75}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign out
                    </button>
                  </form>
                </div>
              </nav>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
