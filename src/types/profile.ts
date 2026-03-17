export interface ExperienceEntry {
  company: string;
  role: string;
  location?: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface EducationEntry {
  school: string;
  degree: string;
  field?: string;
  start: string;
  end: string;
}

export interface ProjectEntry {
  name: string;
  description?: string;
  url?: string;
  bullets?: string[];
}

export interface CareerProfileFormData {
  headline?: string;
  summary?: string;
  target_roles?: string[];
  career_goals?: string;
  contact?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  skills?: string[];
  certifications?: string[];
  projects?: ProjectEntry[];
  achievements?: string[];
  metrics?: Record<string, string>;
}
