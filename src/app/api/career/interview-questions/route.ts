import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";
import type { CareerSuggestionItem } from "@/types/career";

const SYSTEM = `You are a career coach who specializes in interview preparation. Given a target career, provide 6-8 realistic interview questions a hiring manager would ask, with a brief note on what a strong answer should demonstrate. Format as plain text only. For each question use this format:

Q: [Question text]
Tip: [1 sentence on what a strong answer covers]

No intro text, no numbering, just the Q/Tip pairs separated by a blank line.`;

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

    const prompt = `Target career: ${career.title}\n\nRole context:\n- Education needed: ${career.education_needed ?? "not specified"}\n- Tips to get the job: ${career.tips_to_get_job ?? "not specified"}\n\nProvide 6-8 interview questions with tips.`;
    const text = await getCompletion(prompt, { system: SYSTEM, maxTokens: 768 });
    return NextResponse.json({ questions: text.trim() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
