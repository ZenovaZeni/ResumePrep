import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { CareerSuggestionItem } from "@/types/career";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase
      .from("saved_careers")
      .select("id, title, career_data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ saved: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const career = body as CareerSuggestionItem;
    if (!career?.title || typeof career.title !== "string") {
      return NextResponse.json({ error: "Career object with title required" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("saved_careers")
      .upsert(
        { user_id: user.id, title: career.title, career_data: career },
        { onConflict: "user_id,title" }
      )
      .select("id, title, created_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
