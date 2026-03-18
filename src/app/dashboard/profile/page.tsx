import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
import { computeProfileCompletion } from "@/lib/profile-completion";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, careerResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("career_profiles").select("*").eq("user_id", user.id).single(),
  ]);

  // PGRST116 = "no row found" — expected for new users. Not an error.
  const profile = profileResult.data ?? null;
  const career = careerResult.data ?? null;

  const realProfileErr =
    profileResult.error && profileResult.error.code !== "PGRST116"
      ? profileResult.error.message
      : null;
  const realCareerErr =
    careerResult.error && careerResult.error.code !== "PGRST116"
      ? careerResult.error.message
      : null;
  const loadError = realProfileErr ?? realCareerErr ?? null;

  // Compute profile completion score for sidebar (shared logic with ProfileForm)
  const { score: completionScore, items: completionItems } = computeProfileCompletion({
    firstName: profile?.first_name,
    email: user.email,
    location: career?.location,
    headline: career?.headline,
    summary: career?.summary,
    targetRoles: career?.target_roles,
    experience: Array.isArray(career?.raw_experience) ? (career.raw_experience as unknown[]) : null,
    education: Array.isArray(career?.education) ? (career.education as unknown[]) : null,
    skills: career?.skills,
    linkedin: undefined,
    website: undefined,
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Career profile
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
          Your single source of truth. The AI reads this to tailor your resume,
          cover letter, and interview prep for every job you apply to.
        </p>
      </div>

      {/* Two-column on desktop */}
      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 items-start">
        {/* Main: profile form */}
        <div className="min-w-0">
          <ProfileForm
            profile={profile ?? undefined}
            careerProfile={career ?? undefined}
            userEmail={user.email ?? undefined}
            loadError={loadError}
          />
        </div>

        {/* Sidebar: completion + tips (sticky) */}
        <div className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-24">
          {/* Completion score */}
          <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Profile completion</p>
              <span className={`text-sm font-bold ${completionScore === 100 ? "text-emerald-400" : "text-[var(--accent)]"}`}>
                {completionScore}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-700 ${completionScore === 100 ? "bg-emerald-500" : "bg-[var(--accent)]"}`}
                style={{ width: `${completionScore}%` }}
              />
            </div>
            <ul className="space-y-2">
              {completionItems.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-xs">
                  {item.done ? (
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-[var(--text-tertiary)]/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                  <span className={item.done ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Why it matters */}
          <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5 space-y-3">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">Why this matters</p>
            {[
              { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", text: "A complete profile means stronger, more tailored resumes and cover letters." },
              { icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z", text: "Interview prep uses your real experience to generate personalised model answers." },
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", text: "Every field you add increases the AI's ability to match you to the right roles." },
            ].map((tip) => (
              <div key={tip.text} className="flex gap-2.5">
                <div className="shrink-0 w-6 h-6 rounded-md bg-[var(--accent)]/10 flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tip.icon} />
                  </svg>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>

          {/* Quick action */}
          {completionScore >= 60 && (
            <div className="rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 p-4 text-center">
              <p className="text-xs text-[var(--text-secondary)] mb-3">Profile looking good. Ready to generate your first kit?</p>
              <a
                href="/dashboard/apply"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Generate application kit →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
