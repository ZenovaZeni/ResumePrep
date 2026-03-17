"use client";

import { useState } from "react";
import { CareerChat } from "./CareerChat";
import { QuickSuggestions } from "./QuickSuggestions";
import { SavedCareers } from "./SavedCareers";
import { CareerQA } from "./CareerQA";

type Tab = "chat" | "quick" | "qa";

export function CareerExplorer() {
  const [tab, setTab] = useState<Tab>("chat");
  const [savedKey, setSavedKey] = useState(0);

  function handleSaved() {
    setSavedKey((k) => k + 1);
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-1 p-1 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={`px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
            tab === "chat"
              ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Explore with chat
        </button>
        <button
          type="button"
          onClick={() => setTab("quick")}
          className={`px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
            tab === "quick"
              ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Quick suggestions
        </button>
        <button
          type="button"
          onClick={() => setTab("qa")}
          className={`px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
            tab === "qa"
              ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Ask a career question
        </button>
      </div>

      <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
        {tab === "chat" ? (
          <CareerChat onSaved={handleSaved} />
        ) : tab === "quick" ? (
          <QuickSuggestions onSaved={handleSaved} />
        ) : (
          <CareerQA />
        )}
      </div>

      <section>
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">Saved careers</h2>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">
          Careers you saved. Copy or download to share or keep, or dive deeper for more detail.
        </p>
        <SavedCareers key={savedKey} />
      </section>
    </div>
  );
}
