import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/ai";
import { FREE_COVER_LETTERS_PER_MONTH, isPro } from "@/lib/tier";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("tier")
      .eq("user_id", user.id)
      .single();
    if (!isPro(profileRow?.tier)) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("generated_documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "cover_letter")
        .gte("created_at", startOfMonth.toISOString());
      if ((count ?? 0) >= FREE_COVER_LETTERS_PER_MONTH) {
        return NextResponse.json(
          { error: `Free tier limited to ${FREE_COVER_LETTERS_PER_MONTH} cover letters per month. Upgrade to Pro for unlimited.` },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      job_description,
      company_name,
      job_title,
      application_id,
      highlight,
    } = body as {
      job_description: string;
      company_name: string;
      job_title: string;
      application_id?: string;
      highlight?: string;
    };
    if (!job_description || !company_name || !job_title) {
      return NextResponse.json(
        { error: "job_description, company_name, and job_title required" },
        { status: 400 }
      );
    }

    const [{ data: profile }, { data: career }, resumeResult] = await Promise.all([
      supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single(),
      supabase.from("career_profiles").select("*").eq("user_id", user.id).single(),
      supabase
        .from("resumes")
        .select("resume_data")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);
    const { getDisplayName } = await import("@/lib/profile");
    const latestResume = resumeResult.data?.[0]?.resume_data ?? null;
    const profileForAI = {
      name: getDisplayName(profile),
      email: user.email,
      ...career,
      ...(latestResume ? { resume: latestResume } : {}),
    };

    const content = await generateCoverLetter(
      profileForAI,
      job_description,
      company_name,
      job_title,
      highlight
    );

    const { data: doc, error } = await supabase
      .from("generated_documents")
      .insert({
        user_id: user.id,
        type: "cover_letter",
        application_id: application_id ?? null,
        content,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ content, documentId: doc.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
