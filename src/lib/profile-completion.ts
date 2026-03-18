/**
 * Shared profile completion logic — used by both the server-side profile page
 * sidebar and the client-side ProfileForm completion bar.
 */

export interface CompletionItem {
  label: string;
  done: boolean;
}

export interface CompletionResult {
  score: number;
  items: CompletionItem[];
}

export interface CompletionInput {
  firstName?: string | null;
  email?: string | null;
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  linkedin?: string | null;
  website?: string | null;
  targetRoles?: unknown[] | null;
  experience?: unknown[] | null;
  education?: unknown[] | null;
  skills?: unknown[] | null;
}

export function computeProfileCompletion(input: CompletionInput): CompletionResult {
  const items: CompletionItem[] = [
    { label: "First name", done: Boolean(input.firstName?.trim()) },
    { label: "Email", done: Boolean(input.email?.trim()) },
    { label: "Location", done: Boolean(input.location?.trim()) },
    { label: "Headline", done: Boolean(input.headline?.trim()) },
    {
      label: "Summary",
      done: Boolean(input.summary?.trim()) && (input.summary?.trim().length ?? 0) > 40,
    },
    { label: "Target roles", done: (input.targetRoles?.length ?? 0) > 0 },
    { label: "Work experience", done: (input.experience?.length ?? 0) > 0 },
    { label: "Education", done: (input.education?.length ?? 0) > 0 },
    { label: "Skills (3+)", done: (input.skills?.length ?? 0) >= 3 },
    {
      label: "LinkedIn or website",
      done: Boolean(input.linkedin?.trim() || input.website?.trim()),
    },
  ];

  const filled = items.filter((i) => i.done).length;
  const score = Math.round((filled / items.length) * 100);
  return { score, items };
}
