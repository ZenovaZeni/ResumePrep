import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { RoadmapStep } from "@/lib/roadmap-format";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { title, timeline_years, steps } = body as {
      title?: string;
      timeline_years?: number | null;
      steps?: RoadmapStep[];
    };

    if (!title?.trim() || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: "title and steps are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("saved_roadmaps")
      .upsert(
        {
          user_id: user.id,
          title: title.trim(),
          timeline_years: timeline_years ?? null,
          roadmap_data: { steps },
        },
        { onConflict: "user_id,title,timeline_years" }
      )
      .select("id, title, timeline_years, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
