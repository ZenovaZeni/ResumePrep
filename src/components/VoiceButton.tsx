"use client";

import { useSpeechDictation, type DictationStatus } from "@/hooks/useSpeechDictation";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  useWhisper?: boolean;
  className?: string;
}

function MicIcon({ status }: { status: DictationStatus }) {
  if (status === "processing") {
    return (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    );
  }
  if (status === "listening") {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8" strokeLinecap="round" />
    </svg>
  );
}

export function VoiceButton({ onTranscript, useWhisper = false, className = "" }: VoiceButtonProps) {
  const { status, errorMessage, isSupported, start, stop } = useSpeechDictation({
    onTranscript,
    useWhisper,
  });

  if (!isSupported) return null;

  const isActive = status === "listening" || status === "processing";

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={isActive ? stop : start}
        title={isActive ? "Stop dictation" : "Dictate with voice"}
        className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all ${
          status === "listening"
            ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/40 animate-pulse"
            : status === "processing"
            ? "bg-indigo-500/20 text-indigo-300"
            : status === "error"
            ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
            : "bg-zinc-700/60 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
        } ${className}`}
      >
        <MicIcon status={status} />
      </button>
      {errorMessage && (
        <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-56 text-center text-xs bg-zinc-900 border border-amber-500/30 text-amber-300 rounded-lg px-2 py-1 z-10 pointer-events-none">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
