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
  const { slug } = body as { slug: string | null };
  const value = slug === "" || slug == null ? null : String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (value !== null && value.length < 3) {
    return NextResponse.json(
      { error: "Slug must be at least 3 characters" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("resumes")
    .update({ slug: value, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slug: value });
}
