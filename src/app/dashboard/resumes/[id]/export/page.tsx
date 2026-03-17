import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ExportActions } from "./ExportActions";
import type { ResumeData } from "@/types/resume";

export default async function ExportResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: resume } = await supabase
    .from("resumes")
    .select("id, name, resume_data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!resume) notFound();

  const resumeData = (resume.resume_data ?? {}) as ResumeData;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-2">Export: {resume.name}</h1>
      <p className="text-zinc-400 text-sm mb-6">
        Download your resume as PDF or DOCX.
      </p>
      <ExportActions resumeId={resume.id} resumeName={resume.name} data={resumeData} />
    </div>
  );
}
