import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { resume_id, name } = body as { resume_id: string; name: string };
  if (!resume_id || !name) {
    return NextResponse.json(
      { error: "resume_id and name required" },
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

  const { data: newResume, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      name: name.trim(),
      resume_data: resume.resume_data,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: newResume.id });
}
