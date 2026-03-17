import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { interview_type, role_context } = body as {
    interview_type: "behavioral" | "technical" | "situational";
    role_context?: string;
  };
  if (!interview_type) {
    return NextResponse.json({ error: "interview_type required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: user.id,
      interview_type,
      role_context: role_context ?? null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessionId: data.id });
}
