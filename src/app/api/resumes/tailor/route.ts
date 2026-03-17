import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { tailorResume } from "@/lib/ai";

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

    const { data: variant, error } = await supabase
      .from("resume_variants")
      .insert({
        resume_id,
        job_application_id: application_id ?? null,
        name: `Tailored – ${application_id ? "application" : "job"}`,
        resume_data: tailoredData,
      })
      .select("id, resume_data")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ variantId: variant.id, resume_data: variant.resume_data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
