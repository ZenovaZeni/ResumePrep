import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile, error: profileError }, { data: career, error: careerError }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("career_profiles").select("*").eq("user_id", user.id).single(),
    ]);
  const loadError = profileError?.message ?? careerError?.message ?? null;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">
        Career profile
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Your single source of truth for resumes and cover letters. AI uses this to generate and tailor content—keep it up to date.
      </p>
      <ProfileForm
        profile={profile ?? undefined}
        careerProfile={career ?? undefined}
        userEmail={user.email ?? undefined}
        loadError={loadError}
      />
    </div>
  );
}
