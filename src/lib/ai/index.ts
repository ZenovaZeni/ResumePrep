/**
 * Single AI provider abstraction. All resume generation, scoring, tailoring,
 * cover letters, and interview feedback go through getCompletion.
 */

export type AIProvider = "openai" | "anthropic";

async function getOpenAICompletion(
  prompt: string,
  options: { system?: string; maxTokens?: number } = {}
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        ...(options.system ? [{ role: "system" as const, content: options.system }] : []),
        { role: "user" as const, content: prompt },
      ],
      max_tokens: options.maxTokens ?? 2048,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (content == null) throw new Error("Empty response from OpenAI");
  return content;
}

async function getAnthropicCompletion(
  prompt: string,
  options: { system?: string; maxTokens?: number } = {}
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const res = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: options.maxTokens ?? 2048,
        system: options.system ?? "",
        messages: [{ role: "user", content: prompt }],
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text?.trim();
  if (text == null) throw new Error("Empty response from Anthropic");
  return text;
}

export async function getCompletion(
  prompt: string,
  options: { system?: string; maxTokens?: number; provider?: AIProvider } = {}
): Promise<string> {
  const provider = options.provider ?? (process.env.OPENAI_API_KEY ? "openai" : "anthropic");
  if (provider === "openai") {
    return getOpenAICompletion(prompt, options);
  }
  return getAnthropicCompletion(prompt, options);
}

export interface ResumeFromProfileInput {
  profile: {
    contact?: { name?: string; email?: string; phone?: string; location?: string; linkedin?: string; website?: string };
    headline?: string;
    summary?: string;
    experience?: Array<{ company: string; role: string; start: string; end: string; bullets: string[] }>;
    education?: Array<{ school: string; degree: string; field?: string; start: string; end: string }>;
    skills?: string[];
    certifications?: string[];
    projects?: Array<{ name: string; description?: string; bullets?: string[] }>;
    achievements?: string[];
  };
  template: string;
}

export async function generateResumeFromProfile(
  input: ResumeFromProfileInput
): Promise<string> {
  const system = `You are a professional resume writer. Output only valid JSON. No markdown, no code fence.

CRITICAL RULES — failure to follow these is a disqualifying error:
1. You MUST NOT invent, fabricate, or add any company names, job titles, dates, education institutions, degrees, skills, certifications, project names, or achievements that do not appear in the provided profile data.
2. You MAY only rewrite or improve the wording of existing bullets and summary using better action verbs and clearer phrasing — the underlying facts (companies, titles, dates, metrics) must be preserved exactly.
3. If experience/education/skills/certifications/projects/achievements are empty or absent in the profile, output empty arrays [] for those keys — do NOT fill them with examples.
4. The contact section MUST be taken directly from the profile contact fields. Do not add phone/email/location that is not in the profile.`;

  const hasExperience = (input.profile.experience?.length ?? 0) > 0;
  const hasEducation = (input.profile.education?.length ?? 0) > 0;
  const hasSkills = (input.profile.skills?.length ?? 0) > 0;

  const prompt = `Generate a structured resume as a single JSON object with these keys:
- contact: { name, email, phone, location, linkedin, website } — copy EXACTLY from the profile, do not add or change anything
- summary: rewrite the profile summary to be impactful and concise (2-4 sentences) — do NOT invent new facts
- experience: array of { company, role, location?, start, end, bullets } — use EXACTLY the companies, roles, and dates from the profile; only improve bullet wording${hasExperience ? "" : " — profile has no experience, output []"}
- education: array of { school, degree, field?, start, end } — copy EXACTLY from profile${hasEducation ? "" : " — profile has no education, output []"}
- skills: array of strings — only include skills listed in the profile${hasSkills ? "" : " — profile has no skills, output []"}
- certifications: copy exactly from profile, or []
- projects: copy exactly from profile (improve description wording only), or []
- achievements: copy exactly from profile, or []

Template style hint: "${input.template}" — use this to guide spacing and tone only, not to add content.

Profile data (this is the ONLY source of truth):
${JSON.stringify(input.profile, null, 2)}`;

  const raw = await getCompletion(prompt, { system, maxTokens: 4096 });
  const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
  return cleaned;
}

export async function improveBullet(bullet: string, roleContext?: string): Promise<string> {
  const system = `You are a resume expert. Return only the improved single bullet point. No explanation.`;
  const prompt = roleContext
    ? `Improve this resume bullet for a ${roleContext} role. Keep it one line and achievement-focused.\n\n"${bullet}"`
    : `Improve this resume bullet. Keep it one line and achievement-focused.\n\n"${bullet}"`;
  return getCompletion(prompt, { system, maxTokens: 150 });
}

export async function suggestBullets(
  role: string,
  company?: string,
  existingBullets?: string[]
): Promise<string[]> {
  const system = `You are a resume expert. Output a JSON array of 3-5 suggested bullet points (strings only). No other text.`;
  const prompt = `Suggest resume bullet points for role: ${role}${company ? ` at ${company}` : ""}.${existingBullets?.length ? ` Avoid duplicating: ${JSON.stringify(existingBullets)}` : ""}`;
  const raw = await getCompletion(prompt, { system, maxTokens: 512 });
  const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
  try {
    const arr = JSON.parse(cleaned) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return raw.split("\n").map((s) => s.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
  }
}

export interface ATSScoreResult {
  score: number;
  feedback: string[];
}

export type { MatchSummary } from "@/types/database";
import type { MatchSummary } from "@/types/database";

export async function analyzeMatch(
  profile: unknown,
  jobDescription: string,
  jobTitle: string,
  companyName: string
): Promise<MatchSummary> {
  const system = `You are a job-fit analyst. Analyze how well a candidate matches a job description. Output only valid JSON. No markdown, no code fence.

CRITICAL RULES:
- Every strength must cite a specific company, role, skill, or achievement from the candidate's profile.
- Do NOT invent skills, experiences, or accomplishments not present in the profile.
- matchedKeywords must only include keywords the candidate demonstrably has based on their profile data.
- If the candidate lacks data for a strength, omit it or leave strengths shorter.`;
  const prompt = `Analyze this candidate's fit for: ${jobTitle} at ${companyName}.

Job description:
${jobDescription}

Candidate profile (only use data from this — do not invent):
${JSON.stringify(profile)}

Output this exact JSON:
{
  "matchScore": <0-100, honest overall fit score>,
  "topKeywords": [<5-8 most important skills and terms the JD requires>],
  "matchedKeywords": [<only keywords the candidate demonstrably has from their profile>],
  "missingKeywords": [<keywords from topKeywords the candidate lacks or does not mention>],
  "strengths": [<2-3 specific reasons this candidate is a strong match, citing their ACTUAL experience only>],
  "gaps": [<1-2 specific gaps or concerns, honest and concrete>],
  "suggestedAngle": "<1-2 sentences: which part of their background to lead with for this application>"
}`;
  const raw = await getCompletion(prompt, { system, maxTokens: 1024 });
  const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as Partial<MatchSummary>;
    return {
      matchScore: typeof parsed.matchScore === "number" ? Math.min(100, Math.max(0, parsed.matchScore)) : 70,
      topKeywords: Array.isArray(parsed.topKeywords) ? parsed.topKeywords : [],
      matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      suggestedAngle: typeof parsed.suggestedAngle === "string" ? parsed.suggestedAngle : "",
    };
  } catch {
    return { matchScore: 70, topKeywords: [], matchedKeywords: [], missingKeywords: [], strengths: [], gaps: [], suggestedAngle: "" };
  }
}

export async function scoreResume(
  resumeText: string,
  jobDescription?: string
): Promise<ATSScoreResult> {
  const system = `You are an ATS (Applicant Tracking System) expert. Respond with a single JSON object: { "score": number 0-100, "feedback": string[] }. feedback should list specific improvements (keyword gaps, formatting, length, etc.).`;
  const prompt = jobDescription
    ? `Score this resume (0-100) for ATS compatibility and fit for this job. Resume:\n\n${resumeText}\n\nJob description:\n\n${jobDescription}`
    : `Score this resume (0-100) for general ATS compatibility. Resume:\n\n${resumeText}`;
  const raw = await getCompletion(prompt, { system, maxTokens: 1024 });
  const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { score?: number; feedback?: string[] };
    return {
      score: typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : 70,
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    };
  } catch {
    return { score: 70, feedback: ["Could not parse ATS feedback."] };
  }
}

export async function tailorResume(
  resumeData: unknown,
  profile: unknown,
  jobDescription: string
): Promise<string> {
  const system = `You are a resume expert optimizing for ATS and hiring manager relevance. Output only valid JSON with the identical structure as the input resume. No markdown, no code fence.

CRITICAL GROUNDING RULES — violating any of these is a disqualifying error:
1. NEVER add, invent, or fabricate new companies, job titles, dates, schools, or degrees.
2. NEVER add skills or certifications not already present in the input resume.
3. NEVER inflate or modify numeric metrics (e.g. do not change "20%" to "40%").
4. You MAY only: reword bullets for clarity and impact, reorder skills, rewrite the summary (within existing facts).
5. The output JSON must have the IDENTICAL structure and keys as the input resume.`;
  const prompt = `Tailor this resume to the job description. Follow these rules exactly:
1. Extract the 5-8 most critical keywords from the job description
2. Weave those exact terms into EXISTING experience bullets where genuinely applicable
3. Rewrite the summary to open with direct fit for this specific role — using only the candidate's real background
4. Reorder the skills array so JD-matched skills appear first (but do not add new skills)
5. Keep all company names, dates, job titles, and metrics EXACTLY as written
6. Do NOT add any experience or achievements not already in the resume
7. Return the full resume as one JSON object with identical structure to the input

Resume to tailor:
${JSON.stringify(resumeData)}

Profile context (for reference only, to understand the candidate's background):
${JSON.stringify(profile)}

Job description:
${jobDescription}`;
  const raw = await getCompletion(prompt, { system, maxTokens: 4096 });
  return raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
}

export type { CoverLetterModel } from "@/types/database";
import type { CoverLetterModel } from "@/types/database";

/**
 * Generates a structured cover letter as a CoverLetterModel JSON object.
 * The AI fills in the writing parts (greeting, paragraphs, closing, recipientName).
 * Static fields (senderName, date, etc.) are passed in by the caller from the profile.
 */
export async function generateStructuredCoverLetter(
  profile: Record<string, unknown> & { name?: string; email?: string; phone?: string; location?: string },
  jobDescription: string,
  companyName: string,
  jobTitle: string,
  highlight?: string
): Promise<CoverLetterModel> {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const system = `You are a sharp, experienced cover letter writer. Output only a single valid JSON object. No markdown, no code fence.

CRITICAL RULES — violating any of these is a disqualifying error:
- Every accomplishment, metric, or specific claim in the cover letter MUST come from the candidate's profile data.
- Do NOT invent companies, job titles, metrics, projects, or achievements.
- Do NOT add skills or experience not present in the profile.
- You MAY: rephrase for persuasiveness, select which real experience to highlight, adapt tone to the company.`;
  let prompt = `Write a cover letter for the ${jobTitle} role at ${companyName}.

Rules:
- 3 body paragraphs in "paragraphs": (1) hook — specific value statement tied to this role using the candidate's real background, (2) evidence — 1-2 concrete accomplishments from the candidate's ACTUAL experience, (3) close — specific reason for this company
- Pull 3-5 of the most critical requirements from the job description; address them using only the candidate's real background
- First paragraph must hook immediately — lead with value, not "I am writing to apply"
- Banned phrases: "I am excited/passionate/thrilled", "I would be a valuable asset", "I look forward to hearing from you"
- 220-300 words total across the 3 paragraphs
- If you can infer a hiring manager name from the job description, use it; otherwise use "Hiring Manager"
- Match company tone: startup/tech → direct and confident; enterprise/finance → professional; creative → personality

Job description:
${jobDescription}

Candidate profile (ONLY use data from this — do not invent):
${JSON.stringify(profile)}
${highlight?.trim() ? `\nHighlight specifically (from their real experience): ${highlight.trim()}` : ""}

Output EXACTLY this JSON shape (no other keys):
{
  "recipientName": "<hiring manager name or 'Hiring Manager'>",
  "greeting": "<e.g. 'Dear Sarah Chen,' or 'Dear Hiring Manager,'>",
  "paragraphs": ["<paragraph 1>", "<paragraph 2>", "<paragraph 3>"],
  "closing": "<e.g. 'Best regards,' or 'Sincerely,'>",
  "signature": "${profile.name ?? "Applicant"}"
}`;

  const raw = await getCompletion(prompt, { system, maxTokens: 1024 });
  const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
  let parsed: {
    recipientName?: string;
    greeting?: string;
    paragraphs?: unknown;
    closing?: string;
    signature?: string;
  };
  try {
    parsed = JSON.parse(cleaned) as typeof parsed;
  } catch {
    parsed = {};
  }

  return {
    senderName: (profile.name as string | undefined) ?? "",
    senderEmail: (profile.email as string | undefined) ?? "",
    senderPhone: (profile.phone as string | undefined) ?? undefined,
    senderLocation: (profile.location as string | undefined) ?? undefined,
    date: today,
    recipientName: typeof parsed.recipientName === "string" ? parsed.recipientName : "Hiring Manager",
    companyName,
    jobTitle,
    greeting: typeof parsed.greeting === "string" ? parsed.greeting : "Dear Hiring Manager,",
    paragraphs: Array.isArray(parsed.paragraphs)
      ? (parsed.paragraphs as unknown[]).filter((p): p is string => typeof p === "string")
      : [cleaned],
    closing: typeof parsed.closing === "string" ? parsed.closing : "Best regards,",
    signature: typeof parsed.signature === "string" ? parsed.signature : (profile.name as string | undefined) ?? "",
  };
}

export async function generateCoverLetter(
  profile: unknown,
  jobDescription: string,
  companyName: string,
  jobTitle: string,
  highlight?: string
): Promise<string> {
  const system = `You are a sharp, experienced cover letter writer. Your job is to produce letters that read like they were written by a confident, articulate human — not an AI.

Absolute rules:
- 3 paragraphs maximum. Each paragraph has one job: (1) hook — a specific value statement tied to this role, (2) evidence — 1-2 concrete accomplishments from the candidate's real experience that directly address the job's top requirements, (3) close — a specific reason this company is the right next step, not generic enthusiasm
- Pull 3-5 of the most critical requirements from the job description and make sure the letter directly addresses them using the candidate's actual background
- Embed 1-2 real examples from the candidate's profile: actual company names, project names, metrics, or outcomes they achieved — not vague claims
- Match the company tone: startup/tech companies → direct and confident; large corporate/finance/enterprise → professional but not stiff; creative/agency → show some personality
- Banned phrases (never use): "I am excited/passionate/thrilled", "I would be a valuable asset", "I bring a wealth of experience", "I am confident that", "I look forward to hearing from you", "Please find my resume attached", "I am writing to apply"
- First sentence must hook immediately — lead with what you bring, not who you are
- No filler sentences. Every sentence must carry weight
- 220-300 words total
- Output plain text only. No headers, no markdown, no salutation, no sign-off line`;

  let prompt = `Write a cover letter for the ${jobTitle} role at ${companyName}.

Step 1 — Identify the 3-5 most critical requirements from this job description:
${jobDescription}

Step 2 — Use this candidate's real background to address those requirements. Pull actual company names, roles, metrics, and accomplishments:
${JSON.stringify(profile)}

Step 3 — Infer company tone from the job description: Is this a startup? A large corporation? A creative agency? Match that energy in the writing.

Write the letter now. 3 paragraphs, no fluff, no AI-sounding phrases.`;

  if (highlight?.trim()) {
    prompt += `\n\nThe candidate specifically wants to highlight: ${highlight.trim()}. Weave this in naturally.`;
  }

  return getCompletion(prompt, { system, maxTokens: 1024 });
}

export async function runInterviewStep(
  interviewType: string,
  questionIndex: number,
  lastAnswer?: string,
  roleContext?: string
): Promise<{ question: string; feedback?: string }> {
  const system = `You are an interview coach. For each step respond with JSON: { "question": string, "feedback": string | null }. For the first step (index 0) only provide "question". After an answer, include brief "feedback" on clarity, structure, and relevance. Then provide the next "question".`;
  const prompt =
    questionIndex === 0
      ? `Start a ${interviewType} interview.${roleContext ? ` Role context: ${roleContext}` : ""} Provide the first question only.`
      : `Interview type: ${interviewType}. Previous answer: "${lastAnswer ?? ""}". Provide feedback on that answer, then the next question.`;
  const raw = await getCompletion(prompt, { system, maxTokens: 512 });
  const cleaned = raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { question?: string; feedback?: string };
    return {
      question: typeof parsed.question === "string" ? parsed.question : "Tell me more.",
      feedback: typeof parsed.feedback === "string" ? parsed.feedback : undefined,
    };
  } catch {
    return { question: raw.slice(0, 200), feedback: undefined };
  }
}

export async function getCareerSuggestions(
  profile: unknown,
  targetRole?: string
): Promise<string> {
  const system = `You are a career advisor. Provide concise, actionable suggestions: recommended roles, skill gaps, certifications to consider, and 1-2 learning resources. Use short paragraphs or bullet points.`;
  const prompt = targetRole
    ? `Based on this profile, suggest how to move toward the role: ${targetRole}. Profile: ${JSON.stringify(profile)}`
    : `Based on this profile, suggest recommended roles, skill gaps, and learning resources. Profile: ${JSON.stringify(profile)}`;
  return getCompletion(prompt, { system, maxTokens: 1024 });
}
