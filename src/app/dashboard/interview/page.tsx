import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { InterviewCoach } from "./InterviewCoach";
import { canUseFeature } from "@/lib/tier";
import { redirect } from "next/navigation";

export default async function InterviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("user_id", user.id)
    .single();
  const allowed = canUseFeature(profile?.tier, "interview");

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("id, interview_type, role_context, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-1">Interview practice</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Practice with AI: answer questions and get instant feedback. For job-specific prep, use{" "}
        <Link href="/dashboard/apply" className="text-[var(--accent)] font-medium hover:text-[var(--accent-hover)]">Generate application kit →</Link>
      </p>

      {!allowed.allowed ? (
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 space-y-6 lg:space-y-0">
          {/* Left: feature preview */}
          <div className="space-y-5">
            <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Voice Mock Interview Coach</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/10 rounded-full px-2 py-0.5">Pro</span>
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
                The AI reads each interview question aloud, listens to your answer via microphone, and gives structured feedback on clarity, structure, and relevance — just like practicing with a real recruiter.
              </p>
              <div className="space-y-3">
                {[
                  { icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z", label: "Voice input — answer by speaking naturally" },
                  { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "Real-time scoring on clarity, structure, and relevance" },
                  { icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", label: "Behavioral, technical, and situational modes" },
                  { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", label: "Sessions saved — review your progress over time" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Interview prep that IS available */}
            <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5">
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Available on free</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                Job-specific interview prep (questions + model answers) is available for free on every application you generate.
              </p>
              <Link
                href="/dashboard/apply"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                Generate a kit to get interview prep →
              </Link>
            </div>
          </div>

          {/* Right: upgrade card */}
          <div className="rounded-2xl bg-[var(--accent)] p-6 flex flex-col h-fit shadow-2xl shadow-[var(--accent)]/25">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Upgrade to</p>
            <p className="text-3xl font-bold text-white mb-1">Pro</p>
            <div className="flex items-end gap-1.5 mb-1">
              <span className="text-xl font-bold text-white">$8</span>
              <span className="text-white/70 text-sm mb-0.5">/month</span>
            </div>
            <p className="text-xs text-white/60 mb-5">Billed as $99/year · Save 45%</p>
            <ul className="space-y-2.5 mb-6">
              {[
                "Unlimited application kits",
                "Voice mock interview coach",
                "All 5 premium templates",
                "Unlimited career saves",
                "Priority AI",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                  <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard/upgrade"
              className="block w-full text-center bg-white text-[var(--accent)] font-bold text-sm py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg"
            >
              Upgrade to Pro
            </Link>
            <p className="text-center text-xs text-white/50 mt-3">Cancel anytime · 30-day money-back</p>
          </div>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 space-y-6 lg:space-y-0 items-start">
          <InterviewCoach />
          {sessions && sessions.length > 0 && (
            <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden lg:sticky lg:top-24">
              <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent sessions</h2>
              </div>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {sessions.map((s) => (
                  <li key={s.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-[var(--text-primary)] capitalize">{s.interview_type}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {s.role_context ? `${s.role_context} · ` : ""}
                      {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
