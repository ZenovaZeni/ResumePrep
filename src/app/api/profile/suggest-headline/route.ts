import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { current_headline, target_roles, skills } = body as {
      current_headline?: string;
      target_roles?: string[];
      skills?: string[];
    };

    const system = `You are a resume expert. Output only a JSON array of exactly 3 short, compelling professional headline strings (each under 80 characters). No explanation, no markdown, just the JSON array.`;
    const prompt = `Suggest 3 professional resume headlines.
${current_headline ? `Current headline: ${current_headline}` : ""}
${target_roles?.length ? `Target roles: ${target_roles.join(", ")}` : ""}
${skills?.length ? `Top skills: ${skills.slice(0, 10).join(", ")}` : ""}

Each headline should be punchy, keyword-rich, and reflect seniority when possible.`;

    const raw = await getCompletion(prompt, { system, maxTokens: 256 });
    const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();

    let headlines: string[] = [];
    try {
      const parsed = JSON.parse(cleaned) as unknown;
      headlines = Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === "string").slice(0, 3)
        : [];
    } catch {
      headlines = cleaned.split("\n").map((s) => s.replace(/^[-*\d.]\s*/, "").trim()).filter(Boolean).slice(0, 3);
    }

    return NextResponse.json({ headlines });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
