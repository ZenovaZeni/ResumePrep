"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthToast } from "@/components/AuthToast";
import { VoiceButton } from "@/components/VoiceButton";
import { TagInput } from "@/components/TagInput";
import type { ProfilesRow } from "@/types/database";
import type { CareerProfilesRow } from "@/types/database";
import type { CareerProfileFormData } from "@/types/profile";
import { computeProfileCompletion } from "@/lib/profile-completion";

interface ProfileFormProps {
  profile: ProfilesRow | undefined;
  careerProfile: CareerProfilesRow | undefined;
  userEmail?: string;
  loadError?: string | null;
}

function parseJson<T>(v: unknown): T | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return undefined;
    }
  }
  return v as T;
}

// ─── Completion score ─────────────────────────────────────────────────────────

interface ScoreField {
  label: string;
  filled: boolean;
}

function useCompletionScore(form: CareerProfileFormData): { score: number; fields: ScoreField[] } {
  const { score, items } = computeProfileCompletion({
    firstName: form.contact?.firstName,
    email: form.contact?.email,
    location: form.contact?.location,
    headline: form.headline,
    summary: form.summary,
    targetRoles: form.target_roles,
    experience: form.experience,
    education: form.education,
    skills: form.skills,
    linkedin: form.contact?.linkedin,
    website: form.contact?.website,
  });
  const fields: ScoreField[] = items.map((item) => ({ label: item.label, filled: item.done }));
  return { score, fields };
}

function CompletionBar({ score, fields }: { score: number; fields: ScoreField[] }) {
  const [expanded, setExpanded] = useState(false);
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-[var(--accent)]";
  const label =
    score >= 80 ? "Great profile" : score >= 50 ? "Getting there" : "Just getting started";
  const missing = fields.filter((f) => !f.filled);

  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
          <span className="ml-2 text-xs text-[var(--text-tertiary)]">{score}% complete</span>
        </div>
        {missing.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            {expanded ? "Hide tips" : `${missing.length} tip${missing.length > 1 ? "s" : ""}`}
          </button>
        )}
      </div>
      <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {expanded && missing.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {missing.map((f) => (
            <li
              key={f.label}
              className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
            >
              Add {f.label.toLowerCase()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          {hint && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function inputCls(extra = "") {
  return `w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] text-sm transition-colors ${extra}`;
}

function VoiceField({ children, onAppend }: { children: React.ReactNode; onAppend: (t: string) => void }) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">{children}</div>
      <VoiceButton onTranscript={(t) => onAppend(t)} className="mt-0.5 flex-shrink-0" />
    </div>
  );
}

// ─── AI state ────────────────────────────────────────────────────────────────

type AiState = {
  headlineSuggestions: string[] | null;
  headlineLoading: boolean;
  summaryDraft: string | null;
  summaryLoading: boolean;
  bulletSuggestions: Record<number, string[]>;
  bulletLoadingIdx: number | null;
};

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileForm({
  profile,
  careerProfile,
  userEmail,
  loadError,
}: ProfileFormProps) {
  const router = useRouter();
  // Stable Supabase client — never recreated between renders
  const supabase = useMemo(() => createClient(), []);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [importPaste, setImportPaste] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const isTestAccount = userEmail === "test@example.com";
  const MAX_IMPORT_LENGTH = 50000;

  const [ai, setAi] = useState<AiState>({
    headlineSuggestions: null,
    headlineLoading: false,
    summaryDraft: null,
    summaryLoading: false,
    bulletSuggestions: {},
    bulletLoadingIdx: null,
  });

  const dismissMessage = useCallback(() => setMessage(null), []);

  // ─── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<CareerProfileFormData>({
    headline: "",
    summary: "",
    target_roles: [],
    career_goals: "",
    contact: {
      firstName: profile?.first_name ?? "",
      lastName: profile?.last_name ?? "",
      name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim(),
      email: userEmail ?? "",
      phone: "",
      location: "",
      linkedin: "",
      website: "",
    },
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    achievements: [],
    metrics: {},
  });

  // Autofill contact from auth metadata
  const metaLoadedRef = useRef(false);
  useEffect(() => {
    if (metaLoadedRef.current) return;
    metaLoadedRef.current = true;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const m = user.user_metadata ?? {};
      const metaFirst = ((m.first_name ?? m.firstName ?? "") as string).trim();
      const metaLast = ((m.last_name ?? m.lastName ?? "") as string).trim();
      const metaLinkedin = ((m.linkedin ?? m.linkedin_url ?? "") as string).trim();
      const metaWebsite = ((m.website ?? m.website_url ?? "") as string).trim();
      const metaLocation = ((m.location ?? m.city ?? "") as string).trim();

      setForm((prev) => {
        const hasFirst = Boolean(prev.contact?.firstName?.trim());
        const hasLast = Boolean(prev.contact?.lastName?.trim());
        const nextFirst = hasFirst ? prev.contact!.firstName! : metaFirst || prev.contact?.firstName || "";
        const nextLast = hasLast ? prev.contact!.lastName! : metaLast || prev.contact?.lastName || "";
        const nextLinkedin = prev.contact?.linkedin?.trim() || metaLinkedin;
        const nextWebsite = prev.contact?.website?.trim() || metaWebsite;
        const nextLocation = prev.contact?.location?.trim() || metaLocation;
        // Bail out if nothing actually changes
        if (
          nextFirst === prev.contact?.firstName &&
          nextLast === prev.contact?.lastName &&
          nextLinkedin === prev.contact?.linkedin &&
          nextWebsite === prev.contact?.website &&
          nextLocation === prev.contact?.location
        ) {
          return prev;
        }
        return {
          ...prev,
          contact: {
            ...prev.contact,
            firstName: nextFirst,
            lastName: nextLast,
            name: [nextFirst, nextLast].filter(Boolean).join(" ").trim() || prev.contact?.name,
            linkedin: nextLinkedin,
            website: nextWebsite,
            location: nextLocation,
          },
        };
      });
    })();
  }, [supabase]);

  // Hydrate form from DB data
  useEffect(() => {
    if (!careerProfile && !profile) return;
    const exp = parseJson<CareerProfileFormData["experience"]>(careerProfile?.raw_experience);
    const edu = parseJson<CareerProfileFormData["education"]>(careerProfile?.education);
    const proj = parseJson<CareerProfileFormData["projects"]>(careerProfile?.projects);
    const cert = parseJson<CareerProfileFormData["certifications"]>(careerProfile?.certifications);
    const metrics = parseJson<Record<string, string>>(careerProfile?.metrics);
    setForm((prev) => ({
      ...prev,
      headline: careerProfile?.headline ?? prev.headline,
      summary: careerProfile?.summary ?? prev.summary,
      target_roles: careerProfile?.target_roles ?? prev.target_roles,
      career_goals: careerProfile?.career_goals ?? prev.career_goals,
      contact: {
        ...prev.contact,
        firstName: profile?.first_name ?? prev.contact?.firstName ?? "",
        lastName: profile?.last_name ?? prev.contact?.lastName ?? "",
        name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || prev.contact?.name,
        email: userEmail ?? prev.contact?.email,
        phone: careerProfile?.phone ?? prev.contact?.phone ?? "",
        location: careerProfile?.location ?? prev.contact?.location ?? "",
      },
      experience: Array.isArray(exp) ? exp : prev.experience,
      education: Array.isArray(edu) ? edu : prev.education,
      skills: careerProfile?.skills ?? prev.skills,
      certifications: Array.isArray(cert) ? cert : prev.certifications,
      projects: Array.isArray(proj) ? proj : prev.projects,
      achievements: Array.isArray(careerProfile?.achievements)
        ? (careerProfile.achievements as string[])
        : prev.achievements,
      metrics: metrics && typeof metrics === "object" ? metrics : prev.metrics,
    }));
  }, [careerProfile, profile, userEmail]);

  // ─── Completion score ────────────────────────────────────────────────────────
  const { score, fields: completionFields } = useCompletionScore(form);

  // ─── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!form.contact?.firstName?.trim()) {
      setMessage({ type: "error", text: "First name is required." });
      setSaving(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage({ type: "error", text: "Not signed in. Please refresh and try again." });
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        first_name: form.contact?.firstName?.trim() || null,
        last_name: form.contact?.lastName?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (profileError) {
      setMessage({ type: "error", text: profileError.message });
      setSaving(false);
      return;
    }

    const { error: careerError } = await supabase.from("career_profiles").upsert(
      {
        user_id: user.id,
        headline: form.headline || null,
        summary: form.summary || null,
        target_roles: form.target_roles?.length ? form.target_roles : null,
        career_goals: form.career_goals || null,
        raw_experience: form.experience ?? null,
        skills: form.skills?.length ? form.skills : null,
        certifications: form.certifications ?? null,
        education: form.education ?? null,
        projects: form.projects ?? null,
        achievements: form.achievements ?? null,
        metrics: form.metrics ?? null,
        phone: form.contact?.phone?.trim() || null,
        location: form.contact?.location?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (careerError) {
      setMessage({ type: "error", text: careerError.message });
      setSaving(false);
      return;
    }

    setMessage({ type: "ok", text: "Profile saved." });
    setSaving(false);
    router.refresh();
  }

  // ─── Experience helpers ───────────────────────────────────────────────────────
  function addExperience() {
    setForm((prev) => ({
      ...prev,
      experience: [...(prev.experience ?? []), { company: "", role: "", start: "", end: "", bullets: [] }],
    }));
  }
  function removeExperience(i: number) {
    setForm((prev) => ({ ...prev, experience: prev.experience?.filter((_, idx) => idx !== i) ?? [] }));
  }
  function updateExperience(i: number, field: string, value: string | string[]) {
    setForm((prev) => {
      const list = [...(prev.experience ?? [])];
      const entry = list[i];
      if (!entry) return prev;
      (entry as unknown as Record<string, unknown>)[field] = value;
      return { ...prev, experience: list };
    });
  }

  // ─── Education helpers ────────────────────────────────────────────────────────
  function addEducation() {
    setForm((prev) => ({
      ...prev,
      education: [...(prev.education ?? []), { school: "", degree: "", start: "", end: "" }],
    }));
  }
  function removeEducation(i: number) {
    setForm((prev) => ({ ...prev, education: prev.education?.filter((_, idx) => idx !== i) ?? [] }));
  }
  function updateEducation(i: number, field: string, value: string) {
    setForm((prev) => {
      const list = [...(prev.education ?? [])];
      const entry = list[i];
      if (!entry) return prev;
      (entry as unknown as Record<string, string>)[field] = value;
      return { ...prev, education: list };
    });
  }

  // ─── Project helpers ──────────────────────────────────────────────────────────
  function addProject() {
    setForm((prev) => ({
      ...prev,
      projects: [...(prev.projects ?? []), { name: "", description: "", url: "", bullets: [] }],
    }));
  }
  function removeProject(i: number) {
    setForm((prev) => ({ ...prev, projects: prev.projects?.filter((_, idx) => idx !== i) ?? [] }));
  }
  function updateProject(i: number, field: string, value: string | string[]) {
    setForm((prev) => {
      const list = [...(prev.projects ?? [])];
      const entry = list[i];
      if (!entry) return prev;
      (entry as unknown as Record<string, unknown>)[field] = value;
      return { ...prev, projects: list };
    });
  }

  // ─── AI helpers ───────────────────────────────────────────────────────────────
  async function suggestHeadlines() {
    setAi((a) => ({ ...a, headlineLoading: true, headlineSuggestions: null }));
    try {
      const res = await fetch("/api/profile/suggest-headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_headline: form.headline,
          target_roles: form.target_roles,
          skills: form.skills,
        }),
      });
      const data = (await res.json()) as { headlines?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAi((a) => ({ ...a, headlineSuggestions: data.headlines ?? [] }));
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "AI error" });
    } finally {
      setAi((a) => ({ ...a, headlineLoading: false }));
    }
  }

  async function draftSummary() {
    setAi((a) => ({ ...a, summaryLoading: true, summaryDraft: null }));
    try {
      const res = await fetch("/api/profile/draft-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: form.headline,
          target_roles: form.target_roles,
          skills: form.skills,
          experience: form.experience?.map((e) => ({ role: e.role, company: e.company, end: e.end })),
          career_goals: form.career_goals,
        }),
      });
      const data = (await res.json()) as { summary?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAi((a) => ({ ...a, summaryDraft: data.summary ?? null }));
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "AI error" });
    } finally {
      setAi((a) => ({ ...a, summaryLoading: false }));
    }
  }

  async function suggestBulletsForExp(i: number) {
    const exp = form.experience?.[i];
    if (!exp?.role) {
      setMessage({ type: "error", text: "Enter a role first." });
      return;
    }
    setAi((a) => ({ ...a, bulletLoadingIdx: i }));
    try {
      const res = await fetch("/api/profile/suggest-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: exp.role, company: exp.company, existing_bullets: exp.bullets }),
      });
      const data = (await res.json()) as { bullets?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAi((a) => ({
        ...a,
        bulletSuggestions: { ...a.bulletSuggestions, [i]: data.bullets ?? [] },
      }));
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "AI error" });
    } finally {
      setAi((a) => ({ ...a, bulletLoadingIdx: null }));
    }
  }

  // ─── Import helpers ────────────────────────────────────────────────────────────
  async function handleLoadSample() {
    if (!isTestAccount) return;
    setSeedLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/seed", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error ?? res.statusText ?? "Failed to load sample data." });
        return;
      }
      setMessage({ type: "ok", text: "Sample data loaded." });
      router.refresh();
    } catch (e) {
      setMessage({ type: "error", text: `Failed: ${e instanceof Error ? e.message : "error"}` });
    } finally {
      setSeedLoading(false);
    }
  }

  type ImportPayload = {
    profile?: { first_name?: string | null; last_name?: string | null };
    career?: {
      headline?: string | null;
      summary?: string | null;
      phone?: string | null;
      location?: string | null;
      target_roles?: string[];
      career_goals?: string | null;
      raw_experience?: CareerProfileFormData["experience"];
      education?: CareerProfileFormData["education"];
      skills?: string[];
      certifications?: CareerProfileFormData["certifications"];
      projects?: CareerProfileFormData["projects"];
      achievements?: string[];
    };
  };

  function applyImport({ profile: impProfile, career: impCareer }: ImportPayload) {
    setForm((prev) => ({
      ...prev,
      headline: impCareer?.headline ?? prev.headline,
      summary: impCareer?.summary ?? prev.summary,
      target_roles: impCareer?.target_roles ?? prev.target_roles,
      career_goals: impCareer?.career_goals ?? prev.career_goals,
      contact: {
        ...prev.contact,
        firstName: impProfile?.first_name ?? prev.contact?.firstName ?? "",
        lastName: impProfile?.last_name ?? prev.contact?.lastName ?? "",
        name:
          [impProfile?.first_name, impProfile?.last_name].filter(Boolean).join(" ").trim() ||
          prev.contact?.name,
        phone: impCareer?.phone ?? prev.contact?.phone ?? "",
        location: impCareer?.location ?? prev.contact?.location ?? "",
      },
      experience: Array.isArray(impCareer?.raw_experience)
        ? impCareer.raw_experience
        : prev.experience,
      education: Array.isArray(impCareer?.education) ? impCareer.education : prev.education,
      skills: impCareer?.skills ?? prev.skills,
      certifications: Array.isArray(impCareer?.certifications)
        ? impCareer.certifications
        : prev.certifications,
      projects: Array.isArray(impCareer?.projects) ? impCareer.projects : prev.projects,
      achievements: Array.isArray(impCareer?.achievements)
        ? impCareer.achievements
        : prev.achievements,
    }));
  }

  async function handleImport() {
    if (!importPaste.trim()) return;
    setImportLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paste: importPaste.trim() }),
      });
      const data = (await res.json()) as { error?: string } & ImportPayload;
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Import failed." });
        return;
      }
      applyImport(data);
      setMessage({ type: "ok", text: "Profile imported. Review below and save when ready." });
      setImportPaste("");
    } catch {
      setMessage({ type: "error", text: "Import failed." });
    } finally {
      setImportLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-24 sm:pb-8">
      {/* Error banner — only for real DB errors, not "no row yet" */}
      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-300 mb-1">Database error</p>
          <p className="text-xs text-red-200/80">{loadError}</p>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-red-300 underline hover:text-red-200"
          >
            Open Supabase Dashboard →
          </a>
        </div>
      )}

      {message && (
        <AuthToast
          message={message.text}
          kind={message.type === "ok" ? "success" : "error"}
          onDismiss={dismissMessage}
          autoHideMs={6000}
        />
      )}

      {/* Completion score */}
      <CompletionBar score={score} fields={completionFields} />

      {/* ── Import paste / file ─────────────────────────────────────────────── */}
      <Section
        title="Quick import"
        hint="Paste your LinkedIn / resume text, or upload a PDF/text file — AI fills the form automatically."
      >
        {/* File upload */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Upload resume (PDF or .txt)</label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Choose file
              <input
                type="file"
                accept=".pdf,.txt,.text,text/plain,application/pdf"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImportLoading(true);
                  setMessage(null);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await fetch("/api/profile/import-resume", { method: "POST", body: fd });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error ?? "Import failed");
                    applyImport(json);
                    setMessage({ type: "ok", text: `Resume imported from ${file.name} — review and save.` });
                  } catch (err) {
                    setMessage({ type: "error", text: err instanceof Error ? err.message : "Import failed" });
                  } finally {
                    setImportLoading(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            {importLoading && <span className="text-xs text-[var(--text-tertiary)]">Extracting…</span>}
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Or paste text below.</p>
        </div>

        {/* Paste area */}
        <textarea
          value={importPaste}
          onChange={(e) => setImportPaste(e.target.value.slice(0, MAX_IMPORT_LENGTH))}
          onPaste={(e) => {
            e.preventDefault();
            const text = (e.clipboardData?.getData("text/plain") ?? "").slice(0, MAX_IMPORT_LENGTH);
            setImportPaste((prev) => (prev + text).slice(0, MAX_IMPORT_LENGTH));
          }}
          placeholder="Paste LinkedIn profile, resume, or any career text here…"
          rows={4}
          className={inputCls()}
        />
        {importPaste.length > 0 && (
          <p
            className={`text-xs font-medium ${
              importPaste.length >= MAX_IMPORT_LENGTH ? "text-amber-300" : "text-[var(--text-tertiary)]"
            }`}
          >
            {importPaste.length.toLocaleString()} / {MAX_IMPORT_LENGTH.toLocaleString()} chars
          </p>
        )}
        <button
          type="button"
          onClick={handleImport}
          disabled={importLoading || !importPaste.trim()}
          className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all ${
            importLoading || !importPaste.trim()
              ? "bg-zinc-600 opacity-50 cursor-not-allowed"
              : "bg-[var(--accent)] hover:opacity-90"
          }`}
        >
          {importLoading ? "Importing…" : "Import with AI"}
        </button>
      </Section>

      {/* Test account sample data */}
      {isTestAccount && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Test account</p>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            Load sample data to try resumes, ATS scores, and cover letters.
          </p>
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={seedLoading}
            className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-200 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50"
          >
            {seedLoading ? "Loading…" : "Load sample data"}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Contact ──────────────────────────────────────────────────────── */}
        <Section
          title="Contact"
          hint="Appears at the top of every generated resume."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                First name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.contact?.firstName ?? ""}
                required
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    contact: {
                      ...p.contact,
                      firstName: e.target.value,
                      name: [e.target.value, p.contact?.lastName].filter(Boolean).join(" ").trim(),
                    },
                  }))
                }
                className={inputCls()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Last name</label>
              <input
                type="text"
                value={form.contact?.lastName ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    contact: {
                      ...p.contact,
                      lastName: e.target.value,
                      name: [p.contact?.firstName, e.target.value].filter(Boolean).join(" ").trim(),
                    },
                  }))
                }
                className={inputCls()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email</label>
              <input
                type="email"
                value={form.contact?.email ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact: { ...p.contact, email: e.target.value } }))
                }
                className={inputCls()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Phone</label>
              <input
                type="text"
                value={form.contact?.phone ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact: { ...p.contact, phone: e.target.value } }))
                }
                placeholder="+1 (555) 000-0000"
                className={inputCls()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Location</label>
              <VoiceField
                onAppend={(t) =>
                  setForm((p) => ({
                    ...p,
                    contact: { ...p.contact, location: ((p.contact?.location ?? "") + " " + t).trim() },
                  }))
                }
              >
                <input
                  type="text"
                  value={form.contact?.location ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contact: { ...p.contact, location: e.target.value } }))
                  }
                  placeholder="New York, NY"
                  className={inputCls()}
                />
              </VoiceField>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">LinkedIn</label>
              <input
                type="url"
                value={form.contact?.linkedin ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact: { ...p.contact, linkedin: e.target.value } }))
                }
                placeholder="https://linkedin.com/in/you"
                className={inputCls()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Website / Portfolio
              </label>
              <input
                type="url"
                value={form.contact?.website ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact: { ...p.contact, website: e.target.value } }))
                }
                placeholder="https://yoursite.com"
                className={inputCls()}
              />
            </div>
          </div>
        </Section>

        {/* ── Professional identity ─────────────────────────────────────────── */}
        <Section
          title="Professional identity"
          hint="AI uses your headline, summary, and goals to write a strong opening for each application."
        >
          {/* Headline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Headline</label>
              <button
                type="button"
                onClick={suggestHeadlines}
                disabled={ai.headlineLoading}
                className="text-xs text-[var(--accent)] hover:opacity-80 disabled:opacity-40 transition"
              >
                {ai.headlineLoading ? "Thinking…" : "✦ AI suggestions"}
              </button>
            </div>
            <VoiceField
              onAppend={(t) =>
                setForm((p) => ({ ...p, headline: ((p.headline ?? "") + " " + t).trim() }))
              }
            >
              <input
                type="text"
                value={form.headline ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
                placeholder="Senior Software Engineer | Full-Stack & Cloud"
                className={inputCls()}
              />
            </VoiceField>
            {ai.headlineSuggestions && ai.headlineSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {ai.headlineSuggestions.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, headline: h }));
                      setAi((a) => ({ ...a, headlineSuggestions: null }));
                    }}
                    className="px-3 py-1.5 text-xs rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/25 transition-colors text-left"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Professional summary */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Professional summary
              </label>
              <button
                type="button"
                onClick={draftSummary}
                disabled={ai.summaryLoading}
                className="text-xs text-[var(--accent)] hover:opacity-80 disabled:opacity-40 transition"
              >
                {ai.summaryLoading ? "Drafting…" : "✦ Draft with AI"}
              </button>
            </div>
            <VoiceField
              onAppend={(t) =>
                setForm((p) => ({ ...p, summary: [p.summary, t].filter(Boolean).join(" ").trim() }))
              }
            >
              <textarea
                rows={4}
                value={form.summary ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                placeholder="2–4 sentences. What you do, how long you've done it, your biggest strength."
                className={inputCls()}
              />
            </VoiceField>
            {ai.summaryDraft && (
              <div className="mt-2 p-3 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/25">
                <p className="text-xs text-[var(--accent)] mb-1.5">AI draft — click Apply to use:</p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{ai.summaryDraft}</p>
                <div className="flex gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, summary: ai.summaryDraft ?? p.summary }));
                      setAi((a) => ({ ...a, summaryDraft: null }));
                    }}
                    className="px-3 py-1 text-xs rounded-lg bg-[var(--accent)] text-white hover:opacity-90"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => setAi((a) => ({ ...a, summaryDraft: null }))}
                    className="px-3 py-1 text-xs rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Target roles */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Target roles
            </label>
            <input
              type="text"
              value={form.target_roles?.join(", ") ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  target_roles: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="Software Engineer, Backend Developer, Tech Lead"
              className={inputCls()}
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Comma-separated. Helps AI match keywords.</p>
          </div>

          {/* Career goals */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Career goals</label>
            <VoiceField
              onAppend={(t) =>
                setForm((p) => ({
                  ...p,
                  career_goals: [p.career_goals, t].filter(Boolean).join(" ").trim(),
                }))
              }
            >
              <textarea
                rows={2}
                value={form.career_goals ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, career_goals: e.target.value }))}
                placeholder="e.g. Move into a tech lead role, focus on distributed systems"
                className={inputCls()}
              />
            </VoiceField>
          </div>
        </Section>

        {/* ── Work experience ───────────────────────────────────────────────── */}
        <Section
          title="Work experience"
          hint="The most important section. Add bullet points — AI rewrites them to match each job description."
          action={
            <button
              type="button"
              onClick={addExperience}
              className="text-xs font-medium text-[var(--accent)] hover:opacity-80 transition shrink-0"
            >
              + Add role
            </button>
          }
        >
          {(form.experience ?? []).length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
              No roles added yet.{" "}
              <button
                type="button"
                onClick={addExperience}
                className="text-[var(--accent)] underline hover:opacity-80"
              >
                Add your first
              </button>
              {" "}or use Quick import above.
            </p>
          )}
          {(form.experience ?? []).map((exp, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Role {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeExperience(i)}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => updateExperience(i, "company", e.target.value)}
                  className={inputCls()}
                />
                <input
                  type="text"
                  placeholder="Job title / Role"
                  value={exp.role}
                  onChange={(e) => updateExperience(i, "role", e.target.value)}
                  className={inputCls()}
                />
                <input
                  type="text"
                  placeholder="Start (e.g. Jan 2020)"
                  value={exp.start}
                  onChange={(e) => updateExperience(i, "start", e.target.value)}
                  className={inputCls()}
                />
                <input
                  type="text"
                  placeholder="End (e.g. Present)"
                  value={exp.end}
                  onChange={(e) => updateExperience(i, "end", e.target.value)}
                  className={inputCls()}
                />
              </div>

              {/* Bullet points */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    What you did (one bullet per line)
                  </label>
                  <button
                    type="button"
                    onClick={() => suggestBulletsForExp(i)}
                    disabled={ai.bulletLoadingIdx === i}
                    className="text-xs text-[var(--accent)] hover:opacity-80 disabled:opacity-40 transition"
                  >
                    {ai.bulletLoadingIdx === i ? "Suggesting…" : "✦ AI bullets"}
                  </button>
                </div>
                <VoiceField
                  onAppend={(t) => {
                    const existing = exp.bullets?.join("\n") ?? "";
                    const next = [existing, t].filter(Boolean).join("\n");
                    updateExperience(i, "bullets", next.split("\n").map((s) => s.trim()).filter(Boolean));
                  }}
                >
                  <textarea
                    rows={3}
                    value={exp.bullets?.join("\n") ?? ""}
                    onChange={(e) =>
                      updateExperience(
                        i,
                        "bullets",
                        e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="Led migration to microservices, reducing deploy time by 60%…"
                    className={inputCls()}
                  />
                </VoiceField>
                {ai.bulletSuggestions[i] && ai.bulletSuggestions[i].length > 0 && (
                  <div className="mt-2 p-3 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/25 space-y-1">
                    <p className="text-xs text-[var(--accent)] mb-1">Suggested — click to add:</p>
                    {ai.bulletSuggestions[i].map((b, bi) => (
                      <button
                        key={bi}
                        type="button"
                        onClick={() => {
                          updateExperience(i, "bullets", [...(exp.bullets ?? []), b]);
                          setAi((a) => {
                            const updated = { ...a.bulletSuggestions };
                            updated[i] = updated[i].filter((_, idx) => idx !== bi);
                            return { ...a, bulletSuggestions: updated };
                          });
                        }}
                        className="block w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                      >
                        + {b}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setAi((a) => ({ ...a, bulletSuggestions: { ...a.bulletSuggestions, [i]: [] } }))
                      }
                      className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </Section>

        {/* ── Education ─────────────────────────────────────────────────────── */}
        <Section
          title="Education"
          hint="Degree, school, and graduation year. AI includes this on every resume."
          action={
            <button
              type="button"
              onClick={addEducation}
              className="text-xs font-medium text-[var(--accent)] hover:opacity-80 transition shrink-0"
            >
              + Add
            </button>
          }
        >
          {(form.education ?? []).length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-2">
              No education added yet.
            </p>
          )}
          {(form.education ?? []).map((edu, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] grid gap-2 sm:grid-cols-2"
            >
              <input
                type="text"
                placeholder="School or University"
                value={edu.school}
                onChange={(e) => updateEducation(i, "school", e.target.value)}
                className={inputCls()}
              />
              <input
                type="text"
                placeholder="Degree, e.g. B.S. Computer Science"
                value={edu.degree}
                onChange={(e) => updateEducation(i, "degree", e.target.value)}
                className={inputCls()}
              />
              <input
                type="text"
                placeholder="Start year"
                value={edu.start}
                onChange={(e) => updateEducation(i, "start", e.target.value)}
                className={inputCls()}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="End year"
                  value={edu.end}
                  onChange={(e) => updateEducation(i, "end", e.target.value)}
                  className={inputCls("flex-1")}
                />
                <button
                  type="button"
                  onClick={() => removeEducation(i)}
                  className="text-xs text-red-400 hover:text-red-300 px-2 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </Section>

        {/* ── Skills ────────────────────────────────────────────────────────── */}
        <Section
          title="Skills"
          hint="AI matches your skills to job requirements and highlights the relevant ones."
        >
          <VoiceField
            onAppend={(t) => {
              const extra = t
                .split(/[,\n]/)
                .map((s) => s.trim())
                .filter(Boolean);
              setForm((p) => ({ ...p, skills: [...new Set([...(p.skills ?? []), ...extra])] }));
            }}
          >
            <TagInput
              tags={form.skills ?? []}
              onChange={(tags) => setForm((p) => ({ ...p, skills: tags }))}
              placeholder="Type a skill, press Enter or comma to add…"
            />
          </VoiceField>
          <p className="text-xs text-[var(--text-tertiary)]">Press Enter or type a comma to add a skill. Click × to remove. Add as many as you like — AI picks the most relevant per job.</p>
        </Section>

        {/* ── Projects ─────────────────────────────────────────────────────── */}
        <Section
          title="Projects"
          hint="Personal or open-source projects. AI adds the most relevant ones to your resume."
          action={
            <button
              type="button"
              onClick={addProject}
              className="text-xs font-medium text-[var(--accent)] hover:opacity-80 transition shrink-0"
            >
              + Add project
            </button>
          }
        >
          {(form.projects ?? []).length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-2">
              No projects added yet.
            </p>
          )}
          {(form.projects ?? []).map((proj, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2.5"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Project {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeProject(i)}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Project name"
                  value={proj.name}
                  onChange={(e) => updateProject(i, "name", e.target.value)}
                  className={inputCls()}
                />
                <input
                  type="url"
                  placeholder="URL (GitHub, live site…)"
                  value={proj.url ?? ""}
                  onChange={(e) => updateProject(i, "url", e.target.value)}
                  className={inputCls()}
                />
              </div>
              <VoiceField
                onAppend={(t) =>
                  updateProject(i, "description", ((proj.description ?? "") + " " + t).trim())
                }
              >
                <textarea
                  rows={2}
                  placeholder="What does it do? Tech stack, scale, impact."
                  value={proj.description ?? ""}
                  onChange={(e) => updateProject(i, "description", e.target.value)}
                  className={inputCls()}
                />
              </VoiceField>
            </div>
          ))}
        </Section>

        {/* ── Achievements ──────────────────────────────────────────────────── */}
        <Section
          title="Achievements & awards"
          hint="Quantified wins and recognition. AI uses these to strengthen your resume bullets."
        >
          <VoiceField
            onAppend={(t) => {
              const next = [form.achievements?.join("\n"), t].filter(Boolean).join("\n");
              setForm((p) => ({
                ...p,
                achievements: next.split("\n").map((s) => s.trim()).filter(Boolean),
              }));
            }}
          >
            <textarea
              rows={3}
              value={form.achievements?.join("\n") ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  achievements: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              placeholder={`One per line, e.g.\nIncreased revenue 40% through new checkout flow\nWon internal hackathon 2023\nPromoted to senior in 18 months`}
              className={inputCls()}
            />
          </VoiceField>
        </Section>

        {/* ── Save button — fixed on mobile ────────────────────────────────── */}
        <div
          className="fixed left-0 right-0 lg:static lg:bottom-auto lg:left-auto lg:right-auto z-30 p-4 sm:p-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none border-t border-[var(--border-subtle)] lg:border-0"
          style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
        >
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-[var(--accent)]/20"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
            {saving && (
              <p className="text-sm text-[var(--text-secondary)]">Saving to Supabase…</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
