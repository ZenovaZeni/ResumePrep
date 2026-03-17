import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ResumeEditor } from "./ResumeEditor";
import type { ResumeData } from "@/types/resume";

export default async function ResumeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: resume }, { data: profile }] = await Promise.all([
    supabase.from("resumes").select("id, name, resume_data, slug").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("profiles").select("tier").eq("user_id", user.id).single(),
  ]);

  if (!resume) notFound();

  const resumeData = (resume.resume_data ?? {}) as ResumeData;
  const tier = (profile?.tier as "free" | "pro" | null) ?? "free";
  const isTestAccount = user.email === "test@example.com";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-1">{resume.name}</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Edit below. Use <strong>Improve</strong> on any bullet for AI polish, <strong>Suggest bullets</strong> to add new ones, and <strong>ATS check</strong> to see how it scores.
      </p>
      <ResumeEditor
        resumeId={resume.id}
        initialData={resumeData}
        initialSlug={resume.slug}
        tier={tier}
        isTestAccount={isTestAccount}
      />
    </div>
  );
}
