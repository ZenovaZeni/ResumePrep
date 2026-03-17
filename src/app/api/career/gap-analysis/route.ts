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
    const { application_id, job_description } = body as {
      application_id?: string;
      job_description?: string;
    };

    let jobDesc: string;
    if (application_id) {
      const { data: app } = await supabase
        .from("applications")
        .select("job_description, job_title, company_name")
        .eq("id", application_id)
        .eq("user_id", user.id)
        .single();
      if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
      jobDesc = [app.job_title, app.company_name, app.job_description].filter(Boolean).join("\n\n");
    } else if (job_description?.trim()) {
      jobDesc = job_description.trim();
    } else {
      return NextResponse.json(
        { error: "application_id or job_description required" },
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

    const system = `You are a career coach and resume expert. Output only a single valid JSON object with keys: "strengths" (array of strings: what the candidate has that fits the job), "gaps" (array of strings: what's missing or weak vs the job), "suggestions" (array of strings: what to add—skills, wording, experience—to be a strong fit). No markdown, no code fence.`;
    const prompt = `Compare this candidate's profile to the job and give a gap analysis.

Job:
${jobDesc}

Candidate profile:
${JSON.stringify(profileForAI, null, 2)}

Output JSON: { "strengths": ["...", ...], "gaps": ["...", ...], "suggestions": ["...", ...] }.`;

    const raw = await getCompletion(prompt, { system, maxTokens: 1536 });
    const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
    let parsed: { strengths?: string[]; gaps?: string[]; suggestions?: string[] };
    try {
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for gap analysis" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
