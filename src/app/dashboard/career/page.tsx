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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
          Career explorer
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Explore career paths, get skill gap analysis, and build roadmaps. Ready to apply?{" "}
          <a href="/dashboard/apply" className="text-[var(--accent)] font-medium hover:text-[var(--accent-hover)]">Generate an application kit →</a>
        </p>
      </div>

      {/* Two-column on desktop */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 items-start space-y-8 lg:space-y-0">
        {/* Left: main tools */}
        <div className="min-w-0 space-y-8">
          <CareerExplorer />
          <CareerGapAnalysis applications={applications ?? []} />
        </div>

        {/* Right: roadmap + recent (sticky) */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <CareerRoadmap />
          {suggestions && suggestions.length > 0 && (
            <CareerRecent suggestions={suggestions} />
          )}
        </div>
      </div>
    </div>
  );
}
