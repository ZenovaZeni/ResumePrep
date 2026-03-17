import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";
import { getDisplayName } from "@/lib/profile";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { target_role, timeline_years } = body as {
      target_role: string;
      timeline_years?: number;
    };
    if (!target_role?.trim()) {
      return NextResponse.json(
        { error: "target_role is required" },
        { status: 400 }
      );
    }

    const [{ data: profile }, { data: career }] = await Promise.all([
      supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single(),
      supabase.from("career_profiles").select("*").eq("user_id", user.id).single(),
    ]);
    const profileForAI = {
      name: getDisplayName(profile),
      ...career,
    };
    const timeline = timeline_years != null && timeline_years > 0 ? timeline_years : 3;

    const system = `You are a career coach. Output only a single valid JSON object with key "steps": an array of objects, each with "title" (string), "description" (string, 1-2 sentences), "timeline" (string, e.g. "Months 1-6"), "resumeTip" (string, how to reflect this step on a resume). Generate 5-10 steps: skills to learn, certs, projects, experience to gain, timeline, and how to reflect each on a resume. No markdown, no code fence.`;
    const prompt = `Create a step-by-step roadmap for this person to become: ${target_role.trim()}, in roughly ${timeline} years.

Current profile:
${JSON.stringify(profileForAI, null, 2)}

Output JSON: { "steps": [ { "title": "...", "description": "...", "timeline": "...", "resumeTip": "..." }, ... ] }.`;

    const raw = await getCompletion(prompt, { system, maxTokens: 2048 });
    const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
    let parsed: { steps?: Array<{ title?: string; description?: string; timeline?: string; resumeTip?: string }> };
    try {
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for roadmap" },
        { status: 500 }
      );
    }

    const steps = Array.isArray(parsed.steps)
      ? parsed.steps
          .filter((s) => s && typeof s.title === "string")
          .map((s) => ({
            title: s.title ?? "",
            description: typeof s.description === "string" ? s.description : "",
            timeline: typeof s.timeline === "string" ? s.timeline : "",
            resumeTip: typeof s.resumeTip === "string" ? s.resumeTip : "",
          }))
      : [];

    return NextResponse.json({ steps });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
