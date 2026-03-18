import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    variant_id,
    document_id,
    company_name,
    job_title,
    job_description,
    match_summary,
    interview_prep,
  } = body as {
    variant_id: string;
    document_id: string;
    company_name: string;
    job_title: string;
    job_description?: string | null;
    match_summary?: unknown;
    interview_prep?: unknown;
  };
  if (!variant_id || !document_id || !company_name?.trim() || !job_title?.trim()) {
    return NextResponse.json(
      { error: "variant_id, document_id, company_name, and job_title required" },
      { status: 400 }
    );
  }

  const { data: app, error: appErr } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      company_name: company_name.trim(),
      job_title: job_title.trim(),
      job_description: job_description?.trim() ?? null,
      status: "saved",
      source: "quick_apply",
      match_summary: match_summary ?? null,
      interview_prep: interview_prep ?? null,
    })
    .select("id")
    .single();
  if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 });

  const { data: variantRow } = await supabase
    .from("resume_variants")
    .select("resume_id")
    .eq("id", variant_id)
    .single();
  if (variantRow) {
    const { data: resumeRow } = await supabase
      .from("resumes")
      .select("user_id")
      .eq("id", variantRow.resume_id)
      .single();
    if (resumeRow?.user_id === user.id) {
      await supabase
        .from("resume_variants")
        .update({ job_application_id: app.id })
        .eq("id", variant_id);
    }
  }

  await supabase
    .from("generated_documents")
    .update({ application_id: app.id })
    .eq("id", document_id)
    .eq("user_id", user.id);

  return NextResponse.json({ applicationId: app.id });
}
