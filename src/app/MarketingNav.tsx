"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Smart Resume
        </Link>

        {/* Desktop nav — visible at lg+ */}
        <nav className="hidden lg:flex items-center gap-6">
          <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            How it works
          </a>
          <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Features
          </a>
          <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary py-2 px-4 text-sm">
            Get started
          </Link>
        </nav>

        {/* Compact nav for mid-range (md–lg: 768–1023px) e.g. Fold 7 inner screen */}
        <nav className="hidden md:flex lg:hidden items-center gap-3">
          <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary py-2 px-4 text-sm">
            Get started
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="p-2 rounded-[var(--radius-sm)] text-[var(--text-primary)] hover:bg-[var(--bg-glass)] touch-manipulation"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </nav>

        {/* Mobile hamburger — visible below md */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="md:hidden p-2 -mr-2 rounded-[var(--radius-sm)] text-[var(--text-primary)] hover:bg-[var(--bg-glass)] touch-manipulation"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* Mobile / tablet slide-in drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-[200] transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <aside
          className={`absolute top-0 right-0 bottom-0 z-10 w-[min(300px,85vw)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            backgroundColor: "#18181b",
          }}
        >
          <div className="flex items-center justify-between h-16 px-5 border-b border-[var(--border-subtle)]">
            <span className="text-base font-semibold text-[var(--text-primary)]">Smart Resume</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 -mr-2 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)] touch-manipulation"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col py-4">
            <a
              href="#how-it-works"
              onClick={() => setOpen(false)}
              className="px-5 py-3.5 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-glass)] transition-colors"
            >
              How it works
            </a>
            <a
              href="#features"
              onClick={() => setOpen(false)}
              className="px-5 py-3.5 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-glass)] transition-colors"
            >
              Features
            </a>
          </nav>
          <div className="mt-auto px-5 pb-6 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-4">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="btn-secondary w-full justify-center py-3"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="btn-primary w-full justify-center py-3"
            >
              Get started free
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
