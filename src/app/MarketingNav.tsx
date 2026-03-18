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
          <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Pricing
          </a>
          <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary py-2 px-4 text-sm">
            Get started free
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
          className={`absolute top-0 right-0 bottom-0 z-10 w-[min(300px,85vw)] shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            backgroundColor: "#0a0a0b",
            borderLeft: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between h-16 px-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
            <span className="text-base font-bold text-white tracking-tight">Smart Resume</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 -mr-2 rounded-lg touch-manipulation"
              style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.08)" }}
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col py-3">
            {[
              { href: "#how-it-works", label: "How it works" },
              { href: "#features", label: "Features" },
              { href: "#pricing", label: "Pricing" },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-4 text-base font-semibold transition-colors"
                style={{ color: "#ffffff" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="mt-auto px-5 pb-8 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: "1.25rem" }}>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full py-3.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ color: "#ffffff", backgroundColor: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#6366f1" }}
            >
              Get started free
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
