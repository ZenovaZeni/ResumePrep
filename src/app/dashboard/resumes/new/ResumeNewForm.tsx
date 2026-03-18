"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LAYOUT_TEMPLATES = [
  {
    id: "clean",
    label: "Clean",
    description: "Modern minimal — generous white space, clean hierarchy, single column",
  },
  {
    id: "professional",
    label: "Professional",
    description: "Traditional — clear section separators, classic typographic hierarchy",
  },
  {
    id: "compact",
    label: "Compact",
    description: "Dense — maximises content per page, tighter spacing, smaller type scale",
  },
] as const;

type LayoutTemplateId = (typeof LAYOUT_TEMPLATES)[number]["id"];

interface ResumeNewFormProps {
  profile: Record<string, unknown>;
}

export function ResumeNewForm({ profile }: ResumeNewFormProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<LayoutTemplateId>("clean");
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
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">Choose a layout</label>
        <div className="grid gap-3">
          {LAYOUT_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                template === t.id
                  ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500"
                  : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500"
              }`}
            >
              <span className="block font-semibold text-white">{t.label}</span>
              <span className="block text-sm text-zinc-400 mt-0.5">{t.description}</span>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="button"
        onClick={handleCreate}
        disabled={generating}
        className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        {generating ? "Generating…" : "Generate resume from profile"}
      </button>
    </div>
  );
}
