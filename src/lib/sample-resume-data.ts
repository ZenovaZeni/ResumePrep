import type { ResumeData } from "@/types/resume";

/** Sample resume used for previews on the Resumes list page. */
export const SAMPLE_RESUME_DATA: ResumeData = {
  contact: {
    name: "Jordan Smith",
    email: "jordan.smith@email.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/jordansmith",
  },
  summary:
    "Senior Software Engineer with 6+ years building scalable web applications. Led migration to serverless architecture, reducing infra costs by 40%. Strong in TypeScript, React, Node.js, and AWS.",
  experience: [
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
  education: [
    {
      school: "State University",
      degree: "B.S. Computer Science",
      field: "Computer Science",
      start: "2014",
      end: "2018",
    },
  ],
  skills: ["TypeScript", "React", "Node.js", "AWS", "PostgreSQL", "GraphQL", "REST APIs", "CI/CD"],
  certifications: ["AWS Certified Developer – Associate"],
  projects: [
    {
      name: "Open-Source CLI Tool",
      description: "Developer tool for local API testing. 2k+ GitHub stars.",
      url: "https://github.com/example/cli",
      bullets: ["Built with Node.js and TypeScript", "Published to npm with 50k weekly downloads"],
    },
  ],
  achievements: ["Won internal hackathon 2022", "Speaker at local React meetup"],
};
