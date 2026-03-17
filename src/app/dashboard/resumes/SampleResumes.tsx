"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { PublicResumeContent } from "@/app/r/[slug]/PublicResumeContent";
import { SAMPLE_RESUME_DATA } from "@/lib/sample-resume-data";
import {
  RESUME_VIEW_TEMPLATES,
  DESIGN_FONTS,
  canUseResumeTemplate,
  type ResumeDesignTemplateId,
  type ResumeDesignFontId,
} from "@/types/resume";
import type { ResumeData } from "@/types/resume";

interface SampleResumesProps {
  tier: "free" | "pro" | null;
  isTestAccount: boolean;
}

function getInitialData(): ResumeData {
  return JSON.parse(JSON.stringify(SAMPLE_RESUME_DATA));
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent";
const labelClass = "block text-xs font-medium text-[var(--text-tertiary)] mb-1";
const sectionClass = "border-b border-[var(--border-subtle)] pb-5 last:border-0 last:pb-0";

export function SampleResumes({ tier, isTestAccount }: SampleResumesProps) {
  const [data, setData] = useState<ResumeData>(getInitialData);
  const [theme, setTheme] = useState<ResumeDesignTemplateId>("clean");
  const [font, setFont] = useState<ResumeDesignFontId>("sans");

  const canUse = canUseResumeTemplate(theme, tier, isTestAccount);
  const selectedOption = RESUME_VIEW_TEMPLATES.find((t) => t.id === theme);

  const resetToSample = useCallback(() => setData(getInitialData()), []);

  const updateContact = useCallback((field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value || undefined },
    }));
  }, []);

  const updateExperience = useCallback((index: number, field: string, value: string | string[]) => {
    setData((prev) => {
      const list = [...(prev.experience ?? [])];
      const entry = list[index];
      if (!entry) return prev;
      (entry as Record<string, unknown>)[field] = value;
      return { ...prev, experience: list };
    });
  }, []);

  const addExperience = useCallback(() => {
    setData((prev) => ({
      ...prev,
      experience: [...(prev.experience ?? []), { company: "", role: "", start: "", end: "", bullets: [] }],
    }));
  }, []);

  const removeExperience = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience?.filter((_, i) => i !== index) ?? [],
    }));
  }, []);

  const updateEducation = useCallback((index: number, field: string, value: string) => {
    setData((prev) => {
      const list = [...(prev.education ?? [])];
      const entry = list[index];
      if (!entry) return prev;
      (entry as Record<string, string>)[field] = value;
      return { ...prev, education: list };
    });
  }, []);

  const addEducation = useCallback(() => {
    setData((prev) => ({
      ...prev,
      education: [...(prev.education ?? []), { school: "", degree: "", start: "", end: "" }],
    }));
  }, []);

  const removeEducation = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index) ?? [],
    }));
  }, []);

  const updateProject = useCallback((index: number, field: string, value: string | string[]) => {
    setData((prev) => {
      const list = [...(prev.projects ?? [])];
      const entry = list[index];
      if (!entry) return prev;
      (entry as Record<string, unknown>)[field] = value;
      return { ...prev, projects: list };
    });
  }, []);

  const addProject = useCallback(() => {
    setData((prev) => ({
      ...prev,
      projects: [...(prev.projects ?? []), { name: "", description: "", bullets: [] }],
    }));
  }, []);

  const removeProject = useCallback((index: number) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects?.filter((_, i) => i !== index) ?? [],
    }));
  }, []);

  return (
    <section className="mb-10">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-lg overflow-hidden">
        <div className="bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-primary)] px-6 py-5 sm:px-8 sm:py-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)] mb-1">
            Live resume builder
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-xl">
            Edit any field—the preview updates in real time. On mobile the preview appears first; on desktop it’s to the right. Change template and font, then create a resume to save your own.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left on desktop; second on mobile so preview shows first */}
          <div className="order-2 lg:order-1 shrink-0 lg:w-[380px] lg:max-h-[min(75vh,900px)] lg:overflow-y-auto lg:border-r lg:border-[var(--border-subtle)]">
            <div className="p-5 sm:p-6 space-y-5">
              {/* Style */}
              <div className={sectionClass}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Style</h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Template</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as ResumeDesignTemplateId)}
                      className={inputClass}
                    >
                      {RESUME_VIEW_TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}{t.recommended ? " ★" : ""}{!t.free ? " (Pro)" : ""}
                        </option>
                      ))}
                    </select>
                    {selectedOption?.recommended && (
                      <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">★ Recruiter-friendly</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Font</label>
                    <select
                      value={font}
                      onChange={(e) => setFont(e.target.value as ResumeDesignFontId)}
                      className={inputClass}
                    >
                      {DESIGN_FONTS.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  {!canUse && (
                    <p className="text-xs text-amber-200/90">Pro template—upgrade or use test account to apply.</p>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className={sectionClass}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Contact</h3>
                <div className="space-y-2">
                  {["name", "email", "phone", "location", "linkedin", "website"].map((field) => (
                    <div key={field}>
                      <label className={labelClass}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                      <input
                        type={field === "email" ? "email" : "text"}
                        value={data.contact?.[field as keyof NonNullable<ResumeData["contact"]>] ?? ""}
                        onChange={(e) => updateContact(field, e.target.value)}
                        placeholder={field === "name" ? "Full name" : field === "email" ? "email@example.com" : ""}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className={sectionClass}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Summary</h3>
                <textarea
                  value={data.summary ?? ""}
                  onChange={(e) => setData((p) => ({ ...p, summary: e.target.value || undefined }))}
                  rows={4}
                  placeholder="Professional summary (2–4 sentences)"
                  className={inputClass}
                />
              </div>

              {/* Experience */}
              <div className={sectionClass}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Experience</h3>
                  <button type="button" onClick={addExperience} className="text-xs font-medium text-[var(--accent)] hover:underline">
                    + Add
                  </button>
                </div>
                <div className="space-y-4">
                  {(data.experience ?? []).map((exp, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--text-tertiary)]">Job #{i + 1}</span>
                        <button type="button" onClick={() => removeExperience(i)} className="text-xs text-red-400 hover:underline">Remove</button>
                      </div>
                      <input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} className={inputClass} />
                      <input placeholder="Role" value={exp.role} onChange={(e) => updateExperience(i, "role", e.target.value)} className={inputClass} />
                      <input placeholder="Location (optional)" value={exp.location ?? ""} onChange={(e) => updateExperience(i, "location", e.target.value)} className={inputClass} />
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Start" value={exp.start} onChange={(e) => updateExperience(i, "start", e.target.value)} className={inputClass} />
                        <input placeholder="End" value={exp.end} onChange={(e) => updateExperience(i, "end", e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Bullets (one per line)</label>
                        <textarea
                          rows={3}
                          value={exp.bullets?.join("\n") ?? ""}
                          onChange={(e) => updateExperience(i, "bullets", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                          placeholder="Achievement or responsibility..."
                          className={inputClass}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className={sectionClass}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Education</h3>
                  <button type="button" onClick={addEducation} className="text-xs font-medium text-[var(--accent)] hover:underline">+ Add</button>
                </div>
                <div className="space-y-3">
                  {(data.education ?? []).map((edu, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--text-tertiary)]">School #{i + 1}</span>
                        <button type="button" onClick={() => removeEducation(i)} className="text-xs text-red-400 hover:underline">Remove</button>
                      </div>
                      <input placeholder="School" value={edu.school} onChange={(e) => updateEducation(i, "school", e.target.value)} className={inputClass} />
                      <input placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} className={inputClass} />
                      <input placeholder="Field (optional)" value={edu.field ?? ""} onChange={(e) => updateEducation(i, "field", e.target.value)} className={inputClass} />
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Start" value={edu.start} onChange={(e) => updateEducation(i, "start", e.target.value)} className={inputClass} />
                        <input placeholder="End" value={edu.end} onChange={(e) => updateEducation(i, "end", e.target.value)} className={inputClass} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className={sectionClass}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Skills</h3>
                <input
                  value={data.skills?.join(", ") ?? ""}
                  onChange={(e) => setData((p) => ({ ...p, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
                  placeholder="Comma-separated: React, TypeScript, ..."
                  className={inputClass}
                />
              </div>

              {/* Certifications */}
              <div className={sectionClass}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Certifications</h3>
                <input
                  value={data.certifications?.join(", ") ?? ""}
                  onChange={(e) => setData((p) => ({ ...p, certifications: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
                  placeholder="Comma-separated"
                  className={inputClass}
                />
              </div>

              {/* Projects */}
              <div className={sectionClass}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Projects</h3>
                  <button type="button" onClick={addProject} className="text-xs font-medium text-[var(--accent)] hover:underline">+ Add</button>
                </div>
                <div className="space-y-3">
                  {(data.projects ?? []).map((proj, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--text-tertiary)]">Project #{i + 1}</span>
                        <button type="button" onClick={() => removeProject(i)} className="text-xs text-red-400 hover:underline">Remove</button>
                      </div>
                      <input placeholder="Project name" value={proj.name} onChange={(e) => updateProject(i, "name", e.target.value)} className={inputClass} />
                      <input placeholder="Description (optional)" value={proj.description ?? ""} onChange={(e) => updateProject(i, "description", e.target.value)} className={inputClass} />
                      <input placeholder="URL (optional)" value={proj.url ?? ""} onChange={(e) => updateProject(i, "url", e.target.value)} className={inputClass} />
                      <div>
                        <label className={labelClass}>Bullets (one per line)</label>
                        <textarea
                          rows={2}
                          value={proj.bullets?.join("\n") ?? ""}
                          onChange={(e) => updateProject(i, "bullets", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className={sectionClass}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Achievements</h3>
                <textarea
                  value={data.achievements?.join("\n") ?? ""}
                  onChange={(e) => setData((p) => ({ ...p, achievements: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) }))}
                  rows={3}
                  placeholder="One per line"
                  className={inputClass}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetToSample}
                  className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  Reset to sample
                </button>
                <Link
                  href="/dashboard/resumes/new"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-95 transition-opacity"
                >
                  Create resume from profile
                </Link>
              </div>
            </div>
          </div>

          {/* Right on desktop; first on mobile so users see the resume at the top */}
          <div className="order-1 lg:order-2 flex-1 min-w-0 flex flex-col bg-[var(--bg-primary)]">
            <div className="p-4 sm:p-6 lg:p-8 lg:sticky lg:top-4">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-white shadow-xl overflow-hidden">
                <div
                  className={`overflow-y-auto overflow-x-hidden bg-white text-black ${font === "serif" ? "font-serif" : "font-sans"}`}
                  style={{ minHeight: "360px", maxHeight: "min(75vh, 820px)" }}
                >
                  <div className="p-6 sm:p-8 md:p-10 text-sm md:text-base max-w-2xl mx-auto">
                    <PublicResumeContent data={data} theme={theme} />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                Live preview. Create a resume to save and export.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
