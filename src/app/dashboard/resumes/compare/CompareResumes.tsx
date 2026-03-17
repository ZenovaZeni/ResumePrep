"use client";

import type { ResumeData } from "@/types/resume";

interface CompareResumesProps {
  baseName: string;
  variantName: string;
  baseData: unknown;
  variantData: unknown;
}

function resumeToText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const o = data as Record<string, unknown>;
  const parts: string[] = [];
  const contact = o.contact as Record<string, string> | undefined;
  if (contact?.name) parts.push(contact.name);
  if (typeof o.summary === "string") parts.push("Summary:", o.summary);
  const exp = o.experience as Array<{ company: string; role: string; bullets?: string[] }> | undefined;
  if (Array.isArray(exp)) {
    for (const e of exp) {
      parts.push(`${e.role} at ${e.company}`);
      for (const b of e.bullets ?? []) parts.push(`• ${b}`);
    }
  }
  const skills = o.skills as string[] | undefined;
  if (Array.isArray(skills)) parts.push("Skills:", skills.join(", "));
  return parts.join("\n");
}

export function CompareResumes({
  baseName,
  variantName,
  baseData,
  variantData,
}: CompareResumesProps) {
  const baseText = resumeToText(baseData);
  const variantText = resumeToText(variantData);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">{baseName}</h2>
        <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-sans max-h-[60vh] overflow-auto">
          {baseText || "(empty)"}
        </pre>
      </div>
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">{variantName}</h2>
        <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-sans max-h-[60vh] overflow-auto">
          {variantText || "(empty)"}
        </pre>
      </div>
    </div>
  );
}
