import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { tailorResume, generateCoverLetter, analyzeMatch } from "@/lib/ai";
import { getDisplayName } from "@/lib/profile";
import { FREE_COVER_LETTERS_PER_MONTH, isPro } from "@/lib/tier";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      return NextResponse.json({ error: "job_description is required" }, { status: 400 });
    }

    const company = (company_name ?? "Company").trim() || "Company";
    const title = (job_title ?? "Role").trim() || "Role";

    // Fetch resume, career profile, and user profile in parallel
    const [resumeResult, careerResult, profileResult] = await Promise.all([
      resumeIdParam
        ? supabase
            .from("resumes")
            .select("id, resume_data")
            .eq("id", resumeIdParam)
            .eq("user_id", user.id)
            .single()
        : supabase
            .from("resumes")
            .select("id, resume_data")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .then((r) => ({ data: r.data?.[0] ?? null, error: r.error })),
      supabase.from("career_profiles").select("*").eq("user_id", user.id).single(),
      supabase
        .from("profiles")
        .select("first_name, last_name, tier")
        .eq("user_id", user.id)
        .single(),
    ]);

    const resume = resumeResult.data;
    if (!resume) {
      return NextResponse.json(
        { error: "No resume found. Create a resume first." },
        { status: 400 }
      );
    }

    const career = careerResult.data;
    const profileData = profileResult.data;

    // Check tier limits before generating cover letter
    if (!isPro(profileData?.tier)) {
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

    // Optionally pre-create the application row
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

    // Assemble the profile object the AI uses — include resume data so the
    // cover letter can reference real bullets, companies, and metrics
    const profileForAI = {
      name: getDisplayName(profileData),
      email: user.email ?? "",
      ...career,
      resume: resume.resume_data,
    };

    // Run all three AI calls in parallel — analyzeMatch failure is non-fatal
    const [tailoredResult, coverLetterResult, matchResult] = await Promise.allSettled([
      tailorResume(resume.resume_data, career ?? {}, job_description.trim()),
      generateCoverLetter(profileForAI, job_description.trim(), company, title),
      analyzeMatch(profileForAI, job_description.trim(), title, company),
    ]);

    if (tailoredResult.status === "rejected") {
      return NextResponse.json(
        { error: tailoredResult.reason instanceof Error ? tailoredResult.reason.message : "Resume tailoring failed" },
        { status: 500 }
      );
    }
    if (coverLetterResult.status === "rejected") {
      return NextResponse.json(
        { error: coverLetterResult.reason instanceof Error ? coverLetterResult.reason.message : "Cover letter generation failed" },
        { status: 500 }
      );
    }

    const tailoredJson = tailoredResult.value;
    const coverLetterContent = coverLetterResult.value;
    const matchSummary = matchResult.status === "fulfilled" ? matchResult.value : null;

    let tailoredData: unknown;
    try {
      tailoredData = JSON.parse(tailoredJson);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for tailored resume" },
        { status: 500 }
      );
    }

    // Write variant and document in parallel, also persist match summary on the application row
    const [variantRes, docRes] = await Promise.all([
      supabase
        .from("resume_variants")
        .insert({
          resume_id: resume.id,
          job_application_id: applicationId,
          name: applicationId ? "Tailored – application" : "Tailored – job",
          resume_data: tailoredData,
        })
        .select("id")
        .single(),
      supabase
        .from("generated_documents")
        .insert({
          user_id: user.id,
          type: "cover_letter",
          application_id: applicationId,
          content: coverLetterContent,
        })
        .select("id")
        .single(),
    ]);

    if (applicationId && matchSummary) {
      await supabase
        .from("applications")
        .update({ match_summary: matchSummary })
        .eq("id", applicationId)
        .eq("user_id", user.id);
    }

    if (variantRes.error) {
      return NextResponse.json({ error: variantRes.error.message }, { status: 500 });
    }
    if (docRes.error) {
      return NextResponse.json({ error: docRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      tailoredResumeData: tailoredData,
      coverLetter: coverLetterContent,
      applicationId: applicationId ?? undefined,
      variantId: variantRes.data.id,
      documentId: docRes.data.id,
      resumeId: resume.id,
      matchSummary,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
