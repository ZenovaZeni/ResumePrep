"use client";

import { useRef, useState, useCallback } from "react";

export type DictationStatus = "idle" | "listening" | "processing" | "error";

interface UseSpeechDictationOptions {
  /** Called with the final transcript text when dictation ends. */
  onTranscript: (text: string) => void;
  /** Use Whisper backend instead of Web Speech API (requires recording + upload). */
  useWhisper?: boolean;
}

interface UseSpeechDictationReturn {
  status: DictationStatus;
  errorMessage: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
}

function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

function isMediaRecorderSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "MediaRecorder" in window;
}

/**
 * Phase 1: Web Speech API (browser dictation, no backend, best in Chrome).
 * Phase 2: Whisper (MediaRecorder → /api/voice/transcribe). Activated via useWhisper=true.
 */
export function useSpeechDictation({
  onTranscript,
  useWhisper = false,
}: UseSpeechDictationOptions): UseSpeechDictationReturn {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Web Speech refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Whisper / MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = useWhisper
    ? isMediaRecorderSupported()
    : isSpeechRecognitionSupported();

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const stopWhisper = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const start = useCallback(() => {
    setErrorMessage(null);

    if (useWhisper) {
      if (!isMediaRecorderSupported()) {
        setErrorMessage("Audio recording is not supported in this browser.");
        setStatus("error");
        return;
      }

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          streamRef.current = stream;
          chunksRef.current = [];
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          recorder.onstop = async () => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setStatus("processing");

            try {
              const blob = new Blob(chunksRef.current, { type: "audio/webm" });
              const form = new FormData();
              form.append("audio", blob);
              const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
              const data = (await res.json()) as { transcript?: string; error?: string };
              if (!res.ok || !data.transcript) {
                setErrorMessage(data.error ?? "Transcription failed.");
                setStatus("error");
                return;
              }
              onTranscript(data.transcript);
              setStatus("idle");
            } catch (e) {
              setErrorMessage(e instanceof Error ? e.message : "Transcription failed.");
              setStatus("error");
            }
          };

          recorder.start();
          setStatus("listening");
        })
        .catch((e) => {
          setErrorMessage(e instanceof Error ? e.message : "Microphone access denied.");
          setStatus("error");
        });

      return;
    }

    // Web Speech API path
    if (!isSpeechRecognitionSupported()) {
      setErrorMessage("Voice dictation is not supported in this browser. Try Chrome.");
      setStatus("error");
      return;
    }

    const SpeechRecognitionCtor =
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setErrorMessage("Voice dictation is not supported in this browser.");
      setStatus("error");
      return;
    }

    const rec = new SpeechRecognitionCtor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => setStatus("listening");
    rec.onerror = (e) => {
      setErrorMessage(
        e.error === "not-allowed"
          ? "Microphone access denied. Allow mic in your browser settings."
          : `Dictation error: ${e.error}`
      );
      setStatus("error");
    };
    rec.onend = () => {
      if (status !== "error") setStatus("idle");
    };
    rec.onresult = (e) => {
      const transcripts = Array.from(e.results)
        .filter((r) => r.isFinal)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcripts) onTranscript(transcripts);
    };

    recognitionRef.current = rec;
    rec.start();
  }, [onTranscript, useWhisper, status]);

  const stop = useCallback(() => {
    if (useWhisper) {
      stopWhisper();
    } else {
      stopRecognition();
      setStatus("idle");
    }
  }, [useWhisper, stopWhisper, stopRecognition]);

  return { status, errorMessage, isSupported, start, stop };
}
