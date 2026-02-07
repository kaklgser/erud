// src/services/edenResumeParserService.ts
// Resume Parser - Uses Supabase Edge Function proxy for secure API calls
// Step 1: Extract text using Mistral OCR (via proxy)
// Step 2: Parse extracted text with Chat API (via proxy)

import {
  ResumeData,
  Education,
  WorkExperience,
  Project,
  Skill,
  Certification,
} from '../types/resume';
import { extractTextWithOCR, chatWithAI } from './edenaiProxyService';

export interface ParsedResume extends ResumeData {
  parsedText: string;
  parsingConfidence?: number;
  rawEdenResponse?: any;
}

// Maximum characters to store for parsedText (matches optimizer limit)
const MAX_PARSED_TEXT_LENGTH = 45000; // Leave room for JD

/**
 * Main function: Parse resume using Mistral OCR + openai/gpt-4o-mini
 * Flow: Mistral OCR (via Edge Function) → Chat API parsing (via Edge Function)
 */
export const parseResumeFromFile = async (file: File): Promise<ParsedResume> => {
  let extractedText = '';

  try {
    // For text-based files, read directly
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      extractedText = await file.text();
    } else {
      // Use Mistral OCR via Edge Function proxy
      try {
        extractedText = await extractTextWithOCR(file);
      } catch (ocrError: any) {
        // Fallback: Try reading as text (for text-based PDFs)
        try {
          const textContent = await file.text();
          const readableChars = textContent.substring(0, 2000).replace(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g, '');
          if (readableChars.length > 200) {
            extractedText = textContent
              .replace(/[\x00-\x08\x0E-\x1F]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          } else {
            throw new Error('File content is not readable text');
          }
        } catch (textError) {
          throw new Error(`OCR extraction failed. Please try a different file format (PDF, DOCX, or TXT).`);
        }
      }
    }
    
    if (!extractedText || extractedText.length < 50) {
      throw new Error('Could not extract enough text from file. Please ensure the file contains readable text.');
    }

    // Step 2: Parse text with Chat API via Edge Function proxy
    const parsedData = await parseTextWithChatAPI(extractedText);
    
    // Validate we got real data
    if (parsedData.name === 'John Doe' || parsedData.email === 'johndoe@example.com') {
      console.warn('⚠️ Got placeholder data');
      throw new Error('Placeholder data received');
    }
    
    logResults(parsedData);
    return parsedData;
  } catch (error: any) {
    console.error('❌ PARSING FAILED:', error.message);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
};

/**
 * Parse text with Chat API via Edge Function proxy
 */
const parseTextWithChatAPI = async (text: string, retryCount = 0): Promise<ParsedResume> => {
  const MAX_RETRIES = 2;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const prompt = `Parse this resume and extract ALL information. Return ONLY valid JSON.

RESUME TEXT:
"""
${text.slice(0, 12000)}
"""

Return JSON with this exact structure:
{
  "name": "Full name from resume",
  "phone": "Phone number",
  "email": "Email address",
  "linkedin": "LinkedIn URL",
  "github": "GitHub URL",
  "location": "City, State",
  "summary": "Professional summary or objective",
  "education": [{"degree": "Degree name", "school": "School name", "year": "Year", "cgpa": "GPA if mentioned", "location": "Location"}],
  "workExperience": [{"role": "Job title", "company": "Company name", "year": "Date range", "bullets": ["Achievement 1", "Achievement 2"]}],
  "projects": [{"title": "Project name", "bullets": ["Description 1", "Description 2"], "githubUrl": "URL if any"}],
  "skills": [{"category": "Category name", "list": ["Skill1", "Skill2"]}],
  "certifications": [{"title": "Cert name", "description": "Details"}]
}

IMPORTANT: Extract ACTUAL data from the resume text. Do NOT use placeholder values like "John Doe".`;

  try {
    // Use Edge Function proxy instead of direct API call
    const content = await chatWithAI(prompt, {
      provider: 'openai/gpt-4o-mini', // Changed from mistral-large to gpt-4o-mini - much cheaper ($0.003/1M tokens)
      temperature: 0.1,
      maxTokens: 4000,
    });

    if (!content) {
      throw new Error('Empty response from Chat API');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return mapToResume(parsed, text, { proxy: true });
  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      await delay(2000);
      return parseTextWithChatAPI(text, retryCount + 1);
    }
    throw error;
  }
};

/**
 * Map parsed JSON to our resume format
 */
const mapToResume = (parsed: any, rawText: string, rawResult: any): ParsedResume => {
  // Truncate raw text to prevent exceeding optimizer limits
  const truncatedText = rawText.length > MAX_PARSED_TEXT_LENGTH 
    ? rawText.substring(0, MAX_PARSED_TEXT_LENGTH) + '... [truncated]'
    : rawText;
  const education: Education[] = (parsed.education || []).map((e: any) => ({
    degree: e.degree || '',
    school: e.school || '',
    year: e.year || '',
    cgpa: e.cgpa || '',
    location: e.location || '',
  }));

  const workExperience: WorkExperience[] = (parsed.workExperience || []).map((w: any) => ({
    role: w.role || '',
    company: w.company || '',
    year: w.year || '',
    bullets: Array.isArray(w.bullets) ? w.bullets : [],
  }));

  const projects: Project[] = (parsed.projects || []).map((p: any) => ({
    title: p.title || '',
    bullets: Array.isArray(p.bullets) ? p.bullets : [],
    githubUrl: p.githubUrl || '',
  }));

  const skills: Skill[] = (parsed.skills || []).map((s: any) => {
    if (typeof s === 'string') return { category: 'Skills', count: 1, list: [s] };
    const list = Array.isArray(s.list) ? s.list : [];
    return { category: s.category || 'Skills', count: list.length, list };
  });

  const certifications: Certification[] = (parsed.certifications || []).map((c: any) => ({
    title: c.title || '',
    description: c.description || '',
  }));

  return {
    name: parsed.name || '',
    phone: parsed.phone || '',
    email: parsed.email || '',
    linkedin: parsed.linkedin || '',
    github: parsed.github || '',
    location: parsed.location || '',
    summary: parsed.summary || '',
    careerObjective: parsed.summary || '',
    education,
    workExperience,
    projects,
    skills,
    certifications,
    parsedText: truncatedText,
    parsingConfidence: 0.95,
    rawEdenResponse: rawResult,
    origin: 'eden_parsed',
  };
};

const logResults = (_data: ParsedResume) => {
  // Logging disabled for production
};

export const parseResumeFromUrl = async (_: string): Promise<ParsedResume> => {
  throw new Error('URL parsing not supported');
};

export const edenResumeParserService = { parseResumeFromFile, parseResumeFromUrl };
export default edenResumeParserService;
