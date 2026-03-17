import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateResumeFromProfile } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { profile, template } = body as { profile: Record<string, unknown>; template: string };
    if (!profile || !template) {
      return NextResponse.json({ error: "profile and template required" }, { status: 400 });
    }
    const rawJson = await generateResumeFromProfile({
      profile: profile as Parameters<typeof generateResumeFromProfile>[0]["profile"],
      template: String(template),
    });
    let resumeData: unknown;
    try {
      resumeData = JSON.parse(rawJson);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for resume" },
        { status: 500 }
      );
    }
    const name = `Resume – ${template}`;
    const { data: resume, error } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        name,
        resume_data: resumeData,
      })
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ resumeId: resume.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
