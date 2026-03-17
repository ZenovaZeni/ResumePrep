import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase.rpc("pg_catalog.to_regclass" as never, {
      relname: "public.profiles",
    } as never);

    if (error) {
      // Fallback: try selecting from the table
      const { error: selectError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .limit(1);

      if (selectError) {
        return NextResponse.json({
          ok: false,
          error: selectError.message,
          hint: "The profiles table doesn't exist or is not visible to PostgREST. Run supabase/fix_profiles.sql in your Supabase SQL Editor.",
          project_url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not set",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: "profiles table is accessible",
      rpc_result: data,
      project_url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not set",
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    }, { status: 500 });
  }
}
