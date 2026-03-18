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
import { TagInput } from "@/components/TagInput";

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

  const inputCls = "w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";
  const sectionCls = "rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4";
  const sectionHeading = "text-sm font-medium text-[var(--text-secondary)] mb-3";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)_280px] items-start">
      {/* ── LEFT: Editor ─────────────────────────────────────────────── */}
      <div className="space-y-4 min-w-0">

        {/* Contact */}
        <section className={sectionCls}>
          <h2 className={sectionHeading}>Contact</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["name","email","phone","location","linkedin","website"] as const).map((field) => (
              <input
                key={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={(data.contact as Record<string,string> | undefined)?.[field] ?? ""}
                onChange={(e) => setData((d) => ({ ...d, contact: { ...d.contact, [field]: e.target.value } }))}
                className={inputCls}
              />
            ))}
          </div>
        </section>

        {/* Summary */}
        <section className={sectionCls}>
          <h2 className={sectionHeading}>Summary</h2>
          <textarea rows={3} value={data.summary ?? ""} onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))} className={inputCls} />
        </section>

        {/* Experience */}
        <section className={sectionCls}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={sectionHeading.replace(" mb-3","")}>Experience</h2>
            <button
              type="button"
              onClick={() => setData((d) => ({ ...d, experience: [...(d.experience ?? []), { company: "", role: "", start: "", end: "", bullets: [""] }] }))}
              className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >+ Add</button>
          </div>
          <div className="space-y-5">
            {(data.experience ?? []).map((exp, expIndex) => (
              <div key={expIndex} className="border border-[var(--border-subtle)] rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-tertiary)]">#{expIndex + 1}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fetchSuggestedBullets(expIndex)}
                      disabled={suggestLoading}
                      className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-50"
                    >{suggestLoading && suggestingExpIndex === expIndex ? "…" : "AI bullets"}</button>
                    <button
                      type="button"
                      onClick={() => setData((d) => ({ ...d, experience: (d.experience ?? []).filter((_, i) => i !== expIndex) }))}
                      className="text-xs text-red-400 hover:text-red-300"
                    >Delete</button>
                  </div>
                </div>
                {suggestingExpIndex === expIndex && suggestedBullets.length > 0 && (
                  <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                    <p className="text-xs text-[var(--text-tertiary)] mb-2">Click to add:</p>
                    <ul className="space-y-1">
                      {suggestedBullets.map((b, i) => (
                        <li key={i}>
                          <button type="button" onClick={() => addSuggestedBullet(b)} className="text-left text-sm text-[var(--accent)] hover:underline w-full">
                            + {b.slice(0, 80)}{b.length > 80 ? "…" : ""}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => { setSuggestingExpIndex(null); setSuggestedBullets([]); }} className="mt-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Close</button>
                  </div>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["company","role","start","end"] as const).map((f) => (
                    <input key={f} placeholder={f.charAt(0).toUpperCase()+f.slice(1)} value={exp[f] ?? ""} onChange={(e) => { const n=[...(data.experience??[])]; n[expIndex]={...n[expIndex]!,[f]:e.target.value}; setData((d)=>({...d,experience:n})); }} className={inputCls} />
                  ))}
                </div>
                <div className="space-y-2">
                  {(exp.bullets ?? []).map((bullet, bIdx) => (
                    <div key={bIdx} className="flex gap-2 items-start">
                      <textarea rows={2} value={bullet} onChange={(e) => { const n=[...(data.experience??[])]; const nb=[...(n[expIndex]?.bullets??[])]; nb[bIdx]=e.target.value; n[expIndex]={...n[expIndex]!,bullets:nb}; setData((d)=>({...d,experience:n})); }} className={`flex-1 ${inputCls}`} />
                      <div className="flex flex-col gap-1">
                        <button type="button" onClick={() => improveBullet(expIndex, bIdx)} disabled={improvingIndex?.exp===expIndex&&improvingIndex?.bullet===bIdx} className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-50">{improvingIndex?.exp===expIndex&&improvingIndex?.bullet===bIdx?"…":"AI"}</button>
                        <button type="button" onClick={() => { const n=[...(data.experience??[])]; const nb=(n[expIndex]?.bullets??[]).filter((_,i)=>i!==bIdx); n[expIndex]={...n[expIndex]!,bullets:nb}; setData((d)=>({...d,experience:n})); }} className="text-xs text-red-400 hover:text-red-300">×</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => { const n=[...(data.experience??[])]; const nb=[...(n[expIndex]?.bullets??[]),""];  n[expIndex]={...n[expIndex]!,bullets:nb}; setData((d)=>({...d,experience:n})); }} className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]">+ Add bullet</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className={sectionCls}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={sectionHeading.replace(" mb-3","")}>Education</h2>
            <button type="button" onClick={() => setData((d) => ({ ...d, education: [...(d.education ?? []), { school: "", degree: "", field: "", start: "", end: "" }] }))} className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">+ Add</button>
          </div>
          <div className="space-y-4">
            {(data.education ?? []).map((edu, i) => (
              <div key={i} className="border border-[var(--border-subtle)] rounded-lg p-3 space-y-2">
                <div className="flex justify-end">
                  <button type="button" onClick={() => setData((d) => ({ ...d, education: (d.education ?? []).filter((_, j) => j !== i) }))} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input placeholder="School" value={edu.school ?? ""} onChange={(e) => { const n=[...(data.education??[])]; n[i]={...n[i]!,school:e.target.value}; setData((d)=>({...d,education:n})); }} className={inputCls} />
                  <input placeholder="Degree" value={edu.degree ?? ""} onChange={(e) => { const n=[...(data.education??[])]; n[i]={...n[i]!,degree:e.target.value}; setData((d)=>({...d,education:n})); }} className={inputCls} />
                  <input placeholder="Field of study" value={edu.field ?? ""} onChange={(e) => { const n=[...(data.education??[])]; n[i]={...n[i]!,field:e.target.value}; setData((d)=>({...d,education:n})); }} className={inputCls} />
                  <input placeholder="Start" value={edu.start ?? ""} onChange={(e) => { const n=[...(data.education??[])]; n[i]={...n[i]!,start:e.target.value}; setData((d)=>({...d,education:n})); }} className={inputCls} />
                  <input placeholder="End" value={edu.end ?? ""} onChange={(e) => { const n=[...(data.education??[])]; n[i]={...n[i]!,end:e.target.value}; setData((d)=>({...d,education:n})); }} className={inputCls} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className={sectionCls}>
          <h2 className={sectionHeading}>Skills</h2>
          <TagInput tags={data.skills ?? []} onChange={(tags) => setData((d) => ({ ...d, skills: tags }))} placeholder="Type a skill, press Enter or comma to add…" />
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Press Enter or comma to add. Click × to remove.</p>
        </section>

        {/* Certifications */}
        <section className={sectionCls}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={sectionHeading.replace(" mb-3","")}>Certifications</h2>
            <button type="button" onClick={() => setData((d) => ({ ...d, certifications: [...(d.certifications ?? []), ""] }))} className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">+ Add</button>
          </div>
          <div className="space-y-2">
            {(data.certifications ?? []).map((cert, i) => (
              <div key={i} className="flex gap-2">
                <input value={typeof cert === "string" ? cert : ""} onChange={(e) => { const n=[...(data.certifications??[])]; n[i]=e.target.value; setData((d)=>({...d,certifications:n})); }} className={`flex-1 ${inputCls}`} placeholder="Certification name" />
                <button type="button" onClick={() => setData((d) => ({ ...d, certifications: (d.certifications ?? []).filter((_, j) => j !== i) }))} className="text-xs text-red-400 hover:text-red-300 shrink-0">×</button>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className={sectionCls}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={sectionHeading.replace(" mb-3","")}>Projects</h2>
            <button type="button" onClick={() => setData((d) => ({ ...d, projects: [...(d.projects ?? []), { name: "", description: "", url: "", bullets: [] }] }))} className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">+ Add</button>
          </div>
          <div className="space-y-4">
            {(data.projects ?? []).map((proj, i) => (
              <div key={i} className="border border-[var(--border-subtle)] rounded-lg p-3 space-y-2">
                <div className="flex justify-end">
                  <button type="button" onClick={() => setData((d) => ({ ...d, projects: (d.projects ?? []).filter((_, j) => j !== i) }))} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
                <input placeholder="Project name" value={proj.name ?? ""} onChange={(e) => { const n=[...(data.projects??[])]; n[i]={...n[i]!,name:e.target.value}; setData((d)=>({...d,projects:n})); }} className={inputCls} />
                <input placeholder="URL (optional)" value={proj.url ?? ""} onChange={(e) => { const n=[...(data.projects??[])]; n[i]={...n[i]!,url:e.target.value}; setData((d)=>({...d,projects:n})); }} className={inputCls} />
                <textarea rows={2} placeholder="Description" value={proj.description ?? ""} onChange={(e) => { const n=[...(data.projects??[])]; n[i]={...n[i]!,description:e.target.value}; setData((d)=>({...d,projects:n})); }} className={inputCls} />
              </div>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section className={sectionCls}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={sectionHeading.replace(" mb-3","")}>Achievements</h2>
            <button type="button" onClick={() => setData((d) => ({ ...d, achievements: [...(d.achievements ?? []), ""] }))} className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">+ Add</button>
          </div>
          <div className="space-y-2">
            {(data.achievements ?? []).map((ach, i) => (
              <div key={i} className="flex gap-2">
                <input value={typeof ach === "string" ? ach : ""} onChange={(e) => { const n=[...(data.achievements??[])]; n[i]=e.target.value; setData((d)=>({...d,achievements:n})); }} className={`flex-1 ${inputCls}`} placeholder="Achievement" />
                <button type="button" onClick={() => setData((d) => ({ ...d, achievements: (d.achievements ?? []).filter((_, j) => j !== i) }))} className="text-xs text-red-400 hover:text-red-300 shrink-0">×</button>
              </div>
            ))}
          </div>
        </section>

        {/* Design */}
        <section className={sectionCls}>
          <h2 className={sectionHeading}>Resume design</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1">Layout</label>
              <select value={getDefaultDesign(data.design).templateId} onChange={(e) => setData((d) => ({ ...d, design: { ...getDefaultDesign(d.design), templateId: e.target.value as ResumeDesignTemplateId } }))} className={inputCls}>
                {RESUME_VIEW_TEMPLATES.map((t) => { const locked=!canUseResumeTemplate(t.id,tier,isTestAccount); return <option key={t.id} value={t.id} disabled={locked}>{t.label}{t.recommended?" ★":""}{locked?" (Pro)":t.free?"":" (Pro)"}</option>; })}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1">Font</label>
              <select value={getDefaultDesign(data.design).fontFamily} onChange={(e) => setData((d) => ({ ...d, design: { ...getDefaultDesign(d.design), fontFamily: e.target.value as "sans"|"serif" } }))} className={inputCls}>
                {DESIGN_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-[var(--text-tertiary)] mb-1">Public page theme</label>
              <select value={getDefaultDesign(data.design).publicTheme} onChange={(e) => setData((d) => ({ ...d, design: { ...getDefaultDesign(d.design), publicTheme: e.target.value as ResumeDesignTemplateId } }))} className={inputCls}>
                {PUBLIC_THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <p className="text-[var(--text-tertiary)] text-xs mt-1">Used for your shareable /r/[slug] page.</p>
            </div>
          </div>
        </section>

        {/* Share link */}
        <section className={`${sectionCls} mb-2`}>
          <h2 className={sectionHeading}>Share link</h2>
          <div className="flex gap-2 flex-wrap items-center">
            <input placeholder="my-resume-slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm w-48 placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            <button type="button" onClick={async () => { setSlugSaving(true); const res=await fetch(`/api/resumes/${resumeId}/slug`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:slug||null})}); setSlugSaving(false); if(res.ok){const d=await res.json();setSlug(d.slug??"");} }} disabled={slugSaving} className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)] disabled:opacity-50">{slugSaving?"Saving…":"Save slug"}</button>
            {slug && <button type="button" onClick={() => navigator.clipboard.writeText(`${typeof window!=="undefined"?window.location.origin:""}/r/${slug}`)} className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">Copy link</button>}
          </div>
          {slug && <p className="text-[var(--text-tertiary)] text-xs mt-2">Public link: /r/{slug}</p>}
        </section>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={save} disabled={saving} className="btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50">{saving?"Saving…":"Save"}</button>
          <Link href={`/dashboard/resumes/${resumeId}/export`} className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)]">Export PDF</Link>
          <Link href={`/dashboard/resumes/${resumeId}/versions`} className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-tertiary)]">Versions</Link>
          {saveError && <span className="text-xs text-red-400 self-center">{saveError}</span>}
          <Link href="/dashboard/resumes" className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-tertiary)]">← Back</Link>
        </div>
      </div>

      {/* ── CENTER: Live preview ───────────────────────────────────────── */}
      <div className="min-w-0">
        <div className={`sticky top-24 rounded-xl bg-white text-black p-6 shadow-lg max-h-[88vh] overflow-y-auto text-sm ${getDefaultDesign(data.design).fontFamily==="serif"?"font-serif":"font-sans"}`}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">Live preview</p>
          <PublicResumeContent data={data} theme={getDefaultDesign(data.design).templateId} />
        </div>
      </div>

      {/* ── RIGHT: ATS / Insights ─────────────────────────────────────── */}
      <div className="min-w-0">
        <div className="sticky top-24 space-y-4">
          <section className={sectionCls}>
            <h2 className="text-sm font-medium text-[var(--text-primary)] mb-2">ATS score</h2>
            <p className="text-xs text-[var(--text-tertiary)] mb-3">Optionally paste a job description for role-specific feedback.</p>
            <textarea
              placeholder="Paste job description (optional)"
              value={atsJobDescription}
              onChange={(e) => setAtsJobDescription(e.target.value)}
              rows={4}
              className={`${inputCls} mb-2 resize-none`}
            />
            <button type="button" onClick={runAtsCheck} disabled={atsLoading} className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-glass)] disabled:opacity-50">
              {atsLoading ? "Checking…" : "Run ATS check"}
            </button>
            {atsResult && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Score</p>
                  <span className={`text-xl font-bold ${atsResult.score >= 75 ? "text-emerald-400" : atsResult.score >= 50 ? "text-amber-400" : "text-red-400"}`}>{atsResult.score}<span className="text-sm font-normal text-[var(--text-tertiary)]">/100</span></span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${atsResult.score>=75?"bg-emerald-500":atsResult.score>=50?"bg-amber-500":"bg-red-500"}`} style={{width:`${atsResult.score}%`}} />
                </div>
                {atsResult.feedback.length > 0 && (
                  <ul className="space-y-1.5">
                    {atsResult.feedback.map((f, idx) => (
                      <li key={idx} className="text-xs text-[var(--text-secondary)] flex gap-2">
                        <span className="shrink-0 mt-0.5 text-[var(--accent)]">•</span>{f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
