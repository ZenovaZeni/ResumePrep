"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthToast } from "@/components/AuthToast";
import { VoiceButton } from "@/components/VoiceButton";
import type { ProfilesRow } from "@/types/database";
import type { CareerProfilesRow } from "@/types/database";
import type { CareerProfileFormData } from "@/types/profile";

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

// Truncate Supabase URL to last 8 chars for display (avoids exposing full URL)
function projectHint(url: string | undefined): string {
  if (!url) return "not set";
  try {
    const host = new URL(url).hostname;
    const id = host.split(".")[0] ?? "";
    return id.length > 8 ? `…${id.slice(-8)}` : id;
  } catch {
    return url.slice(-12);
  }
}

const FIX_SQL = `-- Paste this in Supabase Dashboard → SQL Editor → Run
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT, last_name TEXT, avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.career_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT, summary TEXT, target_roles TEXT[], career_goals TEXT,
  raw_experience JSONB, skills TEXT[], certifications JSONB,
  education JSONB, projects JSONB, achievements JSONB, metrics JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "career_profiles_select" ON public.career_profiles;
DROP POLICY IF EXISTS "career_profiles_insert" ON public.career_profiles;
DROP POLICY IF EXISTS "career_profiles_update" ON public.career_profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "career_profiles_select" ON public.career_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "career_profiles_insert" ON public.career_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "career_profiles_update" ON public.career_profiles FOR UPDATE USING (auth.uid() = user_id);
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.career_profiles TO authenticated;
NOTIFY pgrst, 'reload schema';`;

function DbErrorBanner({ loadError }: { loadError: string }) {
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const supabaseUrl =
    typeof window !== "undefined"
      ? (document.querySelector("meta[name='supabase-url']") as HTMLMetaElement | null)?.content ?? undefined
      : undefined;

  function copy() {
    void navigator.clipboard.writeText(FIX_SQL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-[var(--radius-lg)] bg-red-500/10 border border-red-500/30 p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-red-300 font-semibold">Database tables not found</p>
          <p className="text-sm text-red-200/80 mt-0.5">{loadError}</p>
        </div>
        <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">
          project: <span className="text-zinc-400">{projectHint(process.env.NEXT_PUBLIC_SUPABASE_URL)}</span>
        </span>
      </div>
      <p className="text-sm text-zinc-300">
        The <code className="font-mono text-xs bg-zinc-800 px-1 rounded">profiles</code> table needs to be created in your Supabase project.
        Open <strong>Supabase Dashboard → SQL Editor</strong> and run the fix SQL below:
      </p>
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={copy}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors"
        >
          {copied ? "Copied!" : "Copy fix SQL"}
        </button>
        <button
          type="button"
          onClick={() => setShowSql((s) => !s)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          {showSql ? "Hide SQL" : "Show SQL"}
        </button>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/40 transition-colors"
        >
          Open Supabase Dashboard →
        </a>
      </div>
      {showSql && (
        <pre className="text-xs text-zinc-300 bg-zinc-900/80 border border-zinc-700 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
          {FIX_SQL}
        </pre>
      )}
    </div>
  );
}

type AiState = {
  headlineSuggestions: string[] | null;
  headlineLoading: boolean;
  summaryDraft: string | null;
  summaryLoading: boolean;
  bulletSuggestions: Record<number, string[]>;
  bulletLoadingIdx: number | null;
};

export function ProfileForm({
  profile,
  careerProfile,
  userEmail,
  loadError,
}: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
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

  // Autofill first/last name + other contact fields from auth metadata if missing in DB.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const m = user.user_metadata ?? {};
      const metaFirst = ((m.first_name ?? m.firstName ?? "") as string).trim();
      const metaLast = ((m.last_name ?? m.lastName ?? "") as string).trim();
      const metaLinkedin = ((m.linkedin ?? m.linkedin_url ?? "") as string).trim();
      const metaWebsite = ((m.website ?? m.website_url ?? "") as string).trim();
      const metaLocation = ((m.location ?? m.city ?? "") as string).trim();

      setForm((prev) => {
        const hasFirst = Boolean(prev.contact?.firstName?.trim());
        const hasLast = Boolean(prev.contact?.lastName?.trim());
        const nextFirst = hasFirst ? prev.contact!.firstName! : (metaFirst || prev.contact?.firstName || "");
        const nextLast = hasLast ? prev.contact!.lastName! : (metaLast || prev.contact?.lastName || "");
        return {
          ...prev,
          contact: {
            ...prev.contact,
            firstName: nextFirst,
            lastName: nextLast,
            name: [nextFirst, nextLast].filter(Boolean).join(" ").trim() || prev.contact?.name,
            linkedin: prev.contact?.linkedin?.trim() || metaLinkedin || "",
            website: prev.contact?.website?.trim() || metaWebsite || "",
            location: prev.contact?.location?.trim() || metaLocation || "",
          },
        };
      });
    })();
    return () => { cancelled = true; };
  }, [supabase]);

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

  // ─── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!form.contact?.firstName?.trim()) {
      setMessage({ type: "error", text: "First name is required." });
      setSaving(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage({ type: "error", text: "Not signed in." });
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          first_name: form.contact?.firstName?.trim() || null,
          last_name: form.contact?.lastName?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      const isSchemaErr = profileError.message.includes("schema cache") || profileError.message.includes("not found");
      setMessage({
        type: "error",
        text: isSchemaErr
          ? "Database tables missing. Run the fix SQL in your Supabase SQL Editor (see the red banner above)."
          : profileError.message,
      });
      setSaving(false);
      return;
    }

    const { error: careerError } = await supabase
      .from("career_profiles")
      .upsert(
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

  // ─── Experience helpers ───────────────────────────────────────────────────
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

  // ─── Education helpers ───────────────────────────────────────────────────
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

  // ─── AI helpers ───────────────────────────────────────────────────────────
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
      setMessage({ type: "error", text: "Enter a role first before suggesting bullets." });
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

  // ─── Import helpers ───────────────────────────────────────────────────────
  async function handleLoadSample() {
    if (!isTestAccount) return;
    setSeedLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/seed", { method: "POST" });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error ?? res.statusText ?? "Failed to load sample data." });
        return;
      }
      setMessage({ type: "ok", text: "Sample data loaded. Refreshing…" });
      router.refresh();
    } catch (e) {
      setMessage({ type: "error", text: `Load sample data failed: ${e instanceof Error ? e.message : "error"}` });
    } finally {
      setSeedLoading(false);
    }
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
      const data = await res.json() as {
        error?: string;
        profile?: { first_name?: string | null; last_name?: string | null };
        career?: {
          headline?: string | null;
          summary?: string | null;
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
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Import failed." });
        return;
      }
      const { profile: impProfile, career: impCareer } = data;
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
          name: [impProfile?.first_name, impProfile?.last_name].filter(Boolean).join(" ").trim() || prev.contact?.name,
        },
        experience: Array.isArray(impCareer?.raw_experience) ? impCareer.raw_experience : prev.experience,
        education: Array.isArray(impCareer?.education) ? impCareer.education : prev.education,
        skills: impCareer?.skills ?? prev.skills,
        certifications: Array.isArray(impCareer?.certifications) ? impCareer.certifications : prev.certifications,
        projects: Array.isArray(impCareer?.projects) ? impCareer.projects : prev.projects,
        achievements: Array.isArray(impCareer?.achievements) ? impCareer.achievements : prev.achievements,
      }));
      setMessage({ type: "ok", text: "Profile imported. Review and edit below, then Save." });
      setImportPaste("");
    } catch {
      setMessage({ type: "error", text: "Import failed." });
    } finally {
      setImportLoading(false);
    }
  }

  // ─── Input/textarea field with optional voice button ──────────────────────
  function inputCls(extra = "") {
    return `w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${extra}`;
  }

  function VoiceField({
    children,
    onAppend,
  }: {
    children: React.ReactNode;
    onAppend: (t: string) => void;
  }) {
    return (
      <div className="flex items-start gap-2">
        <div className="flex-1">{children}</div>
        <VoiceButton
          onTranscript={(t) => onAppend(t)}
          className="mt-1 flex-shrink-0"
        />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      {loadError && <DbErrorBanner loadError={loadError} />}

      {message && (
        <AuthToast
          message={message.text}
          kind={message.type === "ok" ? "success" : "error"}
          onDismiss={dismissMessage}
          autoHideMs={6000}
        />
      )}

      {/* ── Import paste ── */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
        <h2 className="text-[var(--text-primary)] font-medium mb-1">Import from LinkedIn or resume</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Paste raw text and AI will fill the form below. Review then Save. Max {MAX_IMPORT_LENGTH.toLocaleString()} chars.
        </p>
        <textarea
          value={importPaste}
          onChange={(e) => setImportPaste(e.target.value.slice(0, MAX_IMPORT_LENGTH))}
          onPaste={(e) => {
            e.preventDefault();
            const text = (e.clipboardData?.getData("text/plain") ?? "").slice(0, MAX_IMPORT_LENGTH);
            setImportPaste((prev) => (prev + text).slice(0, MAX_IMPORT_LENGTH));
          }}
          placeholder="Paste LinkedIn profile or resume text here…"
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
        />
        {importPaste.length > 0 && (
          <p className={`mb-2 text-xs font-medium ${importPaste.length >= MAX_IMPORT_LENGTH ? "text-amber-300" : "text-indigo-300"}`}>
            {importPaste.length.toLocaleString()} / {MAX_IMPORT_LENGTH.toLocaleString()} chars
          </p>
        )}
        <button
          type="button"
          onClick={handleImport}
          disabled={importLoading || !importPaste.trim()}
          className={`px-4 py-2 rounded-[var(--radius-md)] text-white text-sm font-medium transition-all ${
            importLoading || !importPaste.trim()
              ? "bg-zinc-600 opacity-50 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500"
          }`}
        >
          {importLoading ? "Importing…" : "Import with AI"}
        </button>
      </div>

      {/* ── Test account sample ── */}
      {isTestAccount && (
        <div className="rounded-[var(--radius-lg)] bg-amber-500/10 border border-amber-500/30 p-4">
          <p className="text-[var(--text-primary)] font-medium mb-1">Test account</p>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Load sample profile data so you can try resumes, ATS, tailor, and cover letters without typing.
          </p>
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={seedLoading}
            className="px-4 py-2 rounded-[var(--radius-md)] bg-amber-500/20 text-amber-200 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50"
          >
            {seedLoading ? "Loading…" : "Load sample data"}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Contact ── */}
        <section className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <h2 className="text-lg font-medium text-white">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
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
              <label className="block text-sm text-zinc-400 mb-1">Last name</label>
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
              <label className="block text-sm text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={form.contact?.email ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, contact: { ...p.contact, email: e.target.value } }))}
                className={inputCls()}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Phone</label>
              <input
                type="text"
                value={form.contact?.phone ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, contact: { ...p.contact, phone: e.target.value } }))}
                className={inputCls()}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Location</label>
              <VoiceField onAppend={(t) => setForm((p) => ({ ...p, contact: { ...p.contact, location: ((p.contact?.location ?? "") + " " + t).trim() } }))}>
                <input
                  type="text"
                  value={form.contact?.location ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, contact: { ...p.contact, location: e.target.value } }))}
                  placeholder="e.g. New York, NY"
                  className={inputCls()}
                />
              </VoiceField>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">LinkedIn</label>
              <input
                type="url"
                value={form.contact?.linkedin ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, contact: { ...p.contact, linkedin: e.target.value } }))}
                placeholder="https://linkedin.com/in/you"
                className={inputCls()}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Website</label>
              <input
                type="url"
                value={form.contact?.website ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, contact: { ...p.contact, website: e.target.value } }))}
                placeholder="https://yoursite.com"
                className={inputCls()}
              />
            </div>
          </div>
        </section>

        {/* ── Summary ── */}
        <section className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <h2 className="text-lg font-medium text-white">Summary</h2>

          {/* Headline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-zinc-400">Headline</label>
              <button
                type="button"
                onClick={suggestHeadlines}
                disabled={ai.headlineLoading}
                className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
              >
                {ai.headlineLoading ? "Thinking…" : "✦ Suggest headlines"}
              </button>
            </div>
            <VoiceField
              onAppend={(t) => setForm((p) => ({ ...p, headline: ((p.headline ?? "") + " " + t).trim() }))}
            >
              <input
                type="text"
                value={form.headline ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
                placeholder="e.g. Senior Software Engineer | Full-Stack & Cloud"
                className={inputCls()}
              />
            </VoiceField>
            {ai.headlineSuggestions && ai.headlineSuggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-zinc-500">Click to apply:</p>
                <div className="flex flex-wrap gap-2">
                  {ai.headlineSuggestions.map((h, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setForm((p) => ({ ...p, headline: h }));
                        setAi((a) => ({ ...a, headlineSuggestions: null }));
                      }}
                      className="px-3 py-1.5 text-xs rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors text-left"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Professional summary */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-zinc-400">Professional summary</label>
              <button
                type="button"
                onClick={draftSummary}
                disabled={ai.summaryLoading}
                className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
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
                className={inputCls()}
              />
            </VoiceField>
            {ai.summaryDraft && (
              <div className="mt-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                <p className="text-xs text-indigo-300 mb-1">AI draft — click Apply to use:</p>
                <p className="text-sm text-zinc-200">{ai.summaryDraft}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, summary: ai.summaryDraft ?? p.summary }));
                      setAi((a) => ({ ...a, summaryDraft: null }));
                    }}
                    className="px-3 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => setAi((a) => ({ ...a, summaryDraft: null }))}
                    className="px-3 py-1 text-xs rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Target roles */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Target roles (comma-separated)</label>
            <input
              type="text"
              value={form.target_roles?.join(", ") ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  target_roles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                }))
              }
              placeholder="Software Engineer, Backend Developer"
              className={inputCls()}
            />
          </div>

          {/* Career goals */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Career goals</label>
            <VoiceField
              onAppend={(t) =>
                setForm((p) => ({ ...p, career_goals: [p.career_goals, t].filter(Boolean).join(" ").trim() }))
              }
            >
              <textarea
                rows={2}
                value={form.career_goals ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, career_goals: e.target.value }))}
                placeholder="e.g. Move into a tech lead role within 2 years"
                className={inputCls()}
              />
            </VoiceField>
          </div>
        </section>

        {/* ── Work experience ── */}
        <section className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Work experience</h2>
            <button type="button" onClick={addExperience} className="text-sm text-indigo-400 hover:underline">
              + Add
            </button>
          </div>
          {(form.experience ?? []).map((exp, i) => (
            <div key={i} className="p-4 rounded-lg bg-zinc-800 border border-zinc-700 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm font-medium">Experience #{i + 1}</span>
                <button type="button" onClick={() => removeExperience(i)} className="text-red-400 text-xs hover:underline">
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => updateExperience(i, "company", e.target.value)}
                  className="px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Role / Title"
                  value={exp.role}
                  onChange={(e) => updateExperience(i, "role", e.target.value)}
                  className="px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Start (e.g. Jan 2020)"
                  value={exp.start}
                  onChange={(e) => updateExperience(i, "start", e.target.value)}
                  className="px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="End (e.g. Present)"
                  value={exp.end}
                  onChange={(e) => updateExperience(i, "end", e.target.value)}
                  className="px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Bullets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400 text-sm">Bullet points (one per line)</label>
                  <button
                    type="button"
                    onClick={() => suggestBulletsForExp(i)}
                    disabled={ai.bulletLoadingIdx === i}
                    className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                  >
                    {ai.bulletLoadingIdx === i ? "Suggesting…" : "✦ Suggest bullets"}
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
                      updateExperience(i, "bullets", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))
                    }
                    placeholder="Led migration of legacy monolith to microservices…"
                    className="w-full px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </VoiceField>
                {ai.bulletSuggestions[i] && ai.bulletSuggestions[i].length > 0 && (
                  <div className="mt-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 space-y-1">
                    <p className="text-xs text-indigo-300 mb-1">Suggested bullets — click to add:</p>
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
                        className="block w-full text-left px-2 py-1.5 text-xs text-zinc-200 bg-zinc-700/60 hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        + {b}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAi((a) => ({ ...a, bulletSuggestions: { ...a.bulletSuggestions, [i]: [] } }))}
                      className="text-xs text-zinc-500 hover:text-zinc-400 mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* ── Education ── */}
        <section className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Education</h2>
            <button type="button" onClick={addEducation} className="text-sm text-indigo-400 hover:underline">
              + Add
            </button>
          </div>
          {(form.education ?? []).map((edu, i) => (
            <div key={i} className="p-4 rounded-lg bg-zinc-800 border border-zinc-700 flex gap-3 flex-wrap items-start">
              <input
                type="text"
                placeholder="School"
                value={edu.school}
                onChange={(e) => updateEducation(i, "school", e.target.value)}
                className="flex-1 min-w-[120px] px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Degree"
                value={edu.degree}
                onChange={(e) => updateEducation(i, "degree", e.target.value)}
                className="flex-1 min-w-[120px] px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Start"
                value={edu.start}
                onChange={(e) => updateEducation(i, "start", e.target.value)}
                className="w-24 px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="End"
                value={edu.end}
                onChange={(e) => updateEducation(i, "end", e.target.value)}
                className="w-24 px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button type="button" onClick={() => removeEducation(i)} className="text-red-400 text-sm hover:underline self-center">
                Remove
              </button>
            </div>
          ))}
        </section>

        {/* ── Skills ── */}
        <section className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <h2 className="text-lg font-medium text-white">Skills</h2>
          <VoiceField
            onAppend={(t) => {
              const extra = t.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
              setForm((p) => ({ ...p, skills: [...(p.skills ?? []), ...extra] }));
            }}
          >
            <input
              type="text"
              value={form.skills?.join(", ") ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))
              }
              placeholder="JavaScript, React, Node.js, Python"
              className={inputCls()}
            />
          </VoiceField>
        </section>

        {/* ── Achievements ── */}
        <section className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <h2 className="text-lg font-medium text-white">Achievements</h2>
          <VoiceField
            onAppend={(t) => {
              const next = [form.achievements?.join("\n"), t].filter(Boolean).join("\n");
              setForm((p) => ({ ...p, achievements: next.split("\n").map((s) => s.trim()).filter(Boolean) }));
            }}
          >
            <textarea
              rows={3}
              value={form.achievements?.join("\n") ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  achievements: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                }))
              }
              placeholder="One per line — e.g. Won internal hackathon 2023"
              className={inputCls()}
            />
          </VoiceField>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
          {saving && <p className="text-sm text-zinc-400">Saving to Supabase…</p>}
        </div>
      </form>
    </div>
  );
}
