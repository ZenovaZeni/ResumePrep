import type { CareerSuggestionItem } from "@/types/career";

const FIELDS: { key: keyof CareerSuggestionItem; label: string }[] = [
  { key: "title", label: "Career" },
  { key: "salary_range", label: "Salary range" },
  { key: "education_needed", label: "Education needed" },
  { key: "cost_to_become", label: "Cost to get there" },
  { key: "time_to_qualify", label: "Time to qualify" },
  { key: "demand", label: "Demand" },
  { key: "daily_life", label: "Daily life" },
  { key: "tips_to_get_job", label: "Tips to get the job" },
  { key: "why_fit", label: "Why it fits you" },
];

type CareerExtras =
  | string
  | {
      moreDetail?: string;
      resumeBullets?: string;
      interviewQuestions?: string;
    };

export function careerToText(career: CareerSuggestionItem, extra?: CareerExtras): string {
  const lines: string[] = [ career.title, "=".repeat(40), "" ];
  for (const { key, label } of FIELDS) {
    if (key === "title") continue;
    const value = career[key];
    if (value && typeof value === "string") {
      lines.push(`${label}:`);
      lines.push(value);
      lines.push("");
    }
  }
  const extrasObj: Exclude<CareerExtras, string> | null =
    typeof extra === "string" ? { moreDetail: extra } : extra ?? null;

  if (extrasObj?.moreDetail?.trim()) {
    lines.push("More detail:");
    lines.push(extrasObj.moreDetail.trim());
    lines.push("");
  }
  if (extrasObj?.resumeBullets?.trim()) {
    lines.push("Resume bullets:");
    lines.push(extrasObj.resumeBullets.trim());
    lines.push("");
  }
  if (extrasObj?.interviewQuestions?.trim()) {
    lines.push("Interview questions:");
    lines.push(extrasObj.interviewQuestions.trim());
    lines.push("");
  }
  return lines.join("\n");
}
