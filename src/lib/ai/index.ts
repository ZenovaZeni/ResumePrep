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
  const system = `You are a resume expert. Output only valid JSON for the tailored resume. Same structure as the input resume (contact, summary, experience with bullets, education, skills, etc.). Rewrite bullets to match the job description keywords and requirements. No markdown.`;
  const prompt = `Tailor this resume to the job description. Preserve structure; rewrite experience bullets and summary to align with the role. Return the full resume as one JSON object.

Resume:
${JSON.stringify(resumeData)}

Profile (for context):
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
  const system = `You are a professional cover letter writer. Write a compelling, concise cover letter (3-4 short paragraphs). Use formal but warm tone. Do not use placeholders like [Your Name] - use the profile data. Output plain text only.`;
  let prompt = `Write a cover letter for ${jobTitle} at ${companyName}.

Job description:
${jobDescription}

Candidate profile (use this for personalization):
${JSON.stringify(profile)}`;
  if (highlight?.trim()) {
    prompt += `\n\nCandidate asked to highlight or emphasize: ${highlight.trim()}`;
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
