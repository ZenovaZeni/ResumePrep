import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { document_id, content } = body as { document_id: string; content: string };

    if (!document_id || typeof content !== "string") {
      return NextResponse.json(
        { error: "document_id and content are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("generated_documents")
      .update({ content })
      .eq("id", document_id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
