import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SAMPLE_PROFILE = {
  first_name: "Jordan",
  last_name: "Smith",
};

const SAMPLE_CAREER = {
  headline: "Senior Software Engineer | Full-Stack & Cloud",
  summary:
    "Software engineer with 6+ years building scalable web applications. Led migration to serverless architecture, reducing infra costs by 40%. Strong in TypeScript, React, Node.js, and AWS.",
  target_roles: ["Senior Software Engineer", "Tech Lead", "Full-Stack Developer"],
  career_goals: "Move into a tech lead or staff engineer role within 2 years.",
  raw_experience: [
    {
      company: "TechCorp Inc",
      role: "Senior Software Engineer",
      location: "San Francisco, CA",
      start: "2021",
      end: "Present",
      bullets: [
        "Led migration of legacy monolith to serverless microservices, cutting infrastructure costs by 40%.",
        "Mentored 4 junior engineers and established front-end best practices adopted across 3 teams.",
        "Shipped real-time collaboration features used by 50k+ monthly active users.",
      ],
    },
    {
      company: "StartupXYZ",
      role: "Software Engineer",
      location: "Remote",
      start: "2018",
      end: "2021",
      bullets: [
        "Built and maintained React/Node.js product used by 10k+ customers.",
        "Implemented CI/CD pipelines and reduced deployment time from 2 hours to 15 minutes.",
        "Collaborated with design and product to ship 20+ features per quarter.",
      ],
    },
  ],
  skills: ["TypeScript", "React", "Node.js", "AWS", "PostgreSQL", "GraphQL", "REST APIs"],
  certifications: [],
  education: [
    {
      school: "State University",
      degree: "B.S. Computer Science",
      field: "Computer Science",
      start: "2014",
      end: "2018",
    },
  ],
  projects: [
    {
      name: "Open-Source CLI Tool",
      description: "Developer tool for local API testing. 2k+ GitHub stars.",
      url: "https://github.com/example/cli",
      bullets: ["Built with Node.js and TypeScript", "Published to npm with 50k weekly downloads"],
    },
  ],
  achievements: ["Won internal hackathon 2022", "Speaker at local React meetup"],
  metrics: {},
};

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (user.email !== "test@example.com") {
      return NextResponse.json(
        { error: "Sample data is only available for the test account (test@example.com)." },
        { status: 403 }
      );
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        first_name: SAMPLE_PROFILE.first_name,
        last_name: SAMPLE_PROFILE.last_name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (profileError) {
      return NextResponse.json(
        { error: `Profiles: ${profileError.message}. (Check Supabase is connected and RLS allows your user.)` },
        { status: 400 }
      );
    }

    const { error: careerError } = await supabase.from("career_profiles").upsert(
      {
        user_id: user.id,
        headline: SAMPLE_CAREER.headline,
        summary: SAMPLE_CAREER.summary,
        target_roles: SAMPLE_CAREER.target_roles,
        career_goals: SAMPLE_CAREER.career_goals,
        raw_experience: SAMPLE_CAREER.raw_experience,
        skills: SAMPLE_CAREER.skills,
        certifications: SAMPLE_CAREER.certifications,
        education: SAMPLE_CAREER.education,
        projects: SAMPLE_CAREER.projects,
        achievements: SAMPLE_CAREER.achievements,
        metrics: SAMPLE_CAREER.metrics,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (careerError) {
      return NextResponse.json(
        { error: `Career profile: ${careerError.message}. (Check Supabase is connected and RLS allows your user.)` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, message: "Sample data loaded." });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: `Seed failed: ${message}` }, { status: 500 });
  }
}
