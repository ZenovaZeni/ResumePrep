/**
 * POST /api/profile/import-resume
 *
 * Accepts multipart/form-data with a "file" field (PDF or plain text).
 * - For .txt / text content: use the text directly.
 * - For PDF: extract raw text (best-effort using buffer → string, since
 *   next.js edge/node doesn't include a heavy PDF parser; we strip binary
 *   and pass the readable text characters).
 *
 * Then calls the AI extraction (same logic as /api/profile/import) and
 * returns { profile, career } for the client to preview before saving.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/ai";

const EXTRACT_SYSTEM = `You are a resume extraction assistant. Given raw text from a resume, extract structured data. Output ONLY a valid JSON object — no markdown, no code fence, no explanation.

CRITICAL: Only extract information that is explicitly present in the text.
- Do NOT invent, guess, or fill in missing companies, schools, dates, or skills.
- If a field is not present, omit it or use null.
- Output only the JSON.

Use this exact shape:
{
  "profile": {
    "first_name": "string or null",
    "last_name": "string or null"
  },
  "career": {
    "headline": "string or null",
    "summary": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "raw_experience": [
      { "company": "string", "role": "string", "start": "string", "end": "string", "bullets": ["string"] }
    ],
    "education": [
      { "school": "string", "degree": "string", "field": "string or omit", "start": "string", "end": "string" }
    ],
    "skills": ["string"],
    "certifications": ["string"],
    "projects": [{ "name": "string", "description": "string or omit", "bullets": ["string"] }],
    "achievements": ["string"]
  }
}`;

function extractTextFromBuffer(buffer: Buffer, mimeType: string): string {
  if (mimeType === "text/plain" || mimeType === "text/markdown") {
    return buffer.toString("utf-8");
  }
  // For PDF: strip binary and extract printable ASCII/UTF-8 runs.
  // This is a best-effort approach — a heavy parser (pdf-parse) would be better
  // but adds significant bundle weight. This catches most plain text embedded PDFs.
  const raw = buffer.toString("latin1");
  // Extract text between BT/ET operators (PDF text commands)
  const textParts: string[] = [];
  const btEt = /BT\s([\s\S]*?)ET/g;
  let m: RegExpExecArray | null;
  while ((m = btEt.exec(raw)) !== null) {
    const chunk = m[1];
    // Extract string literals: (...) and <hex>
    const parens = /\(([^)]*)\)/g;
    let p: RegExpExecArray | null;
    while ((p = parens.exec(chunk)) !== null) {
      const t = p[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\t/g, " ")
        .replace(/\\\\/g, "\\")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")");
      if (t.trim()) textParts.push(t);
    }
  }
  if (textParts.length > 0) return textParts.join(" ");
  // Fallback: grab any readable runs of printable characters
  const readable = raw.replace(/[^\x20-\x7E\n\r]/g, " ").replace(/\s{3,}/g, "\n");
  return readable;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = request.headers.get("content-type") ?? "";
    let resumeText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "A file is required" }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || "application/octet-stream";
      resumeText = extractTextFromBuffer(buffer, mimeType);
    } else {
      // Fallback: accept { text: string } JSON body (for plain text paste)
      const body = await request.json().catch(() => ({}));
      resumeText = (body as { text?: string }).text ?? "";
    }

    if (!resumeText.trim()) {
      return NextResponse.json({ error: "Could not extract text from the uploaded file" }, { status: 400 });
    }

    const raw = await getCompletion(
      `Extract structured resume data from the following text. Output only the JSON object.\n\n${resumeText.trim().slice(0, 30000)}`,
      { system: EXTRACT_SYSTEM, maxTokens: 4096 }
    );
    const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
    let parsed: { profile?: Record<string, unknown>; career?: Record<string, unknown> };
    try {
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON — please try again" }, { status: 500 });
    }

    return NextResponse.json({ profile: parsed.profile ?? {}, career: parsed.career ?? {} });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
