import type { Tier } from "@/types/database";

export const FREE_COVER_LETTERS_PER_MONTH = 3;

export function canUseFeature(
  tier: Tier | null | undefined,
  feature: "cover_letter" | "tailor" | "ats" | "interview"
): { allowed: boolean; reason?: string } {
  const t = tier ?? "free";
  switch (feature) {
    case "cover_letter":
    case "tailor":
    case "ats":
      return { allowed: true };
    case "interview":
      return t === "pro"
        ? { allowed: true }
        : { allowed: false, reason: "Mock interview is a Pro feature." };
    default:
      return { allowed: true };
  }
}

export function isPro(tier: Tier | null | undefined): boolean {
  return tier === "pro";
}
