"use client";

import { useState, useRef, useEffect } from "react";
import { CareerCard } from "./CareerCard";
import type { CareerSuggestionItem } from "@/types/career";
import { AuthToast } from "@/components/AuthToast";

type Message =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "assistant"; careerSuggestions: CareerSuggestionItem[] };

const WELCOME = `I'll ask you a few short questions so I can suggest careers that could fit you—including pay, what it takes to get there, and what the day-to-day is like. There are no wrong answers.`;

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! I'm here to help you explore careers you'd enjoy and feel fulfilled in. " + WELCOME + " Ready? What do you enjoy doing most—at work or in your free time?",
};

export function CareerChat({ onSaved }: { onSaved?: () => void } = {}) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingTitle, setSavingTitle] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error" | "info"; message: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSaveCareer(career: CareerSuggestionItem) {
    setSaveError(null);
    setSavingTitle(career.title);
    try {
      const res = await fetch("/api/career/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(career),
      });
      if (res.ok) {
        setSavedTitles((prev) => new Set(prev).add(career.title));
        onSaved?.();
        setToast({ kind: "success", message: `Saved: ${career.title}` });
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? "Failed to save career. Please try again.");
        setToast({ kind: "error", message: data.error ?? "Failed to save career" });
      }
    } catch {
      setSaveError("Could not reach the server. Please try again.");
      setToast({ kind: "error", message: "Could not reach the server" });
    } finally {
      setSavingTitle(null);
    }
  }

  function startOver() {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const history: { role: string; content: string }[] = [
        { role: "assistant", content: messages[0].role === "assistant" && "content" in messages[0] ? messages[0].content : WELCOME },
      ];
      messages.forEach((m, i) => {
        if (i === 0 && m.role === "assistant") return;
        if (m.role === "user") history.push({ role: "user", content: m.content });
        else if (m.role === "assistant" && "content" in m) history.push({ role: "assistant", content: m.content });
        else if (m.role === "assistant" && "careerSuggestions" in m) {
          const titles = m.careerSuggestions.map((c) => c.title).join(", ");
          history.push({ role: "assistant", content: `I suggested these careers: ${titles}. (User sees full details with salary, education, tips, etc.)` });
        }
      });
      history.push({ role: "user", content: text });

      const res = await fetch("/api/career/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Sorry, something went wrong: ${data.error ?? res.statusText}. Try again.` },
        ]);
        return;
      }
      if (data.type === "question") {
        setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
      } else if (data.type === "career_suggestions" && Array.isArray(data.suggestions)) {
        setMessages((prev) => [...prev, { role: "assistant", careerSuggestions: data.suggestions }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: JSON.stringify(data) }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col max-w-3xl">
      {toast && (
        <AuthToast
          kind={toast.kind}
          message={toast.message}
          onDismiss={() => setToast(null)}
          autoHideMs={3500}
        />
      )}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={startOver}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
        >
          Start over
        </button>
      </div>
      <div className="space-y-6 pb-4 min-h-[320px] max-h-[60vh] overflow-y-auto pr-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "user" ? (
              <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 bg-[var(--accent)] text-white text-sm max-w-[85%]">
                {m.content}
              </div>
            ) : "careerSuggestions" in m ? (
              <div className="w-full space-y-4">
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Here are careers that could fit you:
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {m.careerSuggestions.map((c, j) => (
                    <CareerCard
                      key={j}
                      career={c}
                      actions={{
                        onSave: savedTitles.has(c.title) ? undefined : () => handleSaveCareer(c),
                        saving: savingTitle === c.title,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Want to explore more? Tell me what you liked or what you’d change and we can refine.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm max-w-[85%]">
                {m.content}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] text-sm">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {saveError && (
        <p className="text-xs text-red-400 py-1">{saveError}</p>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex gap-2 pt-2 border-t border-[var(--border-subtle)]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer or ask something…"
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary px-5 py-3 text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
