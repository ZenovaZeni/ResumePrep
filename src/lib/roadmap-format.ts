export type RoadmapStep = {
  title: string;
  description: string;
  timeline: string;
  resumeTip: string;
};

export function roadmapToText({
  title,
  timelineYears,
  steps,
}: {
  title: string;
  timelineYears?: number | null;
  steps: RoadmapStep[];
}): string {
  const header = `Career Roadmap: ${title}`;
  const sub = timelineYears ? `Timeline: ${timelineYears} year${timelineYears === 1 ? "" : "s"}` : "";
  const lines: string[] = [header, "=".repeat(header.length), ...(sub ? [sub] : []), ""];

  steps.forEach((s, i) => {
    lines.push(`Step ${i + 1}: ${s.title}${s.timeline ? `  [${s.timeline}]` : ""}`);
    if (s.description) lines.push(s.description);
    if (s.resumeTip) lines.push(`Resume tip: ${s.resumeTip}`);
    lines.push("");
  });

  return lines.join("\n").trimEnd();
}
