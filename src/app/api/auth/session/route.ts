import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const configured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function GET() {
  if (!configured) {
    return NextResponse.json({ configured: false, hasUser: false });
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return NextResponse.json({ configured: true, hasUser: Boolean(user) });
  } catch {
    return NextResponse.json({ configured: true, hasUser: false });
  }
}
