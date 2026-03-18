"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ResumeData } from "@/types/resume";
import {
  getDefaultDesign,
  RESUME_VIEW_TEMPLATES,
  DESIGN_FONTS,
  PUBLIC_THEMES,
  canUseResumeTemplate,
} from "@/types/resume";
import type { ResumeDesignTemplateId } from "@/types/resume";
import { PublicResumeContent } from "@/app/r/[slug]/PublicResumeContent";

interface ResumeEditorProps {
  resumeId: string;
  initialData: ResumeData;
  initialSlug?: string | null;
  tier?: "free" | "pro" | null;
  isTestAccount?: boolean;
}

export function ResumeEditor({ resumeId, initialData, initialSlug, tier = "free", isTestAccount = false }: ResumeEditorProps) {
  const router = useRouter();
  const [data, setData] = useState<ResumeData>(initialData);
  const [saving, setSaving] = useState(false);
  const [improvingIndex, setImprovingIndex] = useState<{ exp: number; bullet: number } | null>(null);
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [slugSaving, setSlugSaving] = useState(false);
  const [atsJobDescription, setAtsJobDescription] = useState("");
  const [atsResult, setAtsResult] = useState<{ score: number; feedback: string[] } | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [suggestingExpIndex, setSuggestingExpIndex] = useState<number | null>(null);
  const [suggestedBullets, setSuggestedBullets] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_data: data }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setSaveError(json.error ?? "Could not save resume");
      }
    } catch {
      setSaveError("Network error — changes not saved");
    } finally {
      setSaving(false);
    }
  }, [resumeId, data, router]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      save();
    }, 1500);
    return () => clearTimeout(t);
  }, [data, save]);

  async function improveBullet(expIndex: number, bulletIndex: number) {
    const exp = data.experience?.[expIndex];
    const bullet = exp?.bullets?.[bulletIndex];
    if (!bullet) return;
    setImprovingIndex({ exp: expIndex, bullet: bulletIndex });
    try {
      const res = await fetch("/api/ai/improve-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet }),
      });
      const json = await res.json();
      if (json.improved && data.experience) {
        const next = [...data.experience];
        const nextBullets = [...(next[expIndex]?.bullets ?? [])];
        nextBullets[bulletIndex] = json.improved;
        next[expIndex] = { ...next[expIndex]!, bullets: nextBullets };
        setData({ ...data, experience: next });
      }
    } finally {
      setImprovingIndex(null);
    }
  }

  async function runAtsCheck() {
    setAtsLoading(true);
    setAtsResult(null);
    try {
      const res = await fetch("/api/resumes/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_data: data,
          job_description: atsJobDescription || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && typeof json.score === "number")
        setAtsResult({ score: json.score, feedback: json.feedback ?? [] });
    } finally {
      setAtsLoading(false);
    }
  }

  async function fetchSuggestedBullets(expIndex: number) {
    const exp = data.experience?.[expIndex];
    if (!exp) return;
    setSuggestingExpIndex(expIndex);
    setSuggestLoading(true);
    setSuggestedBullets([]);
    try {
      const res = await fetch("/api/ai/suggest-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: exp.role,
          company: exp.company,
          existingBullets: exp.bullets ?? [],
        }),
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.bullets)) setSuggestedBullets(json.bullets);
    } finally {
      setSuggestLoading(false);
    }
  }

  function addSuggestedBullet(bullet: string) {
    if (suggestingExpIndex == null || !data.experience?.[suggestingExpIndex]) return;
    const next = [...data.experience];
    const nextBullets = [...(next[suggestingExpIndex]?.bullets ?? []), bullet];
    next[suggestingExpIndex] = { ...next[suggestingExpIndex]!, bullets: nextBullets };
    setData((d) => ({ ...d, experience: next }));
    setSuggestedBullets((prev) => prev.filter((b) => b !== bullet));
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        {/* ATS check */}
        <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-2">ATS score</h2>
          <p className="text-xs text-[var(--text-tertiary)] mb-3">See how your resume scores. Optionally paste a job description for role-specific feedback.</p>
          <textarea
            placeholder="Paste job description (optional)"
            value={atsJobDescription}
            onChange={(e) => setAtsJobDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] mb-2"
          />
          <button
            type="button"
            onClick={runAtsCheck}
            disabled={atsLoading}
            className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)] disabled:opacity-50"
          >
            {atsLoading ? "Checking…" : "Run ATS check"}
          </button>
          {atsResult && (
            <div className="mt-4 p-4 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
              <p className="font-medium text-[var(--text-primary)]">Score: {atsResult.score}/100</p>
              {atsResult.feedback.length > 0 && (
                <ul className="mt-2 text-sm text-[var(--text-secondary)] list-disc list-inside space-y-1">
                  {atsResult.feedback.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Contact */}
        <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Contact</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              placeholder="Name"
              value={data.contact?.name ?? ""}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  contact: { ...d.contact, name: e.target.value },
                }))
              }
              className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <input
              placeholder="Email"
              value={data.contact?.email ?? ""}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  contact: { ...d.contact, email: e.target.value },
                }))
              }
              className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <input
              placeholder="Phone"
              value={data.contact?.phone ?? ""}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  contact: { ...d.contact, phone: e.target.value },
                }))
              }
              className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <input
              placeholder="Location"
              value={data.contact?.location ?? ""}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  contact: { ...d.contact, location: e.target.value },
                }))
              }
              className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </section>

        {/* Summary */}
        <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Summary</h2>
          <textarea
            rows={3}
            value={data.summary ?? ""}
            onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </section>

        {/* Experience */}
        {(data.experience ?? []).map((exp, expIndex) => (
          <section key={expIndex} className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-medium text-[var(--text-secondary)]">Experience #{expIndex + 1}</h2>
              <button
                type="button"
                onClick={() => fetchSuggestedBullets(expIndex)}
                disabled={suggestLoading}
                className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-50"
              >
                {suggestLoading ? "…" : "+ Suggest bullets (AI)"}
              </button>
            </div>
            {suggestingExpIndex === expIndex && suggestedBullets.length > 0 && (
              <div className="mb-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-2">Click to add a bullet:</p>
                <ul className="space-y-1">
                  {suggestedBullets.map((b, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => addSuggestedBullet(b)}
                        className="text-left text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline w-full"
                      >
                        + {b.slice(0, 80)}{b.length > 80 ? "…" : ""}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => { setSuggestingExpIndex(null); setSuggestedBullets([]); }}
                  className="mt-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  Close
                </button>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2 mb-3">
              <input
                placeholder="Company"
                value={exp.company}
                onChange={(e) => {
                  const next = [...(data.experience ?? [])];
                  next[expIndex] = { ...next[expIndex]!, company: e.target.value };
                  setData((d) => ({ ...d, experience: next }));
                }}
                className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <input
                placeholder="Role"
                value={exp.role}
                onChange={(e) => {
                  const next = [...(data.experience ?? [])];
                  next[expIndex] = { ...next[expIndex]!, role: e.target.value };
                  setData((d) => ({ ...d, experience: next }));
                }}
                className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <input
                placeholder="Start"
                value={exp.start}
                onChange={(e) => {
                  const next = [...(data.experience ?? [])];
                  next[expIndex] = { ...next[expIndex]!, start: e.target.value };
                  setData((d) => ({ ...d, experience: next }));
                }}
                className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <input
                placeholder="End"
                value={exp.end}
                onChange={(e) => {
                  const next = [...(data.experience ?? [])];
                  next[expIndex] = { ...next[expIndex]!, end: e.target.value };
                  setData((d) => ({ ...d, experience: next }));
                }}
                className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <ul className="space-y-2">
              {(exp.bullets ?? []).map((bullet, bulletIndex) => (
                <li key={bulletIndex} className="flex gap-2 items-start">
                  <textarea
                    rows={2}
                    value={bullet}
                    onChange={(e) => {
                      const next = [...(data.experience ?? [])];
                      const nextBullets = [...(next[expIndex]?.bullets ?? [])];
                      nextBullets[bulletIndex] = e.target.value;
                      next[expIndex] = { ...next[expIndex]!, bullets: nextBullets };
                      setData((d) => ({ ...d, experience: next }));
                    }}
                    className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => improveBullet(expIndex, bulletIndex)}
                    disabled={improvingIndex?.exp === expIndex && improvingIndex?.bullet === bulletIndex}
                    className="shrink-0 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-50"
                  >
                    {improvingIndex?.exp === expIndex && improvingIndex?.bullet === bulletIndex
                      ? "…"
                      : "Improve"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Skills */}
        <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Skills</h2>
          <input
            value={data.skills?.join(", ") ?? ""}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              }))
            }
            placeholder="Comma-separated"
            className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </section>

        {/* Design: template, font, public theme */}
        <section className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Resume design</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1">Layout</label>
              <select
                value={getDefaultDesign(data.design).templateId}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    design: {
                      ...getDefaultDesign(d.design),
                      templateId: e.target.value as ResumeDesignTemplateId,
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {RESUME_VIEW_TEMPLATES.map((t) => {
                  const locked = !canUseResumeTemplate(t.id, tier, isTestAccount);
                  return (
                    <option key={t.id} value={t.id} disabled={locked}>
                      {t.label}{t.recommended ? " ★" : ""}{locked ? " (Pro)" : t.free ? "" : " (Pro)"}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1">Font</label>
              <select
                value={getDefaultDesign(data.design).fontFamily}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    design: {
                      ...getDefaultDesign(d.design),
                      fontFamily: e.target.value as "sans" | "serif",
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {DESIGN_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-[var(--text-tertiary)] mb-1">Public page theme</label>
              <select
                value={getDefaultDesign(data.design).publicTheme}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    design: {
                      ...getDefaultDesign(d.design),
                      publicTheme: e.target.value as ResumeDesignTemplateId,
                    },
                  }))
                }
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {PUBLIC_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="text-[var(--text-tertiary)] text-xs mt-1">Used for your shareable /r/[slug] page.</p>
            </div>
          </div>
        </section>

        <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 mb-6">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Share link</h2>
          <div className="flex gap-2 flex-wrap items-center">
            <input
              placeholder="my-resume-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm w-48 placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              type="button"
              onClick={async () => {
                setSlugSaving(true);
                const res = await fetch(`/api/resumes/${resumeId}/slug`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ slug: slug || null }),
                });
                setSlugSaving(false);
                if (res.ok) {
                  const d = await res.json();
                  setSlug(d.slug ?? "");
                }
              }}
              disabled={slugSaving}
              className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)] disabled:opacity-50"
            >
              {slugSaving ? "Saving…" : "Save slug"}
            </button>
            {slug && (
              <button
                type="button"
                onClick={() => {
                  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/r/${slug}`;
                  navigator.clipboard.writeText(url);
                }}
                className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                Copy link
              </button>
            )}
          </div>
          {slug && (
            <p className="text-[var(--text-tertiary)] text-xs mt-2">
              Public link: /r/{slug}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <Link
            href={`/dashboard/resumes/${resumeId}/export`}
            className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)]"
          >
            Export PDF
          </Link>
          <Link
            href={`/dashboard/resumes/${resumeId}/versions`}
            className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-tertiary)]"
          >
            Versions
          </Link>
          {saveError && (
            <span className="text-xs text-red-400 self-center">{saveError}</span>
          )}
          <Link
            href="/dashboard/resumes"
            className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-tertiary)]"
          >
            Back to list
          </Link>
        </div>
      </div>

      {/* Preview */}
      <div className="lg:w-[400px] shrink-0">
        <div className={`sticky top-24 rounded-xl bg-white text-black p-6 shadow-lg max-h-[80vh] overflow-auto text-sm ${getDefaultDesign(data.design).fontFamily === "serif" ? "font-serif" : "font-sans"}`}>
          <PublicResumeContent data={data} theme={getDefaultDesign(data.design).templateId} />
        </div>
      </div>
    </div>
  );
}
