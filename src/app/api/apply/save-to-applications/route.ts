import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { CoverLetterModel } from "@/lib/ai";

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
    tailored_resume,
    cover_letter,
    ats_score,
    ats_feedback,
  } = body as {
    variant_id: string;
    document_id: string;
    company_name: string;
    job_title: string;
    job_description?: string | null;
    match_summary?: unknown;
    interview_prep?: unknown;
    tailored_resume?: unknown;
    cover_letter?: CoverLetterModel | null;
    ats_score?: number | null;
    ats_feedback?: unknown;
  };

  if (!variant_id || !document_id || !company_name?.trim() || !job_title?.trim()) {
    return NextResponse.json(
      { error: "variant_id, document_id, company_name, and job_title required" },
      { status: 400 }
    );
  }

  // Fetch the variant's resume data if not passed directly
  let resolvedTailoredResume = tailored_resume ?? null;
  if (!resolvedTailoredResume && variant_id) {
    const { data: variantRow } = await supabase
      .from("resume_variants")
      .select("resume_data")
      .eq("id", variant_id)
      .single();
    if (variantRow) resolvedTailoredResume = variantRow.resume_data;
  }

  // Step 1: Insert with only the guaranteed base columns (always exist).
  // This succeeds even if the kit-column migration hasn't been applied yet.
  const { data: app, error: appErr } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      company_name: company_name.trim(),
      job_title: job_title.trim(),
      job_description: job_description?.trim() ?? null,
      status: "saved",
      source: "quick_apply",
    })
    .select("id")
    .single();

  if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 });

  // Step 2: Update with kit columns. These may not exist if the migration hasn't run.
  // We try all at once; if the DB is already up-to-date this succeeds. If not, we
  // silently continue so the save itself isn't blocked.
  const kitUpdate: Record<string, unknown> = {};
  if (match_summary !== undefined) kitUpdate.match_summary = match_summary ?? null;
  if (interview_prep !== undefined) kitUpdate.interview_prep = interview_prep ?? null;
  if (resolvedTailoredResume !== undefined) kitUpdate.tailored_resume = resolvedTailoredResume ?? null;
  if (cover_letter !== undefined) kitUpdate.cover_letter = cover_letter ?? null;
  if (typeof ats_score === "number") kitUpdate.ats_score = ats_score;
  if (ats_feedback !== undefined) kitUpdate.ats_feedback = ats_feedback ?? null;

  if (Object.keys(kitUpdate).length > 0) {
    // Non-blocking: we don't return an error if this fails (migration not yet applied)
    await supabase
      .from("applications")
      .update(kitUpdate)
      .eq("id", app.id)
      .eq("user_id", user.id);
  }

  // Link variant to this application
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

  // Link generated document to this application
  await supabase
    .from("generated_documents")
    .update({ application_id: app.id })
    .eq("id", document_id)
    .eq("user_id", user.id);

  return NextResponse.json({ applicationId: app.id });
}
