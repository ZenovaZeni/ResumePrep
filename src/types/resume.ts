/** Design/look for resume (layout, font, public page theme). Stored in resume_data.design. */
export interface ResumeDesign {
  templateId?: ResumeDesignTemplateId;
  fontFamily?: ResumeDesignFontId;
  /** Theme for public /r/[slug] page. Falls back to templateId. */
  publicTheme?: ResumeDesignTemplateId;
}

export type ResumeDesignTemplateId = "clean" | "minimal" | "professional" | "modern" | "compact";
export type ResumeDesignFontId = "sans" | "serif";

/** Template config: free vs pro, and recruiter-recommended. Test account can use all. */
export interface ResumeTemplateOption {
  id: ResumeDesignTemplateId;
  label: string;
  /** Free tier can use this template */
  free: boolean;
  /** Recruiters/ATS tend to prefer these: clear structure, scannable, standard sections */
  recommended?: boolean;
}

export const RESUME_VIEW_TEMPLATES: ResumeTemplateOption[] = [
  { id: "clean", label: "Clean", free: true, recommended: true },
  { id: "minimal", label: "Minimal", free: true },
  { id: "professional", label: "Professional", free: false, recommended: true },
  { id: "modern", label: "Modern", free: false },
  { id: "compact", label: "Compact", free: false },
];

export const DESIGN_TEMPLATES: { id: ResumeDesignTemplateId; label: string }[] =
  RESUME_VIEW_TEMPLATES.map((t) => ({ id: t.id, label: t.label }));

export const DESIGN_FONTS: { id: ResumeDesignFontId; label: string }[] = [
  { id: "sans", label: "Sans (modern)" },
  { id: "serif", label: "Serif (classic)" },
];

export const PUBLIC_THEMES: { id: ResumeDesignTemplateId; label: string }[] =
  RESUME_VIEW_TEMPLATES.map((t) => ({ id: t.id, label: t.label }));

const VALID_TEMPLATE_IDS: ResumeDesignTemplateId[] = ["clean", "minimal", "professional", "modern", "compact"];

export function getDefaultDesign(design?: ResumeDesign | null): ResumeDesign {
  const rawTemplate = design?.templateId ?? design?.publicTheme ?? "clean";
  const templateId = rawTemplate === "default" || !VALID_TEMPLATE_IDS.includes(rawTemplate as ResumeDesignTemplateId)
    ? "clean"
    : (rawTemplate as ResumeDesignTemplateId);
  const rawTheme = design?.publicTheme ?? templateId;
  const publicTheme = rawTheme === "default" || !VALID_TEMPLATE_IDS.includes(rawTheme as ResumeDesignTemplateId)
    ? "clean"
    : (rawTheme as ResumeDesignTemplateId);
  return {
    templateId,
    fontFamily: design?.fontFamily ?? "sans",
    publicTheme,
  };
}

export function canUseResumeTemplate(
  templateId: ResumeDesignTemplateId,
  tier: "free" | "pro" | null | undefined,
  isTestAccount: boolean
): boolean {
  if (isTestAccount) return true;
  const t = RESUME_VIEW_TEMPLATES.find((x) => x.id === templateId);
  if (!t) return true;
  return t.free || tier === "pro";
}

export interface ResumeData {
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  summary?: string;
  experience?: Array<{
    company: string;
    role: string;
    location?: string;
    start: string;
    end: string;
    bullets: string[];
  }>;
  education?: Array<{
    school: string;
    degree: string;
    field?: string;
    start: string;
    end: string;
  }>;
  skills?: string[];
  certifications?: string[];
  projects?: Array<{
    name: string;
    description?: string;
    url?: string;
    bullets?: string[];
  }>;
  achievements?: string[];
  template?: string;
  design?: ResumeDesign;
}

export const RESUME_TEMPLATES = [
  { id: "entry", label: "Entry Level" },
  { id: "professional", label: "Professional" },
  { id: "technical", label: "Technical" },
  { id: "executive", label: "Executive" },
  { id: "creative", label: "Creative" },
] as const;
