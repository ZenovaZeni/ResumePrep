import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";
import type { CareerSuggestionItem } from "@/types/career";

const SYSTEM = `You are a professional resume writer. Given a target career, write 4-6 strong resume bullet points a candidate could use once they are working in that role. Use action verbs, include metrics where realistic (% ranges, time saved, etc.), and focus on impact. Output plain text only: one bullet per line, each starting with •. No intro, no extra text.`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const career = body as CareerSuggestionItem;
    if (!career?.title) {
      return NextResponse.json({ error: "Career object with title required" }, { status: 400 });
    }

    const { data: careerProfile } = await supabase
      .from("career_profiles")
      .select("skills, target_roles, summary")
      .eq("user_id", user.id)
      .single();

    const prompt = `Target career: ${career.title}\n\nRole context:\n- Salary range: ${career.salary_range ?? "not specified"}\n- Daily life: ${career.daily_life ?? "not specified"}\n\nUser background (use to make bullets feel realistic for this person):\n${JSON.stringify({ skills: careerProfile?.skills, summary: careerProfile?.summary })}\n\nWrite 4-6 achievement-oriented resume bullets.`;
    const text = await getCompletion(prompt, { system: SYSTEM, maxTokens: 512 });
    return NextResponse.json({ bullets: text.trim() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
