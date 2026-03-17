"use client";

import { useState, useEffect, useCallback } from "react";
import { CareerCard } from "./CareerCard";
import type { CareerSuggestionItem } from "@/types/career";
import type { CareerCardActions } from "./CareerCard";

type SavedRow = {
  id: string;
  title: string;
  career_data: CareerSuggestionItem;
  created_at: string;
};

export function SavedCareers() {
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await fetch("/api/career/saved");
      const data = await res.json();
      if (res.ok && Array.isArray(data.saved)) setSaved(data.saved);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  async function handleRemove(id: string) {
    try {
      const res = await fetch(`/api/career/saved/${id}`, { method: "DELETE" });
      if (res.ok) setSaved((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--text-tertiary)]">Loading saved careers…</p>
    );
  }
  if (saved.length === 0) {
    return (
      <p className="text-sm text-[var(--text-tertiary)]">
        No saved careers yet. Save any career from the chat or quick suggestions above.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {saved.map((s) => (
        <CareerCard
          key={s.id}
          career={s.career_data}
          actions={{
            savedId: s.id,
            onRemove: handleRemove,
          }}
        />
      ))}
    </div>
  );
}
