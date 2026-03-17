"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ResumeData } from "@/types/resume";

type Template = { id: string; label: string };

interface ResumeNewFormProps {
  profile: Record<string, unknown>;
  templates: readonly Template[];
}

export function ResumeNewForm({ profile, templates }: ResumeNewFormProps) {
  const router = useRouter();
  const [template, setTemplate] = useState(templates[0]?.id ?? "professional");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/resumes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, template }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? res.statusText);
      }
      const { resumeId } = (await res.json()) as { resumeId: string };
      router.push(`/dashboard/resumes/${resumeId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate resume");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Template</label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="button"
        onClick={handleCreate}
        disabled={generating}
        className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
      >
        {generating ? "Generating…" : "Generate resume from profile"}
      </button>
    </div>
  );
}
