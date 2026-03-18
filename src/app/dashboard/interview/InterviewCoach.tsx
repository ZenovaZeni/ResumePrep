"use client";

import { useState, useRef, useEffect } from "react";
import type { InterviewType } from "@/types/database";
import { VoiceButton } from "@/components/VoiceButton";

const TYPES: { id: InterviewType; label: string; desc: string; icon: string }[] = [
  {
    id: "behavioral",
    label: "Behavioral",
    desc: "Tell me about a time when…",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    id: "technical",
    label: "Technical",
    desc: "Role-specific skills & knowledge",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  },
  {
    id: "situational",
    label: "Situational",
    desc: "What would you do if…",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
];

type FeedbackData = {
  clarity?: number;
  structure?: number;
  relevance?: number;
  summary?: string;
  raw?: string;
};

function parseFeedback(raw: string): FeedbackData {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return { raw };
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        <span className="text-xs font-semibold text-[var(--text-primary)]">{score}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );
}

export function InterviewCoach() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [interviewType, setInterviewType] = useState<InterviewType>("behavioral");
  const [roleContext, setRoleContext] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [feedbackRaw, setFeedbackRaw] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentQuestion && answerRef.current) {
      answerRef.current.focus();
    }
  }, [currentQuestion]);

  async function startSession() {
    setLoading(true);
    setError(null);
    setDone(false);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_type: interviewType,
          role_context: roleContext || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start");
      setSessionId(data.sessionId);
      setQuestionIndex(0);
      setCurrentQuestion(null);
      setFeedbackRaw(null);
      setAnswer("");
      const stepRes = await fetch("/api/interview/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: data.sessionId, question_index: 0 }),
      });
      const stepData = await stepRes.json();
      if (stepRes.ok) setCurrentQuestion(stepData.question);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!sessionId || currentQuestion === null || !answer.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_index: questionIndex,
          last_answer: answer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setFeedbackRaw(data.feedback ?? null);
      if (data.question) {
        setCurrentQuestion(data.question);
        setQuestionIndex((i) => i + 1);
      } else {
        setDone(true);
        setCurrentQuestion(null);
      }
      setAnswer("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSessionId(null);
    setCurrentQuestion(null);
    setFeedbackRaw(null);
    setAnswer("");
    setDone(false);
    setQuestionIndex(0);
    setError(null);
  }

  const feedback = feedbackRaw ? parseFeedback(feedbackRaw) : null;

  // ── Setup screen ─────────────────────────────────────────────────────────
  if (sessionId === null) {
    return (
      <div className="space-y-6">
        {/* Type selector */}
        <div>
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Interview type</p>
          <div className="grid grid-cols-3 gap-3">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setInterviewType(t.id)}
                className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-all ${
                  interviewType === t.id
                    ? "bg-[var(--accent)]/10 border-[var(--accent)]/50 ring-1 ring-[var(--accent)]/30"
                    : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  interviewType === t.id ? "bg-[var(--accent)]/20" : "bg-[var(--bg-tertiary)]"
                }`}>
                  <svg
                    className={`w-4 h-4 ${interviewType === t.id ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${interviewType === t.id ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] leading-snug mt-0.5">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Role context */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">
            Role / context <span className="font-normal normal-case text-[var(--text-tertiary)]">(optional but recommended)</span>
          </label>
          <input
            type="text"
            value={roleContext}
            onChange={(e) => setRoleContext(e.target.value)}
            placeholder="e.g. Senior Product Manager at a fintech startup"
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-colors"
          />
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5">Adding context makes the questions more relevant to the actual role you&apos;re targeting.</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        <button
          type="button"
          onClick={startSession}
          disabled={loading}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-[var(--accent)]/20"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Starting session…
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start mock interview
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Done screen ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Session complete</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
            You answered {questionIndex} question{questionIndex !== 1 ? "s" : ""}. The more you practise, the more natural your answers become.
          </p>
        </div>
        {feedback && (
          <div className="text-left p-5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Last answer feedback</p>
            {feedback.clarity !== undefined && <ScoreBar label="Clarity" score={feedback.clarity} />}
            {feedback.structure !== undefined && <div className="mt-2"><ScoreBar label="Structure" score={feedback.structure} /></div>}
            {feedback.relevance !== undefined && <div className="mt-2"><ScoreBar label="Relevance" score={feedback.relevance} /></div>}
            {(feedback.summary ?? feedback.raw) && (
              <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">{feedback.summary ?? feedback.raw}</p>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/20"
        >
          Start another session
        </button>
      </div>
    );
  }

  // ── Active interview screen ───────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${Math.min((questionIndex / 7) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs text-[var(--text-tertiary)] shrink-0">Q{questionIndex + 1} of ~7</span>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
        >
          End
        </button>
      </div>

      {/* Question card */}
      <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-8 h-8 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center mt-0.5">
            <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-1.5">
              {interviewType} · Question {questionIndex + 1}
            </p>
            <p className="text-[var(--text-primary)] font-medium leading-relaxed">
              {loading && !currentQuestion ? (
                <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Thinking of next question…
                </span>
              ) : (
                currentQuestion
              )}
            </p>
          </div>
        </div>

        {/* Feedback from previous answer */}
        {feedback && (
          <div className="mb-4 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Previous answer feedback</p>
            <div className="space-y-2">
              {feedback.clarity !== undefined && <ScoreBar label="Clarity" score={feedback.clarity} />}
              {feedback.structure !== undefined && <ScoreBar label="Structure" score={feedback.structure} />}
              {feedback.relevance !== undefined && <ScoreBar label="Relevance" score={feedback.relevance} />}
            </div>
            {(feedback.summary ?? feedback.raw) && (
              <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">{feedback.summary ?? feedback.raw}</p>
            )}
          </div>
        )}
      </div>

      {/* Answer area */}
      <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">Your answer</label>
          <VoiceButton
            onTranscript={(t) => setAnswer((prev) => prev ? `${prev} ${t}` : t)}
            useWhisper
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          />
        </div>
        <textarea
          ref={answerRef}
          rows={5}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer — or use the mic button to speak it…"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-none transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitAnswer();
            }
          }}
        />
        <p className="text-[10px] text-[var(--text-tertiary)]">Press ⌘+Enter to submit</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      <button
        type="button"
        onClick={submitAnswer}
        disabled={loading || !answer.trim()}
        className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-[var(--accent)]/20"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Getting feedback…
          </>
        ) : (
          <>
            Submit answer
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
