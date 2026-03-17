import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CompareResumes } from "./CompareResumes";

export default async function CompareResumesPage({
  searchParams,
}: {
  searchParams: Promise<{ base?: string; variant?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { base: baseId, variant: variantId } = await searchParams;
  if (!baseId || !variantId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-white mb-6">Compare versions</h1>
        <p className="text-zinc-400">Select two versions from the resume Versions page.</p>
      </div>
    );
  }

  const { data: baseResume } = await supabase
    .from("resumes")
    .select("id, name, resume_data")
    .eq("id", baseId)
    .eq("user_id", user.id)
    .single();

  const { data: variant } = await supabase
    .from("resume_variants")
    .select("id, name, resume_data, resume_id")
    .eq("id", variantId)
    .single();

  if (!baseResume || !variant || variant.resume_id !== baseId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-white mb-6">Compare versions</h1>
        <p className="text-zinc-400">Resume or variant not found, or variant does not belong to this resume.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-6">Compare versions</h1>
      <CompareResumes
        baseName={baseResume.name}
        variantName={variant.name}
        baseData={baseResume.resume_data}
        variantData={variant.resume_data}
      />
    </div>
  );
}
