import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { improveBullet } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { bullet, roleContext } = body as { bullet?: string; roleContext?: string };
    if (!bullet || typeof bullet !== "string") {
      return NextResponse.json({ error: "bullet required" }, { status: 400 });
    }

    const improved = await improveBullet(bullet, roleContext);
    return NextResponse.json({ improved: improved.trim() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
