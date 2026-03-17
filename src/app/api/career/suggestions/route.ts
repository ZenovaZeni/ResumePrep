import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCareerSuggestions } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { target_role } = body as { target_role?: string };

    const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single();
    const { data: career } = await supabase.from("career_profiles").select("*").eq("user_id", user.id).single();
    const { getDisplayName } = await import("@/lib/profile");
    const profileForAI = {
      name: getDisplayName(profile),
      email: user.email,
      ...career,
    };

    const content = await getCareerSuggestions(profileForAI, target_role);

    await supabase.from("career_suggestions").insert({
      user_id: user.id,
      content: { text: content, target_role: target_role ?? null },
    });

    return NextResponse.json({ content });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
