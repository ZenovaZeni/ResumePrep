"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const FREE_FEATURES = [
  { label: "3 application kits / month", included: true },
  { label: "AI resume builder", included: true },
  { label: "ATS score & tailoring", included: true },
  { label: "Cover letter generator", included: true },
  { label: "Application tracker", included: true },
  { label: "Interview prep (per application)", included: true },
  { label: "2 resume templates", included: true },
  { label: "Career explorer (3 saves)", included: true },
  { label: "Unlimited kits", included: false },
  { label: "Voice mock interview coach", included: false },
  { label: "All 5 premium templates", included: false },
  { label: "Unlimited career saves", included: false },
];

const PRO_FEATURES = [
  { label: "Unlimited application kits", highlight: true },
  { label: "Everything in Free", highlight: false },
  { label: "Voice mock interview coach", highlight: true },
  { label: "All 5 premium resume templates", highlight: false },
  { label: "Unlimited career saves & roadmaps", highlight: false },
  { label: "Resume comparison (base vs. tailored)", highlight: false },
  { label: "Public resume (no branding)", highlight: false },
  { label: "Priority AI — faster responses", highlight: false },
  { label: "30-day money-back guarantee", highlight: false },
];

function UpgradeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const cancelled = searchParams.get("cancelled") === "1";
  const [yearly, setYearly] = useState(true);

  useEffect(() => {
    if (success) {
      window.scrollTo(0, 0);
    }
  }, [success]);

  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">Welcome to Pro!</h1>
        <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
          Your account has been upgraded. All Pro features are now active — unlimited kits, voice interview practice, all templates, and more.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard/apply"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
          >
            Generate unlimited kits →
          </Link>
          <Link
            href="/dashboard/interview"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold hover:border-[var(--border-default)] transition-colors"
          >
            Try interview coach →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {cancelled && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-sm text-amber-300">
          No worries — your free plan is still active. Upgrade any time when you&apos;re ready.
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full px-3 py-1.5 mb-5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Upgrade to Pro
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
          Unlock your full job search potential
        </h1>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed mb-8">
          Unlimited kits. Voice interview practice. All premium templates. Everything you need to move faster and land better.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-2 p-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !yearly
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              yearly
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Yearly
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${yearly ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400"}`}>
              Save 45%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Free */}
        <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Your current plan</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">Free</p>
          <p className="text-sm text-[var(--text-tertiary)] mb-6">$0 forever · No credit card</p>
          <ul className="space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 text-sm">
                {f.included ? (
                  <svg className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[var(--text-tertiary)]/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={f.included ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]/50 line-through"}>
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl bg-[var(--accent)] p-6 flex flex-col overflow-hidden shadow-2xl shadow-[var(--accent)]/25">
          <div className="absolute top-4 right-4">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white rounded-full px-3 py-1">
              Recommended
            </span>
          </div>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Pro</p>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-bold text-white">
              {yearly ? "$8" : "$15"}
            </span>
            <span className="text-white/70 text-sm mb-1.5">/month</span>
          </div>
          {yearly ? (
            <p className="text-sm text-white/70 mb-6">Billed as $99/year · Save 45% · Cancel anytime</p>
          ) : (
            <p className="text-sm text-white/70 mb-6">Billed monthly · Or save 45% with yearly</p>
          )}
          <ul className="space-y-3 mb-6 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 text-sm">
                <svg
                  className={`w-4 h-4 shrink-0 ${f.highlight ? "text-white" : "text-white/70"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className={f.highlight ? "text-white font-medium" : "text-white/80"}>{f.label}</span>
              </li>
            ))}
          </ul>
          <CheckoutButton
            plan={yearly ? "yearly" : "monthly"}
            className="block w-full bg-white text-[var(--accent)] font-bold text-sm py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg text-center"
          >
            Upgrade to Pro — {yearly ? "$99/year" : "$15/month"}
          </CheckoutButton>
          <p className="text-center text-xs text-white/60 mt-3">
            Secure checkout · Cancel anytime · 30-day money-back
          </p>
        </div>
      </div>

      {/* Why upgrade */}
      <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6 mb-8">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-5">Why active job seekers upgrade</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              title: "Stop hitting limits",
              body: "3 kits/month runs out fast when you're actively applying. Pro gives you unlimited — apply to as many roles as you need.",
              icon: "M13 10V3L4 14h7v7l9-11h-7z",
            },
            {
              title: "Stand out in interviews",
              body: "The voice mock interview coach reads questions aloud and evaluates your answers. Walk in prepared for every question they ask.",
              icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
            },
            {
              title: "Pays for itself",
              body: "The average salary uplift from a better job is $10k–$25k. Pro costs $99/year. The ROI is not a close call.",
              icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{item.title}</p>
                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-[var(--text-tertiary)]">
        Secure payments by{" "}
        <span className="font-semibold text-[var(--text-secondary)]">Stripe</span>
        {" · "}
        <Link href="/dashboard/settings" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
          Go to billing settings →
        </Link>
      </p>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto py-16 text-center text-[var(--text-secondary)]">Loading…</div>}>
      <UpgradeContent />
    </Suspense>
  );
}
