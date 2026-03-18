export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Tier = "free" | "pro";

export interface ProfilesRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  tier: Tier;
  created_at: string;
  updated_at: string;
}

export interface CareerProfilesRow {
  user_id: string;
  headline: string | null;
  summary: string | null;
  target_roles: string[] | null;
  career_goals: string | null;
  raw_experience: Json | null;
  skills: string[] | null;
  certifications: Json | null;
  education: Json | null;
  projects: Json | null;
  achievements: Json | null;
  metrics: Json | null;
  phone: string | null;
  location: string | null;
  updated_at: string;
}

export interface ResumesRow {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  resume_data: Json;
  created_at: string;
  updated_at: string;
}

export interface ResumeVariantsRow {
  id: string;
  resume_id: string;
  job_application_id: string | null;
  name: string;
  resume_data: Json;
  created_at: string;
}

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "final_interview"
  | "rejected"
  | "offer";

export type MatchSummary = {
  matchScore: number;
  topKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  suggestedAngle: string;
};

export type InterviewPrep = {
  questions: string[];
  brief: string;
  modelAnswers: string[];
};

export type CoverLetterModel = {
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  senderLocation?: string;
  date: string;
  recipientName: string;
  companyName: string;
  jobTitle: string;
  greeting: string;
  paragraphs: string[];
  closing: string;
  signature: string;
  tone?: string;
  lengthHint?: string;
};

export interface ApplicationsRow {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_description: string | null;
  job_url: string | null;
  date_applied: string | null;
  status: ApplicationStatus;
  notes: string | null;
  source: string;
  match_summary: MatchSummary | null;
  interview_prep: InterviewPrep | null;
  tailored_resume: Json | null;
  cover_letter: CoverLetterModel | null;
  ats_score: number | null;
  ats_feedback: Json | null;
  created_at: string;
  updated_at: string;
}

export type InterviewType = "behavioral" | "technical" | "situational";

export interface InterviewSessionsRow {
  id: string;
  user_id: string;
  interview_type: InterviewType;
  role_context: string | null;
  feedback: Json | null;
  created_at: string;
}

export type GeneratedDocumentType = "cover_letter" | "resume_export";

export interface GeneratedDocumentsRow {
  id: string;
  user_id: string;
  type: GeneratedDocumentType;
  application_id: string | null;
  resume_id: string | null;
  content: string | null;
  created_at: string;
}

export interface CareerSuggestionsRow {
  id: string;
  user_id: string;
  content: Json;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: ProfilesRow };
      career_profiles: { Row: CareerProfilesRow };
      resumes: { Row: ResumesRow };
      resume_variants: { Row: ResumeVariantsRow };
      applications: { Row: ApplicationsRow };
      interview_sessions: { Row: InterviewSessionsRow };
      generated_documents: { Row: GeneratedDocumentsRow };
      career_suggestions: { Row: CareerSuggestionsRow };
    };
  };
}
