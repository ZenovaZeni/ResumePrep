import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { suggestBullets, improveBullet } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { role, company, existing_bullets, mode } = body as {
      role: string;
      company?: string;
      existing_bullets?: string[];
      mode?: "suggest" | "improve";
    };

    if (!role?.trim()) {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
    }

    if (mode === "improve" && existing_bullets?.length) {
      // Improve each existing bullet
      const improved = await Promise.all(
        existing_bullets.map((b) => improveBullet(b, role))
      );
      return NextResponse.json({ bullets: improved });
    }

    // Suggest new bullets
    const bullets = await suggestBullets(role, company, existing_bullets);
    return NextResponse.json({ bullets });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
