import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { ResumeData } from "@/types/resume";
import { getDefaultDesign } from "@/types/resume";
import { PublicResumeToolbar } from "./PublicResumeToolbar";
import { PublicResumeContent } from "./PublicResumeContent";

export default async function PublicResumePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("id, name, resume_data")
    .eq("slug", slug)
    .single();

  if (!resume) notFound();

  const data = (resume.resume_data ?? {}) as ResumeData;
  const design = getDefaultDesign(data.design);
  const theme = design.publicTheme ?? "clean";
  const fontClass = design.fontFamily === "serif" ? "font-serif" : "font-sans";
  const compactThemes = ["minimal", "compact"];
  const paddingClass = compactThemes.includes(theme) ? "p-6 text-[13px]" : "p-8 text-sm";

  return (
    <>
      <PublicResumeToolbar slug={slug} />
      <main
        data-theme={theme}
        className={`min-h-screen bg-white text-black max-w-2xl mx-auto print:p-0 print:max-w-none resume-print ${paddingClass}`}
      >
        <div className={fontClass}>
          <PublicResumeContent data={data} theme={theme} />
        </div>
      </main>
    </>
  );
}
