"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { MarketingNav } from "./MarketingNav";

// ── Animation helpers ───────────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  className?: string;
}) {
  const initial =
    direction === "up"
      ? { opacity: 0, y: 32 }
      : direction === "left"
      ? { opacity: 0, x: -32 }
      : direction === "right"
      ? { opacity: 0, x: 32 }
      : { opacity: 0 };
  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Hero resume card ────────────────────────────────────────────────────────

function HeroResumeCard() {
  return (
    <div className="relative select-none pointer-events-none">
      {/* Glow behind card */}
      <div
        className="absolute inset-0 rounded-3xl blur-3xl animate-orb"
        style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.35) 0%, transparent 70%)", transform: "scale(1.2)" }}
      />

      {/* Main floating card */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "rgba(24,24,27,0.95)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Card header bar */}
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
        >
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-[10px] text-zinc-500 font-medium">resume_senior_dev.pdf</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Name + title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-base font-bold text-white leading-tight">Alex Morgan</p>
                <p className="text-xs text-[var(--accent)]">Senior Software Engineer</p>
              </div>
              {/* ATS badge */}
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
                <span className="text-base font-black text-[var(--accent)] leading-none">94</span>
                <span className="text-[8px] text-[var(--accent)]/70 font-semibold">ATS</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["San Francisco", "alex@email.com"].map((t) => (
                <span key={t} className="text-[9px] px-2 py-0.5 rounded-full text-zinc-400" style={{ background: "rgba(255,255,255,0.06)" }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Experience section */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Experience</p>
            <div className="space-y-2.5">
              {[
                { company: "Stripe", role: "Senior SWE · 2021–present", lines: [70, 55, 85] },
                { company: "Airbnb", role: "SWE · 2018–2021", lines: [60, 80] },
              ].map((exp) => (
                <div key={exp.company}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-[10px] font-semibold text-white">{exp.company}</p>
                    <span className="text-[9px] text-zinc-500">{exp.role}</span>
                  </div>
                  <div className="space-y-1 pl-2">
                    {exp.lines.map((w, i) => (
                      <div
                        key={i}
                        className="h-1.5 rounded-full shimmer-line"
                        style={{ width: `${w}%`, background: "rgba(255,255,255,0.08)" }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {["TypeScript", "React", "Node.js", "AWS", "GraphQL", "PostgreSQL"].map((s) => (
                <span
                  key={s}
                  className="text-[9px] px-2 py-0.5 rounded-md font-medium text-[var(--accent)]"
                  style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating secondary card: match badge */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-4 -left-6 rounded-xl px-4 py-3 shadow-xl flex items-center gap-3"
        style={{
          background: "rgba(16,16,20,0.96)",
          border: "1px solid rgba(99,102,241,0.4)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-bold text-white">Kit generated</p>
          <p className="text-[9px] text-zinc-400">Resume · Cover letter · Prep</p>
        </div>
      </motion.div>

      {/* Floating secondary card: time */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -top-4 -right-4 rounded-xl px-3 py-2.5 shadow-xl"
        style={{
          background: "rgba(16,16,20,0.96)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(16px)",
        }}
      >
        <p className="text-[10px] font-bold text-white flex items-center gap-1.5">
          <span className="text-[var(--accent)]">⚡</span> Generated in 28s
        </p>
      </motion.div>
    </div>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────

const FEATURES_FREE = [
  "3 application kits / month",
  "AI resume builder",
  "ATS score & tailoring",
  "Cover letter generator",
  "Match score & keyword analysis",
  "Interview prep per application",
  "Application tracker",
  "2 resume templates",
  "Career explorer (3 saves)",
];

const FEATURES_PRO = [
  "Unlimited application kits",
  "Everything in Free",
  "All 5 premium templates",
  "Voice mock interview coach",
  "Unlimited career saves & roadmaps",
  "Gap analysis vs. any job",
  "Resume comparison (base vs. tailored)",
  "Public resume link (no branding)",
  "Priority AI — faster responses",
];

const FAQS = [
  {
    q: "How does the kit generation work?",
    a: "Paste any job description. We instantly tailor your resume to match the role's keywords, write a personalised cover letter, score your ATS compatibility, and generate interview questions — all in one step, in about 30 seconds.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your career data is stored securely in a private database with row-level security. We never share your information or use it to train AI models.",
  },
  {
    q: "What makes this different from ChatGPT?",
    a: "ChatGPT requires you to engineer your own prompts, copy-paste everything, and stitch the output together yourself. We give you an integrated workflow: profile → tailored resume → cover letter → match score → interview prep → application tracker, all in one place, all connected to your real history.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel your Pro subscription at any time from Settings → Billing. You keep Pro access until the end of your billing period.",
  },
  {
    q: "Does the free tier expire?",
    a: "No. The free tier is free forever. You get 3 kit generations per month, access to the resume builder, and the application tracker at no cost.",
  },
  {
    q: "What's included in the mock interview coach?",
    a: "The voice-enabled AI coach reads each question aloud, listens to your answer via microphone, and gives structured feedback on clarity, structure, and relevance — just like a real interview practice session.",
  },
];

// ── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [yearly, setYearly] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const monthlyPrice = 15;
  const yearlyMonthlyEquiv = Math.round(99 / 12);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 safe-area-top border-b border-[var(--border-subtle)]"
        style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <MarketingNav />
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[100vh] flex items-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />
        {/* Animated orbs */}
        <div className="absolute top-1/3 left-[10%] w-[500px] h-[500px] rounded-full animate-orb pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 right-[5%] w-[400px] h-[400px] rounded-full animate-orb-2 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute top-0 right-1/3 w-[300px] h-[300px] rounded-full animate-orb-3 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(50px)" }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--bg-primary))" }} />

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: headline + CTAs */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full px-3 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                  AI-powered job application platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
              >
                Land more interviews.
                <br />
                <span className="text-[var(--accent)]">Get hired faster.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed mb-10 max-w-lg"
              >
                Paste any job description. Get a tailored resume, personalised cover letter, match score, and interview prep — in one click, in 30 seconds.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              >
                <Link href="/signup" className="btn-primary min-w-[220px] py-4 text-base text-center">
                  Start free — no credit card
                </Link>
                <a href="#how-it-works" className="btn-secondary min-w-[200px] py-4 text-base text-center">
                  See how it works
                </a>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-5 text-xs text-[var(--text-tertiary)]"
              >
                Free forever · No credit card required · Cancel Pro anytime
              </motion.p>
            </div>

            {/* Right: floating resume card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:flex items-center justify-center py-10"
            >
              <HeroResumeCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <section className="py-10 px-4 sm:px-6 border-y border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <StaggerContainer className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: "30s", label: "Average kit generation time" },
            { value: "3×", label: "More likely to pass ATS screening" },
            { value: "5+hrs", label: "Saved per application" },
            { value: "100%", label: "Private · Your data stays yours" },
          ].map((s) => (
            <StaggerItem key={s.value}>
              <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">{s.value}</p>
              <p className="text-xs text-[var(--text-secondary)] leading-snug">{s.label}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ── Problem ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <p className="text-sm font-semibold text-[var(--accent)] tracking-widest uppercase mb-3">The problem</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-12 max-w-2xl">
              Job hunting is broken.
            </h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                title: "Resumes get rejected by bots",
                body: "ATS systems filter out great candidates for missing keywords and poor formatting. Your resume may never reach a human.",
              },
              {
                icon: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414A1 1 0 0120 8.414V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2",
                title: "Generic applications get ignored",
                body: "Recruiters see hundreds of identical CVs. One resume does not fit all roles — tailoring takes hours you don't have.",
              },
              {
                icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
                title: "Interviews feel like a black box",
                body: "Most people wing it and underperform. Structured practice before the call is the difference between an offer and silence.",
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{item.body}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-[var(--accent)] tracking-widest uppercase mb-3">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              From job posting to interview-ready in minutes
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Everything tied together in one workflow — no juggling tabs, no copy-pasting, no starting from scratch each time.
            </p>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 gap-6">
            {[
              {
                step: "01",
                title: "Build your profile once",
                desc: "Add your experience, skills, and achievements to your career profile. Import from LinkedIn or dictate with voice input. This becomes the source for every application.",
                badge: "Foundation",
              },
              {
                step: "02",
                title: "Paste any job description",
                desc: "Copy a job posting and paste it in. We analyse the role, extract key requirements, and score your current resume against it — instantly.",
                badge: "Core feature",
              },
              {
                step: "03",
                title: "Get your full application kit",
                desc: "In one click, get a tailored resume, personalised cover letter, match score with gap analysis, and role-specific interview questions — all in under 30 seconds.",
                badge: "The magic ✨",
              },
              {
                step: "04",
                title: "Track, practise, and win",
                desc: "Save every application to your dashboard. Practise interviews with AI feedback. Come back to any application and see everything generated for it.",
                badge: "Long-term value",
              },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex gap-5 p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors h-full"
                >
                  <div className="shrink-0">
                    <span className="block text-3xl font-bold text-[var(--accent)]/30 leading-none">{item.step}</span>
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/10 rounded-full px-2.5 py-0.5 mb-2">
                      {item.badge}
                    </span>
                    <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-[var(--accent)] tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Every tool your job search needs
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Purpose-built for active job seekers — not a generic AI chat tool bolted onto a resume template.
            </p>
          </FadeIn>
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                title: "AI Resume Builder",
                desc: "Generate an ATS-friendly resume from your profile in one click. Edit every section with AI-powered bullet improvement.",
                pro: false,
              },
              {
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                title: "ATS Score & Keyword Match",
                desc: "Instantly see how your resume ranks against any job description. Get specific keyword suggestions and a 0–100 score.",
                pro: false,
              },
              {
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
                title: "One-Click Application Kit",
                desc: "Paste a job description. Get a tailored resume, cover letter, match analysis, and interview prep — simultaneously.",
                pro: false,
              },
              {
                icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
                title: "Personalised Cover Letters",
                desc: "Human-sounding, specific to the role. References your real experience and matches the company tone.",
                pro: false,
              },
              {
                icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
                title: "Application Tracker",
                desc: "Dashboard for your entire pipeline. Saved → Applied → Interview → Offer. Every kit saved and accessible anytime.",
                pro: false,
              },
              {
                icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
                title: "Voice Mock Interview Coach",
                desc: "AI reads the question aloud, listens to your answer, and gives real-time feedback on clarity and structure.",
                pro: true,
              },
              {
                icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
                title: "Career Explorer & Roadmaps",
                desc: "Conversational AI helps you discover new career paths, understand salary, and build a step-by-step roadmap to get there.",
                pro: false,
              },
              {
                icon: "M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 10.5h.008v7.5H12V10.5z",
                title: "Gap Analysis",
                desc: "See exactly what's missing from your profile for any role. Know what to study, build, or add before applying.",
                pro: false,
              },
              {
                icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
                title: "Public Resume Link",
                desc: "Share a polished, professionally themed resume at a custom URL. Ideal for LinkedIn, emails, and portfolio pages.",
                pro: false,
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative flex gap-4 p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors h-full"
                >
                  {item.pro && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/10 rounded-full px-2 py-0.5">
                      Pro
                    </span>
                  )}
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-sm font-semibold text-[var(--accent)] tracking-widest uppercase mb-3">Pricing</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Simple, honest pricing</h2>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
              Start free. Upgrade when you want unlimited power. Cancel anytime.
            </p>
            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 p-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  !yearly ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  yearly ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Yearly
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${yearly ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400"}`}>
                  Save 45%
                </span>
              </button>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <FadeIn direction="left" delay={0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-8 flex flex-col h-full"
              >
                <div className="mb-6">
                  <p className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Free</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-bold">$0</span>
                  </div>
                  <p className="text-sm text-[var(--text-tertiary)]">Forever free · No credit card</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {FEATURES_FREE.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                      <svg className="w-4 h-4 text-[var(--text-tertiary)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="btn-secondary w-full justify-center py-3 text-sm">
                  Get started free
                </Link>
              </motion.div>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative rounded-2xl bg-[var(--accent)] p-8 flex flex-col overflow-hidden shadow-2xl shadow-[var(--accent)]/30 h-full"
              >
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white rounded-full px-3 py-1">
                    Most popular
                  </span>
                </div>
                <div className="mb-6">
                  <p className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-2">Pro</p>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-5xl font-bold text-white">
                      ${yearly ? yearlyMonthlyEquiv : monthlyPrice}
                    </span>
                    <span className="text-white/70 text-sm mb-1.5">/month</span>
                  </div>
                  {yearly ? (
                    <p className="text-sm text-white/70">Billed as $99/year · Save $81</p>
                  ) : (
                    <p className="text-sm text-white/70">Billed monthly · Or save 45% yearly</p>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {FEATURES_PRO.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/90">
                      <svg className="w-4 h-4 text-white shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block w-full bg-white text-[var(--accent)] font-semibold text-sm py-3 rounded-xl text-center hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg"
                >
                  Start Pro — {yearly ? "$99/year" : "$15/month"}
                </Link>
              </motion.div>
            </FadeIn>
          </div>

          <FadeIn delay={0.3}>
            <p className="text-center text-sm text-[var(--text-tertiary)] mt-8">
              The average salary uplift from a better job is{" "}
              <span className="text-[var(--text-secondary)] font-medium">$10,000–$25,000</span>.
              {" "}Pro pays for itself in the first interview you land.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-[var(--accent)] tracking-widest uppercase mb-3">What users say</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Results, not just features</h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I was applying for 3 months with no callbacks. Used this for one week and had 4 first-round interviews booked. The ATS scoring made me realise my resume was invisible.",
                name: "Marcus T.",
                role: "Software Engineer → Senior SWE",
                initial: "M",
              },
              {
                quote: "The cover letters it writes actually sound like me. I spent 30 minutes editing the first one. By the fifth application I wasn't editing at all — just sending.",
                name: "Priya R.",
                role: "Marketing Manager",
                initial: "P",
              },
              {
                quote: "The mock interview coach is what set me apart. I walked into my final round having already answered every question they asked. Got the offer the same day.",
                name: "Jordan K.",
                role: "Product Manager",
                initial: "J",
              },
            ].map((t) => (
              <StaggerItem key={t.name}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex flex-col gap-5 p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors h-full"
                >
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent)]">
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-sm font-semibold text-[var(--accent)] tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="text-4xl font-bold tracking-tight">Common questions</h2>
          </FadeIn>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{faq.q}</span>
                    <motion.svg
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-4 h-4 text-[var(--text-tertiary)] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-5 pb-5 border-t border-[var(--border-subtle)]"
                    >
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-4">{faq.a}</p>
                    </motion.div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <FadeIn>
          <div className="max-w-4xl mx-auto text-center gradient-mesh rounded-3xl p-10 sm:p-16 border border-[var(--border-subtle)] relative overflow-hidden">
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.2), transparent)" }} />
            <p className="relative text-sm font-semibold text-[var(--accent)] tracking-widest uppercase mb-4">Ready to start?</p>
            <h2 className="relative text-4xl sm:text-5xl font-bold tracking-tight mb-5">
              Your next job is one kit away.
            </h2>
            <p className="relative text-[var(--text-secondary)] max-w-lg mx-auto mb-10 leading-relaxed">
              Stop sending generic applications. Start sending tailored kits that get you noticed. Free to start, no credit card needed.
            </p>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="btn-primary w-full sm:w-auto min-w-[220px] py-4 text-base">
                Create free account
              </Link>
              <a href="#pricing" className="btn-secondary w-full sm:w-auto min-w-[220px] py-4 text-base">
                View pricing
              </a>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 sm:px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div className="max-w-xs">
              <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">Smart Resume</p>
              <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
                The AI-powered platform that helps job seekers land more interviews and get hired faster.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Product</p>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">How it works</a></li>
                  <li><a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</a></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Account</p>
                <ul className="space-y-2">
                  <li><Link href="/signup" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Sign up free</Link></li>
                  <li><Link href="/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Log in</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--border-subtle)]">
            <p className="text-xs text-[var(--text-tertiary)]">© {new Date().getFullYear()} Smart Resume Platform. All rights reserved.</p>
            <p className="text-xs text-[var(--text-tertiary)]">Your data is private. We never sell it.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
