import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";
import { getDisplayName } from "@/lib/profile";
import type { CareerSuggestionItem } from "@/types/career";

export type { CareerSuggestionItem };

export type CareerChatResponse =
  | { type: "question"; text: string }
  | { type: "career_suggestions"; suggestions: CareerSuggestionItem[] };

const SYSTEM_PROMPT = `You are a warm, expert career advisor. You help people find careers that would fit them and make them happy and fulfilled.

Your response must be exactly one JSON object, no other text. No markdown, no code fence.

If you need more information to give good career suggestions, respond with:
{"type":"question","text":"Your single, friendly question here. Ask about what they enjoy, what they're good at, what they value (pay, balance, meaning, creativity), current experience, or constraints (time, money for school)."}

After 2-5 exchanges when you have enough context, respond with career suggestions:
{"type":"career_suggestions","suggestions":[{"title":"Job title","salary_range":"e.g. $70k–$120k (US) or describe range","education_needed":"e.g. Bachelor's typical; bootcamp or cert sometimes accepted","cost_to_become":"Rough cost: degree/certs/bootcamp and time","daily_life":"2-3 sentences: typical day, who they work with, environment","demand":"e.g. High growth / Stable / Niche - short note","time_to_qualify":"e.g. 2-4 years with degree, 6-12 months with bootcamp","tips_to_get_job":"2-4 concrete tips: portfolio, networking, keywords, certs","why_fit":"1-2 sentences why this fits what they told you"}]}

Guidelines:
- Ask one question per message. Be conversational and supportive.
- For suggestions: give 2-5 careers. Use real-world salary ranges and demand (you may estimate). Be specific and practical.
- Include variety: one stretch option, one closer to their current path, one they might not have considered.
- Keep each field concise but useful.`;

function parseChatResponse(raw: string): CareerChatResponse | null {
  const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as CareerChatResponse;
    if (parsed.type === "question" && typeof parsed.text === "string") return parsed;
    if (
      parsed.type === "career_suggestions" &&
      Array.isArray(parsed.suggestions) &&
      parsed.suggestions.length > 0
    ) {
      return parsed;
    }
  } catch {
    // fallback: treat as question
    return { type: "question", text: cleaned.slice(0, 800) };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { messages } = body as { messages: { role: string; content: string }[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .single();
    const { data: career } = await supabase
      .from("career_profiles")
      .select("summary, headline, raw_experience, skills, target_roles")
      .eq("user_id", user.id)
      .single();

    const profileContext = {
      name: getDisplayName(profile),
      email: user.email,
      headline: career?.headline,
      summary: career?.summary,
      experience: career?.raw_experience,
      skills: career?.skills,
      target_roles: career?.target_roles,
    };

    const convo = messages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    const prompt = `Profile (use this to personalize questions and suggestions):\n${JSON.stringify(profileContext, null, 2)}\n\nConversation so far:\n${convo}\n\nRespond with one JSON object only.`;

    const raw = await getCompletion(prompt, { system: SYSTEM_PROMPT, maxTokens: 2048 });
    const response = parseChatResponse(raw);
    if (!response) {
      return NextResponse.json({ error: "Could not parse AI response", raw }, { status: 500 });
    }

    if (response.type === "career_suggestions") {
      await supabase.from("career_suggestions").insert({
        user_id: user.id,
        content: { type: "career_suggestions", suggestions: response.suggestions },
      });
    }

    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
