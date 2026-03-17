import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { application_id, job_title, company_name, job_description } = body as {
      application_id?: string;
      job_title?: string;
      company_name?: string;
      job_description?: string;
    };

    let title: string;
    let company: string;
    let description: string;

    if (application_id) {
      const { data: app } = await supabase
        .from("applications")
        .select("job_title, company_name, job_description")
        .eq("id", application_id)
        .eq("user_id", user.id)
        .single();
      if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
      title = app.job_title ?? "";
      company = app.company_name ?? "";
      description = app.job_description ?? "";
    } else if (job_title && company_name) {
      title = job_title;
      company = company_name;
      description = (job_description ?? "").trim();
    } else {
      return NextResponse.json(
        { error: "application_id or (job_title and company_name) required" },
        { status: 400 }
      );
    }

    const [{ data: profile }, { data: career }] = await Promise.all([
      supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single(),
      supabase.from("career_profiles").select("*").eq("user_id", user.id).single(),
    ]);
    const { getDisplayName } = await import("@/lib/profile");
    const candidateName = getDisplayName(profile);
    const profileForAI = {
      name: candidateName,
      email: user.email,
      ...career,
    };

    const system = `You are an interview coach. Output only a single valid JSON object with keys: "questions" (array of 5-8 strings: mix of behavioral and role-specific questions), "brief" (short string: 2-4 sentences about the company/role and what to emphasize), "modelAnswers" (array of 1-2 sentence suggested answers for each question, aligned with the candidate profile). No markdown, no code fence.`;
    const prompt = `Generate interview prep for this role: ${title} at ${company}.

Job description:
${description || "(not provided)"}

Candidate profile (use for model answers):
${JSON.stringify(profileForAI, null, 2)}

Output JSON: { "questions": ["...", ...], "brief": "...", "modelAnswers": ["...", ...] }.`;

    const raw = await getCompletion(prompt, { system, maxTokens: 2048 });
    const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
    let parsed: { questions?: string[]; brief?: string; modelAnswers?: string[] };
    try {
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for interview prep" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      brief: typeof parsed.brief === "string" ? parsed.brief : "",
      modelAnswers: Array.isArray(parsed.modelAnswers) ? parsed.modelAnswers : [],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
