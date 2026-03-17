import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ResumeVersionsList } from "./ResumeVersionsList";

export default async function ResumeVersionsPage({
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
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!resume) notFound();

  const { data: variants } = await supabase
    .from("resume_variants")
    .select("id, name, created_at")
    .eq("resume_id", id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-2">Versions: {resume.name}</h1>
      <p className="text-zinc-400 text-sm mb-6">
        Job-specific variants and clone this resume to create a new named version.
      </p>
      <ResumeVersionsList
        resumeId={resume.id}
        resumeName={resume.name}
        variants={variants ?? []}
      />
      <div className="mt-6">
        <Link href={`/dashboard/resumes/${resume.id}`} className="text-zinc-400 hover:text-white text-sm">
          ← Back to resume
        </Link>
      </div>
    </div>
  );
}
