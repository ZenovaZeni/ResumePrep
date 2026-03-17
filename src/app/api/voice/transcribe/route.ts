import { NextResponse } from "next/server";

// Uses OPENAI_WHISPER_API_KEY if set, falls back to OPENAI_API_KEY.
function getWhisperKey(): string | null {
  return process.env.OPENAI_WHISPER_API_KEY ?? process.env.OPENAI_API_KEY ?? null;
}

export async function POST(request: Request) {
  const key = getWhisperKey();
  if (!key) {
    return NextResponse.json(
      { error: "Whisper transcription not configured. Set OPENAI_API_KEY or OPENAI_WHISPER_API_KEY in .env.local." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json({ error: "audio (Blob) is required" }, { status: 400 });
    }

    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, "recording.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "en");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: whisperForm,
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Whisper API error: ${res.status} ${err}` }, { status: 500 });
    }

    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ transcript: data.text?.trim() ?? "" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
