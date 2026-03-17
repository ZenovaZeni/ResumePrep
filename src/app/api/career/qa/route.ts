import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";
import { getDisplayName } from "@/lib/profile";

const SYSTEM_PROMPT = `You are a knowledgeable, direct career advisor. A user is asking a specific question about a career or career transition. Respond with exactly one JSON object, no other text. No markdown, no code fence.

{"type":"qa_answer","summary":"2-3 sentence direct answer to the question","pros":["Pro 1 relevant to their background","Pro 2","Pro 3"],"cons":["Con 1 or challenge","Con 2","Con 3"],"next_actions":["Concrete next step 1","Concrete next step 2","Concrete next step 3"],"learning_path":"2-3 sentences describing the fastest realistic path: courses, certs, or experiences to gain"}

Keep all fields concise and practical. Personalize using the user profile if available.`;

function parseResponse(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    if (parsed.type === "qa_answer" && typeof parsed.summary === "string") return parsed;
  } catch {
    // fallback: return as plain summary
    return { type: "qa_answer", summary: cleaned.slice(0, 1000), pros: [], cons: [], next_actions: [], learning_path: "" };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { question } = body as { question?: string };
    if (!question?.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .single();
    const { data: career } = await supabase
      .from("career_profiles")
      .select("summary, headline, skills, target_roles")
      .eq("user_id", user.id)
      .single();

    const profileContext = {
      name: getDisplayName(profile),
      headline: career?.headline,
      skills: career?.skills,
      target_roles: career?.target_roles,
      summary: career?.summary,
    };

    const prompt = `User question: ${question.trim()}\n\nUser profile (use to personalize if relevant):\n${JSON.stringify(profileContext)}\n\nRespond with one JSON object only.`;
    const raw = await getCompletion(prompt, { system: SYSTEM_PROMPT, maxTokens: 1024 });
    const response = parseResponse(raw);
    if (!response) {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }

    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
