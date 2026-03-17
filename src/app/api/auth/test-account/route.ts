import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "TestPassword123!";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      {
        error: "Missing SUPABASE_SERVICE_ROLE_KEY",
        hint: "Add it to .env.local from Supabase Dashboard → Settings → API → service_role (secret)",
      },
      { status: 400 }
    );
  }
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: "Test", last_name: "User" },
    });
    if (error) {
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        return NextResponse.json({ created: false, message: "Test user already exists; use login with test account." });
      }
      return NextResponse.json({ created: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ created: true, email: data.user?.email });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ created: false, error: message }, { status: 500 });
  }
}
