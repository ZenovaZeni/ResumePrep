import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { tailorResume, generateCoverLetter } from "@/lib/ai";
import { getDisplayName } from "@/lib/profile";
import { FREE_COVER_LETTERS_PER_MONTH, isPro } from "@/lib/tier";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      job_description,
      job_title,
      company_name,
      resume_id: resumeIdParam,
      save_to_applications,
    } = body as {
      job_description: string;
      job_title?: string;
      company_name?: string;
      resume_id?: string;
      save_to_applications?: boolean;
    };
    if (!job_description?.trim()) {
      return NextResponse.json(
        { error: "job_description is required" },
        { status: 400 }
      );
    }
    const company = (company_name ?? "Company").trim() || "Company";
    const title = (job_title ?? "Role").trim() || "Role";

    const { data: resumes } = await supabase
      .from("resumes")
      .select("id, resume_data")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);
    const resume = resumeIdParam
      ? (await supabase.from("resumes").select("id, resume_data").eq("id", resumeIdParam).eq("user_id", user.id).single()).data
      : resumes?.[0];
    if (!resume) {
      return NextResponse.json(
        { error: "No resume found. Create a resume first." },
        { status: 400 }
      );
    }

    let applicationId: string | null = null;
    if (save_to_applications) {
      const { data: app, error: appErr } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          company_name: company,
          job_title: title,
          job_description: job_description.trim(),
          status: "saved",
          source: "quick_apply",
        })
        .select("id")
        .single();
      if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 });
      applicationId = app.id;
    }

    const { data: career } = await supabase
      .from("career_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const tailoredJson = await tailorResume(
      resume.resume_data,
      career ?? {},
      job_description.trim()
    );
    let tailoredData: unknown;
    try {
      tailoredData = JSON.parse(tailoredJson);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for tailored resume" },
        { status: 500 }
      );
    }

    const { data: variant, error: variantErr } = await supabase
      .from("resume_variants")
      .insert({
        resume_id: resume.id,
        job_application_id: applicationId,
        name: applicationId ? "Tailored – application" : "Tailored – job",
        resume_data: tailoredData,
      })
      .select("id")
      .single();
    if (variantErr) return NextResponse.json({ error: variantErr.message }, { status: 500 });
    const variantId = variant.id;

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
          {
            error: `Free tier limited to ${FREE_COVER_LETTERS_PER_MONTH} cover letters per month. Upgrade to Pro for unlimited.`,
          },
          { status: 403 }
        );
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .single();
    const profileForAI = {
      name: getDisplayName(profile),
      email: user.email ?? "",
      ...career,
    };
    const coverLetterContent = await generateCoverLetter(
      profileForAI,
      job_description.trim(),
      company,
      title
    );

    const { data: doc, error: docErr } = await supabase
      .from("generated_documents")
      .insert({
        user_id: user.id,
        type: "cover_letter",
        application_id: applicationId,
        content: coverLetterContent,
      })
      .select("id")
      .single();
    if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 });

    return NextResponse.json({
      tailoredResumeData: tailoredData,
      coverLetter: coverLetterContent,
      applicationId: applicationId ?? undefined,
      variantId,
      documentId: doc.id,
      resumeId: resume.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
