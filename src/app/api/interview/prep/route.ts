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

    const system = `You are a senior interview coach who prepares candidates for specific roles. Output only a single valid JSON object. No markdown, no code fence.`;
    const prompt = `Generate targeted interview prep for: ${title} at ${company}.

Job description (write questions that reference specific requirements, technologies, and responsibilities from this):
${description || "(not provided)"}

Candidate profile (use their real experience, companies, and skills for personalized model answers):
${JSON.stringify(profileForAI, null, 2)}

Output this exact JSON structure:
{
  "questions": [<5-7 strings, each referencing a specific requirement or technology from the JD above>],
  "brief": "<2-3 sentences: what specific aspects of THIS role and company to emphasize — not generic interview advice>",
  "modelAnswers": [<one string per question, 2-3 sentences, drawing from the candidate's actual experience and companies>]
}

Rules:
- questions: must mention specific tools, responsibilities, or challenges named in the JD; avoid generic "Tell me about yourself"
- modelAnswers: reference the candidate's real companies, projects, skills, or metrics — no generic STAR templates
- brief: name specific things about this particular role or company that the candidate should highlight`;

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

    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const brief = typeof parsed.brief === "string" ? parsed.brief : "";
    const modelAnswers = Array.isArray(parsed.modelAnswers) ? parsed.modelAnswers : [];

    // Non-blocking: silently swallowed if interview_prep column doesn't exist yet.
    if (application_id) {
      await supabase
        .from("applications")
        .update({ interview_prep: { questions, brief, modelAnswers } })
        .eq("id", application_id)
        .eq("user_id", user.id)
        .then(() => null);
    }

    return NextResponse.json({ questions, brief, modelAnswers });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
