"use client";

import { CareerCard } from "./CareerCard";
import type { CareerSuggestionItem } from "@/types/career";

type SuggestionRow = {
  id: string;
  content: unknown;
  created_at: string;
};

export function CareerRecent({ suggestions }: { suggestions: SuggestionRow[] }) {
  const withCareers = suggestions.filter(
    (s) => {
      const c = s.content as { type?: string; suggestions?: CareerSuggestionItem[] } | null;
      return c?.type === "career_suggestions" && Array.isArray(c.suggestions) && c.suggestions.length > 0;
    }
  );
  if (withCareers.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-medium text-[var(--text-primary)] mb-3">Past career suggestions</h2>
      <p className="text-sm text-[var(--text-tertiary)] mb-4">
        From earlier conversations. Open the chat above to refine or explore more.
      </p>
      <ul className="space-y-6">
        {withCareers.map((s) => {
          const c = s.content as { suggestions: CareerSuggestionItem[] };
          return (
            <li key={s.id}>
              <p className="text-xs text-[var(--text-tertiary)] mb-2">
                {new Date(s.created_at).toLocaleString()}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {c.suggestions.map((career, j) => (
                  <CareerCard key={j} career={career} />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
