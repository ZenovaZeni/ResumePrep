import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";

const EXTRACT_SYSTEM = `You are a profile extraction assistant. Given raw text from a LinkedIn profile or resume, extract structured data. Output only a single valid JSON object, no markdown or code fence.

Use this exact shape (omit keys when not found):
{
  "profile": {
    "first_name": "string or null",
    "last_name": "string or null"
  },
  "career": {
    "headline": "string or null",
    "summary": "string or null",
    "target_roles": ["string"],
    "career_goals": "string or null",
    "raw_experience": [
      { "company": "string", "role": "string", "location": "string or omit", "start": "string", "end": "string", "bullets": ["string"] }
    ],
    "education": [
      { "school": "string", "degree": "string", "field": "string or omit", "start": "string", "end": "string" }
    ],
    "skills": ["string"],
    "certifications": ["string"] or [],
    "projects": [{ "name": "string", "description": "string or omit", "url": "string or omit", "bullets": ["string"] or [] }] or [],
    "achievements": ["string"] or [],
    "metrics": {} or omit
  }
}
Split name into first_name and last_name when possible. For experience and education use consistent date formats (e.g. "Jan 2020", "Present"). Output only the JSON object.`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { paste, source } = body as { paste?: string; source?: "linkedin" | "resume" | "generic" };
    if (!paste || typeof paste !== "string" || !paste.trim()) {
      return NextResponse.json(
        { error: "paste (string) is required" },
        { status: 400 }
      );
    }

    const hint = source === "linkedin" ? " (LinkedIn profile text)" : source === "resume" ? " (resume text)" : "";
    const raw = await getCompletion(
      `Extract structured profile and career data from the following text${hint}. Output only the JSON object.\n\n${paste.trim().slice(0, 30000)}`,
      { system: EXTRACT_SYSTEM, maxTokens: 4096 }
    );
    const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
    let parsed: { profile?: { first_name?: string | null; last_name?: string | null }; career?: unknown };
    try {
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for profile import" },
        { status: 500 }
      );
    }

    const profile = parsed.profile ?? {};
    const career = parsed.career ?? {};
    if (typeof career !== "object" || career === null) {
      return NextResponse.json(
        { error: "AI returned invalid career shape" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile, career });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
