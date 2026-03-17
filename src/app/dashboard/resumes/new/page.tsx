import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResumeNewForm } from "./ResumeNewForm";
import { RESUME_TEMPLATES } from "@/types/resume";

export default async function NewResumePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single();
  const { data: career } = await supabase.from("career_profiles").select("*").eq("user_id", user.id).single();

  const { getDisplayName } = await import("@/lib/profile");
  const profileForResume = {
    contact: {
      name: getDisplayName(profile),
      email: user.email ?? undefined,
    },
    headline: career?.headline ?? undefined,
    summary: career?.summary ?? undefined,
    experience: (career?.raw_experience as Array<{ company: string; role: string; start: string; end: string; bullets: string[] }>) ?? [],
    education: (career?.education as Array<{ school: string; degree: string; field?: string; start: string; end: string }>) ?? [],
    skills: career?.skills ?? [],
    certifications: (career?.certifications as string[]) ?? [],
    projects: (career?.projects as Array<{ name: string; description?: string; bullets?: string[] }>) ?? [],
    achievements: (career?.achievements as string[]) ?? [],
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-6">Create resume</h1>
      <p className="text-zinc-400 text-sm mb-6">
        Choose a template. We’ll generate a first draft from your career profile; you can edit it before saving.
      </p>
      <ResumeNewForm
        profile={profileForResume}
        templates={RESUME_TEMPLATES}
      />
    </div>
  );
}
