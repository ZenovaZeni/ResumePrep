import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { company_name, job_title, interview_notes } = body as {
      company_name: string;
      job_title: string;
      interview_notes?: string;
    };
    if (!company_name?.trim() || !job_title?.trim()) {
      return NextResponse.json(
        { error: "company_name and job_title required" },
        { status: 400 }
      );
    }

    const system = `You are a professional career coach. Output only a single valid JSON object with keys: "thankYouEmail" (string: short, warm thank-you email 2-3 paragraphs), "followUpLines" (string: 1-2 sentences the candidate can use in a follow-up if they don't hear back). No markdown, no code fence.`;
    const prompt = `Generate a thank-you email and follow-up lines after an interview for ${job_title} at ${company_name.trim()}.${interview_notes?.trim() ? `\n\nInterview notes to reference: ${interview_notes.trim()}` : ""}

Output JSON: { "thankYouEmail": "...", "followUpLines": "..." }`;

    const raw = await getCompletion(prompt, { system, maxTokens: 1024 });
    const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
    let parsed: { thankYouEmail?: string; followUpLines?: string };
    try {
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for follow-up" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      thankYouEmail: typeof parsed.thankYouEmail === "string" ? parsed.thankYouEmail : "",
      followUpLines: typeof parsed.followUpLines === "string" ? parsed.followUpLines : "",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
