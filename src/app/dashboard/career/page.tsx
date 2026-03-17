import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CareerExplorer } from "./CareerExplorer";
import { CareerRecent } from "./CareerRecent";
import { CareerRoadmap } from "./CareerRoadmap";
import { CareerGapAnalysis } from "./CareerGapAnalysis";

export default async function CareerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: suggestions }, { data: applications }] = await Promise.all([
    supabase
      .from("career_suggestions")
      .select("id, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("applications")
      .select("id, job_title, company_name")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mb-2">
        Career explorer
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Use the chat to explore careers that fit you, or get quick suggestions by role. Save any career to copy, download, or dive deeper—and share or email the info easily.
      </p>

      <CareerExplorer />

      <div className="mt-8 space-y-8">
        <CareerRoadmap />
        <CareerGapAnalysis applications={applications ?? []} />
      </div>

      {suggestions && suggestions.length > 0 && (
        <CareerRecent suggestions={suggestions} />
      )}
    </div>
  );
}
