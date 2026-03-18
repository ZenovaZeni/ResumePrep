import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateResumeFromProfile } from "@/lib/ai";
import type { ResumeData } from "@/types/resume";

/**
 * Grounding check: ensure the AI did not invent companies, schools, or skills
 * that were not in the original profile. Strips hallucinated entries.
 */
function applyGrounding(
  generated: ResumeData,
  profile: Parameters<typeof generateResumeFromProfile>[0]["profile"]
): ResumeData {
  const result = { ...generated };

  // Enforce contact comes from profile only
  result.contact = {
    name: profile.contact?.name ?? generated.contact?.name ?? "",
    email: profile.contact?.email ?? generated.contact?.email ?? "",
    phone: profile.contact?.phone ?? generated.contact?.phone ?? "",
    location: profile.contact?.location ?? generated.contact?.location ?? "",
    linkedin: profile.contact?.linkedin ?? generated.contact?.linkedin ?? "",
    website: profile.contact?.website ?? generated.contact?.website ?? "",
  };
  // Remove empty strings so we don't pollute the preview
  (Object.keys(result.contact) as Array<keyof typeof result.contact>).forEach((k) => {
    if (!result.contact![k]) delete result.contact![k];
  });

  // Enforce experience: only entries whose company matches profile exactly
  if (Array.isArray(profile.experience) && profile.experience.length > 0) {
    const allowedCompanies = new Set(profile.experience.map((e) => e.company.trim().toLowerCase()));
    result.experience = (generated.experience ?? []).filter((exp) =>
      allowedCompanies.has(exp.company.trim().toLowerCase())
    );
    // Preserve profile dates/company/role; only allow bullet rewrites
    result.experience = result.experience.map((genExp) => {
      const src = profile.experience!.find(
        (p) => p.company.trim().toLowerCase() === genExp.company.trim().toLowerCase()
      );
      if (!src) return genExp;
      return {
        ...genExp,
        company: src.company,
        role: src.role,
        start: src.start,
        end: src.end,
      };
    });
  } else {
    result.experience = [];
  }

  // Enforce education: only entries whose school matches profile exactly
  if (Array.isArray(profile.education) && profile.education.length > 0) {
    const allowedSchools = new Set(profile.education.map((e) => e.school.trim().toLowerCase()));
    result.education = (generated.education ?? []).filter((edu) =>
      allowedSchools.has(edu.school.trim().toLowerCase())
    );
    result.education = result.education.map((genEdu) => {
      const src = profile.education!.find(
        (p) => p.school.trim().toLowerCase() === genEdu.school.trim().toLowerCase()
      );
      if (!src) return genEdu;
      return { ...genEdu, school: src.school, degree: src.degree, start: src.start, end: src.end };
    });
  } else {
    result.education = [];
  }

  // Enforce skills: only skills present in profile
  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    const allowedSkills = new Set(profile.skills.map((s) => s.trim().toLowerCase()));
    result.skills = (generated.skills ?? []).filter((s) =>
      allowedSkills.has(s.trim().toLowerCase())
    );
    // If AI stripped too many, fall back to all profile skills
    if (result.skills.length === 0) result.skills = [...profile.skills];
  } else {
    result.skills = [];
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { profile, template } = body as { profile: Record<string, unknown>; template: string };
    if (!profile || !template) {
      return NextResponse.json({ error: "profile and template required" }, { status: 400 });
    }
    const profileInput = profile as Parameters<typeof generateResumeFromProfile>[0]["profile"];
    const rawJson = await generateResumeFromProfile({
      profile: profileInput,
      template: String(template),
    });
    let resumeData: ResumeData;
    try {
      resumeData = JSON.parse(rawJson) as ResumeData;
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for resume" },
        { status: 500 }
      );
    }

    // Apply grounding: strip any content the AI invented that wasn't in the profile
    resumeData = applyGrounding(resumeData, profileInput);

    // Preserve the chosen layout template in the design field
    const layoutTemplateId = ["clean", "minimal", "professional", "modern", "compact"].includes(String(template))
      ? String(template)
      : "clean";
    resumeData.design = { templateId: layoutTemplateId as ResumeData["design"]["templateId"], fontFamily: "sans" };

    const name = `Resume – ${layoutTemplateId.charAt(0).toUpperCase() + layoutTemplateId.slice(1)}`;
    const { data: resume, error } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        name,
        resume_data: resumeData,
      })
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ resumeId: resume.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
