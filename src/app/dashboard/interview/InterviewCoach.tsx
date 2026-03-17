"use client";

import { useState } from "react";
import type { InterviewType } from "@/types/database";

const TYPES: { id: InterviewType; label: string }[] = [
  { id: "behavioral", label: "Behavioral" },
  { id: "technical", label: "Technical" },
  { id: "situational", label: "Situational" },
];

export function InterviewCoach() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [interviewType, setInterviewType] = useState<InterviewType>("behavioral");
  const [roleContext, setRoleContext] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSession() {
    setLoading(true);
    setError(null);
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
      setFeedback(null);
      setAnswer("");
      const stepRes = await fetch("/api/interview/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: data.sessionId,
          question_index: 0,
        }),
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
    if (!sessionId || currentQuestion === null) return;
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
      setFeedback(data.feedback ?? null);
      setCurrentQuestion(data.question);
      setQuestionIndex((i) => i + 1);
      setAnswer("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (sessionId === null) {
    return (
      <div className="max-w-md space-y-4 rounded-xl bg-zinc-900 border border-zinc-800 p-6">
        <div>
          <p className="text-zinc-500 text-xs mb-3">Voice mode (Whisper + ElevenLabs) can be enabled via env for speech input and AI voice questions.</p>
        <label className="block text-sm text-zinc-400 mb-2">Interview type</label>
          <select
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value as InterviewType)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          >
            {TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Role / context (optional)</label>
          <input
            type="text"
            value={roleContext}
            onChange={(e) => setRoleContext(e.target.value)}
            placeholder="e.g. Senior Backend Engineer at a startup"
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="button"
          onClick={startSession}
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Starting…" : "Start mock interview"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 rounded-xl bg-zinc-900 border border-zinc-800 p-6">
      <div>
        <p className="text-xs text-zinc-500 mb-1">Question {questionIndex + 1}</p>
        <p className="text-white text-lg">{currentQuestion ?? "…"}</p>
      </div>
      {feedback && (
        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
          <p className="text-xs text-indigo-300 mb-1">Feedback</p>
          <p className="text-zinc-200 text-sm">{feedback}</p>
        </div>
      )}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Your answer</label>
        <textarea
          rows={4}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={submitAnswer}
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Submit & next question"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSessionId(null);
            setCurrentQuestion(null);
            setFeedback(null);
            setAnswer("");
          }}
          className="px-6 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
        >
          End session
        </button>
      </div>
    </div>
  );
}
