import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";
import { getDisplayName } from "@/lib/profile";
import type { CareerSuggestionItem } from "@/types/career";

const SYSTEM_PROMPT = `You are a career advisor. Given a target role and optional context, respond with exactly one JSON object, no other text. No markdown, no code fence.

{"type":"career_suggestions","suggestions":[{"title":"Job title","salary_range":"e.g. $70k–$120k (US)","education_needed":"e.g. Bachelor's typical","cost_to_become":"Rough cost and time","daily_life":"2-3 sentences","demand":"e.g. High growth","time_to_qualify":"e.g. 2-4 years","tips_to_get_job":"2-4 concrete tips","why_fit":"1-2 sentences why this role"}]}

Give 2-4 careers. Include the exact target role as one suggestion and related roles. Use realistic salary ranges and be specific.`;

function parseResponse(raw: string): CareerSuggestionItem[] | null {
  const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { type?: string; suggestions?: CareerSuggestionItem[] };
    if (parsed.type === "career_suggestions" && Array.isArray(parsed.suggestions)) return parsed.suggestions;
  } catch {
    // ignore
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { target_role, context } = body as { target_role?: string; context?: string };
    const role = (target_role ?? "").trim();
    if (!role) {
      return NextResponse.json({ error: "target_role is required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .single();
    const { data: career } = await supabase
      .from("career_profiles")
      .select("summary, skills, target_roles")
      .eq("user_id", user.id)
      .single();
    const { getDisplayName } = await import("@/lib/profile");
    const profileContext = {
      name: getDisplayName(profile),
      summary: career?.summary,
      skills: career?.skills,
      target_roles: career?.target_roles,
    };

    const prompt = `Target role: ${role}${context ? `\nAdditional context: ${context}` : ""}\n\nProfile (use to personalize why_fit):\n${JSON.stringify(profileContext)}\n\nRespond with one JSON object only.`;
    const raw = await getCompletion(prompt, { system: SYSTEM_PROMPT, maxTokens: 2048 });
    const suggestions = parseResponse(raw);
    if (!suggestions) {
      return NextResponse.json({ error: "Could not parse AI response", raw }, { status: 500 });
    }

    await supabase.from("career_suggestions").insert({
      user_id: user.id,
      content: { type: "career_suggestions", suggestions },
    });

    return NextResponse.json({ type: "career_suggestions", suggestions });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
