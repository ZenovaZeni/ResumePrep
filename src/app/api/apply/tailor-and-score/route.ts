import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { tailorResume, scoreResume } from "@/lib/ai";

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
    const { resume_id, job_description, application_id } = body as {
      resume_id: string;
      job_description: string;
      application_id?: string;
    };
    if (!resume_id || !job_description) {
      return NextResponse.json(
        { error: "resume_id and job_description required" },
        { status: 400 }
      );
    }

    const { data: resume } = await supabase
      .from("resumes")
      .select("resume_data")
      .eq("id", resume_id)
      .eq("user_id", user.id)
      .single();
    if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

    const { data: career } = await supabase
      .from("career_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const tailoredJson = await tailorResume(
      resume.resume_data,
      career ?? {},
      job_description
    );
    let tailoredData: unknown;
    try {
      tailoredData = JSON.parse(tailoredJson);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for tailored resume" },
        { status: 500 }
      );
    }

    const { data: variant, error: variantErr } = await supabase
      .from("resume_variants")
      .insert({
        resume_id,
        job_application_id: application_id ?? null,
        name: application_id ? "Tailored – application" : "Tailored – job",
        resume_data: tailoredData,
      })
      .select("id, resume_data")
      .single();
    if (variantErr) return NextResponse.json({ error: variantErr.message }, { status: 500 });

    const text = resumeToText(tailoredData);
    const { score, feedback } = await scoreResume(text, job_description);

    // Persist ATS score + tailored resume snapshot on the application row.
    // Non-blocking: silently swallowed if kit columns don't exist yet.
    if (application_id) {
      await supabase
        .from("applications")
        .update({
          ats_score: score,
          ats_feedback: { feedback },
          tailored_resume: tailoredData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", application_id)
        .eq("user_id", user.id)
        .then(() => null);
    }

    return NextResponse.json({
      variantId: variant.id,
      resume_data: variant.resume_data,
      score,
      feedback,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
