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
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">Mock interview</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Practice with AI: answer questions and get instant feedback to improve your responses.
      </p>
      {!allowed.allowed ? (
        <div className="rounded-[var(--radius-lg)] bg-amber-500/10 border border-amber-500/30 p-6">
          <p className="text-amber-200 font-medium">{allowed.reason}</p>
          <p className="text-[var(--text-secondary)] text-sm mt-2">
            Upgrade to Pro to unlock the interview coach.
          </p>
        </div>
      ) : (
        <>
          <InterviewCoach />
          {sessions && sessions.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-medium text-[var(--text-primary)] mb-3">Recent sessions</h2>
              <ul className="space-y-2">
                {sessions.map((s) => (
                  <li key={s.id} className="text-sm text-[var(--text-secondary)]">
                    {s.interview_type}
                    {s.role_context ? ` · ${s.role_context}` : ""} –{" "}
                    {new Date(s.created_at).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
