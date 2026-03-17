import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { suggestBullets } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { role, company, existingBullets } = body as {
      role?: string;
      company?: string;
      existingBullets?: string[];
    };
    if (!role || typeof role !== "string") {
      return NextResponse.json({ error: "role required" }, { status: 400 });
    }

    const bullets = await suggestBullets(
      role,
      typeof company === "string" ? company : undefined,
      Array.isArray(existingBullets) ? existingBullets : undefined
    );
    return NextResponse.json({ bullets });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
