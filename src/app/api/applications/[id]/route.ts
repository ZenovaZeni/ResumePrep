import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    company_name,
    job_title,
    job_description,
    job_url,
    date_applied,
    status,
    notes,
    cover_letter,
    tailored_resume,
    interview_prep,
    ats_score,
    ats_feedback,
    match_summary,
  } = body as Record<string, unknown>;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (company_name !== undefined) updates.company_name = company_name;
  if (job_title !== undefined) updates.job_title = job_title;
  if (job_description !== undefined) updates.job_description = job_description;
  if (job_url !== undefined) updates.job_url = job_url;
  if (date_applied !== undefined) updates.date_applied = date_applied;
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (cover_letter !== undefined) updates.cover_letter = cover_letter;
  if (tailored_resume !== undefined) updates.tailored_resume = tailored_resume;
  if (interview_prep !== undefined) updates.interview_prep = interview_prep;
  if (ats_score !== undefined) updates.ats_score = ats_score;
  if (ats_feedback !== undefined) updates.ats_feedback = ats_feedback;
  if (match_summary !== undefined) updates.match_summary = match_summary;

  const { error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
