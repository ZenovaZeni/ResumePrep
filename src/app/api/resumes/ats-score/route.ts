import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { scoreResume } from "@/lib/ai";

function resumeToText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const o = data as Record<string, unknown>;
  const parts: string[] = [];
  const contact = o.contact as Record<string, string> | undefined;
  if (contact?.name) parts.push(contact.name);
  if (contact?.email) parts.push(contact.email);
  if (typeof o.summary === "string") parts.push(o.summary);
  const exp = o.experience as Array<{ company: string; role: string; start: string; end: string; bullets?: string[] }> | undefined;
  if (Array.isArray(exp)) {
    for (const e of exp) {
      parts.push(`${e.role} at ${e.company} (${e.start} – ${e.end})`);
      for (const b of e.bullets ?? []) parts.push(b);
    }
  }
  const edu = o.education as Array<{ school: string; degree: string; start: string; end: string }> | undefined;
  if (Array.isArray(edu)) {
    for (const e of edu) parts.push(`${e.degree}, ${e.school} (${e.start} – ${e.end})`);
  }
  const skills = o.skills as string[] | undefined;
  if (Array.isArray(skills)) parts.push(skills.join(", "));
  return parts.join("\n");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { resume_id, resume_data, job_description } = body as {
      resume_id?: string;
      resume_data?: unknown;
      job_description?: string;
    };
    let text: string;
    if (resume_data) {
      text = resumeToText(resume_data);
    } else if (resume_id) {
      const { data: resume } = await supabase
        .from("resumes")
        .select("resume_data")
        .eq("id", resume_id)
        .eq("user_id", user.id)
        .single();
      if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });
      text = resumeToText(resume.resume_data);
    } else {
      return NextResponse.json(
        { error: "resume_id or resume_data required" },
        { status: 400 }
      );
    }
    const result = await scoreResume(text, job_description);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
