import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { headline, target_roles, skills, experience, career_goals } = body as {
      headline?: string;
      target_roles?: string[];
      skills?: string[];
      experience?: Array<{ role: string; company: string; end?: string }>;
      career_goals?: string;
    };

    const system = `You are a professional resume writer. Write a compelling 3–4 sentence professional summary for a resume. Write in first person, be specific and achievement-oriented. Output plain text only—no bullets, no JSON.`;

    const expSummary = experience?.slice(0, 3)
      .map((e) => `${e.role} at ${e.company}${e.end === "Present" ? " (current)" : ""}`)
      .join("; ");

    const prompt = `Write a professional summary for a resume.
${headline ? `Headline: ${headline}` : ""}
${target_roles?.length ? `Target roles: ${target_roles.join(", ")}` : ""}
${expSummary ? `Recent experience: ${expSummary}` : ""}
${skills?.length ? `Top skills: ${skills.slice(0, 10).join(", ")}` : ""}
${career_goals ? `Career goal: ${career_goals}` : ""}`;

    const summary = await getCompletion(prompt, { system, maxTokens: 300 });
    return NextResponse.json({ summary: summary.trim() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
