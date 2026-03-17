import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
  } = body as {
    company_name: string;
    job_title: string;
    job_description?: string | null;
    job_url?: string | null;
    date_applied?: string | null;
    status?: string;
    notes?: string | null;
  };
  if (!company_name || !job_title) {
    return NextResponse.json(
      { error: "company_name and job_title required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      company_name,
      job_title,
      job_description: job_description ?? null,
      job_url: job_url ?? null,
      date_applied: date_applied ?? null,
      status: status ?? "saved",
      notes: notes ?? null,
      source: "web",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
