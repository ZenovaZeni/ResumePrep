/**
 * Voice mode (Phase 3.3): Whisper for speech-to-text, ElevenLabs for TTS.
 * Set OPENAI_WHISPER_API_KEY and ELEVENLABS_API_KEY in .env to enable.
 */

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_WHISPER_API_KEY;
  if (!key) throw new Error("OpenAI API key required for Whisper");
  const form = new FormData();
  form.append("file", audioBlob, "audio.webm");
  form.append("model", "whisper-1");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Whisper error: ${res.status}`);
  const data = (await res.json()) as { text?: string };
  return data.text?.trim() ?? "";
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY required for TTS");
  const res = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }
  );
  if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);
  return res.arrayBuffer();
}
