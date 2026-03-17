import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";
import type { CareerSuggestionItem } from "@/types/career";

const SYSTEM = `You are a career advisor. Given a career the user is interested in, add 2-3 short paragraphs of extra detail. Cover: typical career path and progression, types of companies that hire (e.g. startups, enterprise, remote), and 1-2 common interview questions or what hiring managers look for. Be concise and practical. Output plain text only, no JSON.`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const career = body as CareerSuggestionItem;
    if (!career?.title) {
      return NextResponse.json({ error: "Career object with title required" }, { status: 400 });
    }
    const prompt = `Career: ${career.title}\n\nExisting summary:\n${JSON.stringify(career, null, 2)}\n\nAdd 2-3 paragraphs with: career path, who hires, and interview tips.`;
    const text = await getCompletion(prompt, { system: SYSTEM, maxTokens: 512 });
    return NextResponse.json({ text: text.trim() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
