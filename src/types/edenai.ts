// src/types/edenai.ts
// Type definitions for EdenAI services

// Missing Sections JSON interface (STEP 3)
export interface MissingSections {
  missing_experience: boolean;
  missing_projects: boolean;
  missing_skills: boolean;
  missing_education: boolean;
  missing_summary: boolean;
  missing_certifications: boolean;
  missing_achievements: boolean;
  missing_contact_details: boolean;
}

// Convert array of missing section names to MissingSections object
export const arrayToMissingSections = (missing: string[]): MissingSections => {
  return {
    missing_experience: missing.includes('workExperience'),
    missing_projects: missing.includes('projects'),
    missing_skills: missing.includes('skills'),
    missing_education: missing.includes('education'),
    missing_summary: missing.includes('summary') || missing.includes('careerObjective'),
    missing_certifications: missing.includes('certifications'),
    missing_achievements: missing.includes('achievements'),
    missing_contact_details: missing.includes('contactDetails'),
  };
};

// Convert MissingSections object to array of section names
export const missingSectionsToArray = (sections: MissingSections): string[] => {
  const missing: string[] = [];
  if (sections.missing_experience) missing.push('workExperience');
  if (sections.missing_projects) missing.push('projects');
  if (sections.missing_skills) missing.push('skills');
  if (sections.missing_education) missing.push('education');
  if (sections.missing_summary) missing.push('summary');
  if (sections.missing_certifications) missing.push('certifications');
  if (sections.missing_achievements) missing.push('achievements');
  if (sections.missing_contact_details) missing.push('contactDetails');
  return missing;
};

// EdenAI Resume Parser types
export interface EdenAIPersonalInfo {
  name?: {
    first_name?: string;
    last_name?: string;
    raw_name?: string;
  };
  address?: {
    formatted_location?: string;
    city?: string;
    country?: string;
    postal_code?: string;
    region?: string;
    street?: string;
  };
  phones?: string[];
  mails?: string[];
  urls?: string[];
  self_summary?: string;
}

export interface EdenAIEducationEntry {
  title?: string;
  establishment?: string;
  start_date?: string;
  end_date?: string;
  location?: { formatted_location?: string };
  gpa?: { value?: number; raw?: string };
  description?: string;
}

export interface EdenAIWorkEntry {
  title?: string;
  company?: string;
  start_date?: string;
  end_date?: string;
  location?: { formatted_location?: string };
  description?: string;
}

export interface EdenAISkill {
  name?: string;
  type?: string;
}

export interface EdenAICertification {
  name?: string;
  accreditation?: string;
}

export interface EdenAIResumeResponse {
  affinda?: {
    extracted_data?: {
      personal_infos?: EdenAIPersonalInfo;
      education?: { entries?: EdenAIEducationEntry[] };
      work_experience?: { entries?: EdenAIWorkEntry[] };
      skills?: EdenAISkill[];
      certifications?: EdenAICertification[];
      languages?: Array<{ name?: string; code?: string }>;
    };
    cost?: number;
  };
}

// EdenAI Summarize response
export interface EdenAISummarizeResponse {
  openai?: {
    result?: string;
    summary?: string;
    cost?: number;
  };
}

// EdenAI Classification response
export interface EdenAIClassificationResponse {
  openai?: {
    classifications?: Array<{
      input?: string;
      label?: string;
      confidence?: number;
    }>;
    cost?: number;
  };
}

// EdenAI Moderation response
export interface EdenAIModerationResponse {
  openai?: {
    nsfw_likelihood?: number;
    items?: Array<{
      label?: string;
      likelihood?: number;
    }>;
    cost?: number;
  };
}

// EdenAI Spell Check response
export interface EdenAISpellCheckResponse {
  openai?: {
    text?: string;
    items?: Array<{
      text?: string;
      suggestion?: string;
      offset?: number;
      length?: number;
      type?: string;
    }>;
    cost?: number;
  };
}
