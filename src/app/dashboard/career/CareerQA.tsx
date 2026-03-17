"use client";

import { useState } from "react";

type QAAnswer = {
  summary: string;
  pros: string[];
  cons: string[];
  next_actions: string[];
  learning_path: string;
};

const EXAMPLE_QUESTIONS = [
  "Is cybersecurity right for me if I have no tech background?",
  "How do I pivot from retail into UX design?",
  "What's the fastest way to break into data science?",
  "Is product management hard to get into without an MBA?",
];

export function CareerQA() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<QAAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/career/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setAnswer(data as QAAnswer);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Ask any career question — pivoting fields, whether a role fits you, how long it takes, what hiring looks for — and get a structured answer tailored to your profile.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestion(q)}
              className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-2xl">
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How do I break into tech from a non-technical background?"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="btn-primary px-5 py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Getting answer…" : "Get answer"}
            </button>
          </div>
        </form>
      </div>

      {answer && (
        <div className="space-y-4 max-w-2xl">
          <div className="rounded-[var(--radius-lg)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] p-5 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Summary</p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{answer.summary}</p>
            </div>

            {(answer.pros?.length > 0 || answer.cons?.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {answer.pros?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Pros for you</p>
                    <ul className="space-y-1">
                      {answer.pros.map((p, i) => (
                        <li key={i} className="text-sm text-[var(--text-primary)] flex gap-2">
                          <span className="text-[var(--success)] shrink-0">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {answer.cons?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Challenges</p>
                    <ul className="space-y-1">
                      {answer.cons.map((c, i) => (
                        <li key={i} className="text-sm text-[var(--text-primary)] flex gap-2">
                          <span className="text-[var(--text-tertiary)] shrink-0">–</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {answer.next_actions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Your next 3 actions</p>
                <ol className="space-y-1 list-none">
                  {answer.next_actions.map((a, i) => (
                    <li key={i} className="text-sm text-[var(--text-primary)] flex gap-2.5">
                      <span className="text-[var(--accent)] font-semibold shrink-0">{i + 1}.</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {answer.learning_path && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">Learning path</p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{answer.learning_path}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => { setAnswer(null); setQuestion(""); }}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            Ask another question
          </button>
        </div>
      )}
    </div>
  );
}
