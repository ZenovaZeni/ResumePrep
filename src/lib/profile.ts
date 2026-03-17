export function getDisplayName(profile: {
  first_name?: string | null;
  last_name?: string | null;
} | null): string {
  if (!profile) return "";
  const first = (profile.first_name ?? "").trim();
  const last = (profile.last_name ?? "").trim();
  return [first, last].filter(Boolean).join(" ");
}
