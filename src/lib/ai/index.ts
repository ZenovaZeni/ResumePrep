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
  const system = `You are a professional resume writer. Output only valid JSON. No markdown, no code fence.`;
  const prompt = `Generate a structured resume as a single JSON object with keys: contact (name, email, phone, location, linkedin, website), summary, experience (array of {company, role, location?, start, end, bullets}), education (array of {school, degree, field?, start, end}), skills (array of strings), certifications (array), projects (array of {name, description?, url?, bullets?}), achievements (array). Use the following profile and template "${input.template}". Format dates consistently. Make bullet points achievement-oriented and concise.

Profile:
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

export interface MatchSummary {
  matchScore: number;
  topKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  suggestedAngle: string;
}

export async function analyzeMatch(
  profile: unknown,
  jobDescription: string,
  jobTitle: string,
  companyName: string
): Promise<MatchSummary> {
  const system = `You are a job-fit analyst. Analyze how well a candidate matches a job description. Output only valid JSON. No markdown, no code fence.`;
  const prompt = `Analyze this candidate's fit for: ${jobTitle} at ${companyName}.

Job description:
${jobDescription}

Candidate profile:
${JSON.stringify(profile)}

Output this exact JSON:
{
  "matchScore": <0-100, honest overall fit score>,
  "topKeywords": [<5-8 most important skills and terms the JD requires>],
  "matchedKeywords": [<keywords from topKeywords the candidate demonstrably has>],
  "missingKeywords": [<keywords from topKeywords the candidate lacks or does not mention>],
  "strengths": [<2-3 specific reasons this candidate is a strong match, referencing their actual experience>],
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
  const system = `You are a resume expert optimizing for ATS and hiring manager relevance. Output only valid JSON with the identical structure as the input resume. No markdown, no code fence.`;
  const prompt = `Tailor this resume to the job description. Follow these rules exactly:
1. Extract the 5-8 most critical keywords and skills from the job description
2. Weave those exact terms into experience bullets where the candidate genuinely has that experience
3. Rewrite the summary to open with direct fit for this specific role (reference the job title or core requirement from the JD)
4. Reorder the skills array so JD-matched skills appear first
5. Keep all company names, dates, job titles, and any metrics exactly as written — never invent or inflate numbers
6. Only rewrite existing content — do not add experience the candidate does not have
7. Return the full resume as one JSON object with identical structure to the input

Resume:
${JSON.stringify(resumeData)}

Profile context (for reference):
${JSON.stringify(profile)}

Job description:
${jobDescription}`;
  const raw = await getCompletion(prompt, { system, maxTokens: 4096 });
  return raw.replace(/^```\w*\n?|\n?```$/g, "").trim();
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
