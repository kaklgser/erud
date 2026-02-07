/**
 * AI-Powered Keyword Suggestion Service
 * Uses Gemini AI to suggest relevant keywords based on resume + JD context
 * User can approve/reject suggestions before adding to resume
 */

import { GeminiService } from './geminiService';
import { ResumeData } from '../types/resume';

export interface KeywordSuggestion {
  keyword: string;
  category: string;
  reason: string;
  confidence: number; // 0-100
  source: 'jd_extraction' | 'ai_suggestion' | 'gap_analysis';
  approved?: boolean;
}

export interface KeywordSuggestionResult {
  suggestions: KeywordSuggestion[];
  totalSuggestions: number;
  approvedCount: number;
  rejectedCount: number;
  processingTime: number;
}

export class AiKeywordSuggestionService {
  /**
   * Generate AI-powered keyword suggestions
   */
  static async suggestKeywords(
    resumeData: ResumeData,
    resumeText: string,
    jobDescription: string,
    existingSkills: string[]
  ): Promise<KeywordSuggestion[]> {
    const startTime = Date.now();
    
    console.log('🤖 AI Keyword Suggestion Service Started');
    console.log('   - Resume skills count:', existingSkills.length);
    console.log('   - JD length:', jobDescription.length);

    try {
      // Step 1: Extract context from resume and JD
      const resumeContext = this.extractResumeContext(resumeData, resumeText);
      const jdContext = this.extractJdContext(jobDescription);

      console.log('📊 Context Extracted:');
      console.log('   - Resume role:', resumeContext.role);
      console.log('   - Resume experience years:', resumeContext.yearsExperience);
      console.log('   - JD role:', jdContext.role);
      console.log('   - JD key skills:', jdContext.keySkills.slice(0, 5));

      // Step 2: Use Gemini AI to generate suggestions
      const aiSuggestions = await this.generateAiSuggestions(
        resumeContext,
        jdContext,
        existingSkills,
        jobDescription
      );

      console.log('✅ AI Suggestions Generated:', aiSuggestions.length);

      // Step 3: Rank and filter suggestions
      const rankedSuggestions = this.rankSuggestions(aiSuggestions, jdContext, existingSkills);

      console.log('📈 Suggestions Ranked:', rankedSuggestions.length);
      console.log('   - Top 5:', rankedSuggestions.slice(0, 5).map(s => `${s.keyword} (${s.confidence}%)`));

      const processingTime = Date.now() - startTime;
      console.log(`⏱️ Processing time: ${processingTime}ms`);

      return rankedSuggestions;
    } catch (error) {
      console.error('❌ AI Keyword Suggestion Error:', error);
      return [];
    }
  }

  /**
   * Extract relevant context from resume
   */
  private static extractResumeContext(resumeData: ResumeData, resumeText: string) {
    const yearsExperience = resumeData.workExperience?.length || 0;
    const role = resumeData.workExperience?.[0]?.role || resumeData.targetRole || 'Software Engineer';
    const companies = resumeData.workExperience?.map(exp => exp.company) || [];
    const projects = resumeData.projects?.map(p => p.title) || [];
    const currentSkills = resumeData.skills?.flatMap(s => s.list) || [];
    
    // Extract technologies mentioned in bullets
    const techMentions = this.extractTechMentions(resumeText);

    return {
      role,
      yearsExperience,
      companies,
      projects,
      currentSkills,
      techMentions,
      resumeLength: resumeText.length,
    };
  }

  /**
   * Extract relevant context from JD
   */
  private static extractJdContext(jobDescription: string) {
    // Extract role from JD
    const roleMatch = jobDescription.match(/(?:role|position|title|as a|as an)\s+([^,.\n]+)/i);
    const role = roleMatch?.[1]?.trim() || 'Software Engineer';

    // Extract key skills mentioned
    const skillPatterns = /(?:skills?|required|must have|experience with|proficient in|knowledge of)\s*:?\s*([^.\n]+)/gi;
    const keySkills: string[] = [];
    let match;
    while ((match = skillPatterns.exec(jobDescription)) !== null) {
      const skills = match[1].split(/[,;]/).map(s => s.trim());
      keySkills.push(...skills);
    }

    // Extract experience level
    const expMatch = jobDescription.match(/(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/i);
    const yearsRequired = expMatch ? parseInt(expMatch[1]) : 0;

    // Extract technologies
    const techMentions = this.extractTechMentions(jobDescription);

    return {
      role,
      keySkills: [...new Set(keySkills)],
      yearsRequired,
      techMentions,
      jdLength: jobDescription.length,
    };
  }

  /**
   * Extract technology mentions from text
   */
  private static extractTechMentions(text: string): string[] {
    const techKeywords = [
      'java', 'python', 'javascript', 'typescript', 'go', 'rust', 'ruby', 'php',
      'react', 'angular', 'vue', 'svelte', 'next', 'nuxt',
      'node', 'express', 'django', 'flask', 'spring', 'fastapi',
      'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
      'git', 'github', 'gitlab', 'jenkins', 'ci/cd',
      'oop', 'dsa', 'microservices', 'rest', 'graphql', 'grpc',
      'unit testing', 'jest', 'pytest', 'selenium', 'cypress',
      'linux', 'unix', 'bash', 'shell', 'powershell',
      'agile', 'scrum', 'kanban', 'devops', 'sdlc'
    ];

    const mentions: string[] = [];
    const textLower = text.toLowerCase();

    techKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        mentions.push(keyword);
      }
    });

    return [...new Set(mentions)];
  }

  /**
   * Generate AI suggestions using Gemini
   */
  private static async generateAiSuggestions(
    resumeContext: any,
    jdContext: any,
    existingSkills: string[],
    jobDescription: string
  ): Promise<KeywordSuggestion[]> {
    const prompt = `
You are an expert resume optimizer and ATS specialist. Analyze the following and suggest 5-10 missing keywords that would improve the resume's match with the job description.

RESUME CONTEXT:
- Current Role: ${resumeContext.role}
- Years of Experience: ${resumeContext.yearsExperience}
- Current Skills: ${resumeContext.currentSkills.slice(0, 10).join(', ')}
- Technologies Mentioned: ${resumeContext.techMentions.slice(0, 10).join(', ')}

JOB DESCRIPTION CONTEXT:
- Target Role: ${jdContext.role}
- Years Required: ${jdContext.yearsRequired}
- Key Skills: ${jdContext.keySkills.slice(0, 10).join(', ')}
- Technologies: ${jdContext.techMentions.slice(0, 10).join(', ')}

EXISTING SKILLS (don't suggest these):
${existingSkills.slice(0, 20).join(', ')}

TASK:
Suggest 5-10 keywords that:
1. Are mentioned in the job description
2. Are NOT already in the resume
3. Would improve ATS score
4. Are relevant to the role

For each suggestion, provide:
- Keyword (exact skill name)
- Category (Programming Languages, Backend, Frontend, Databases, Tools, Cloud, Core Competencies)
- Reason (why this keyword matters for this role)
- Confidence (0-100, how important is this keyword)

Format as JSON array:
[
  {
    "keyword": "Spring Boot",
    "category": "Backend",
    "reason": "JD requires Spring Boot experience for backend development",
    "confidence": 95
  }
]

IMPORTANT: Only suggest VALID technical skills. No verbs, locations, or soft words.
`;

    try {
      const response = await GeminiService.generateContent(prompt);
      
      if (!response) {
        console.warn('⚠️ No response from Gemini');
        return [];
      }

      // Parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('⚠️ No JSON found in Gemini response');
        return [];
      }

      const suggestions = JSON.parse(jsonMatch[0]) as KeywordSuggestion[];
      
      // Add source and set approved to false initially
      return suggestions.map(s => ({
        ...s,
        source: 'ai_suggestion' as const,
        approved: false,
      }));
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      return [];
    }
  }

  /**
   * Rank suggestions by relevance and confidence
   */
  private static rankSuggestions(
    suggestions: KeywordSuggestion[],
    jdContext: any,
    existingSkills: string[]
  ): KeywordSuggestion[] {
    return suggestions
      .filter(s => {
        // Filter out duplicates
        const isDuplicate = existingSkills.some(skill => 
          skill.toLowerCase().includes(s.keyword.toLowerCase()) ||
          s.keyword.toLowerCase().includes(skill.toLowerCase())
        );
        return !isDuplicate;
      })
      .sort((a, b) => {
        // Sort by confidence (descending)
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        
        // Then by how many times mentioned in JD
        const aInJd = jdContext.keySkills.filter((skill: string) => 
          skill.toLowerCase().includes(a.keyword.toLowerCase())
        ).length;
        const bInJd = jdContext.keySkills.filter((skill: string) => 
          skill.toLowerCase().includes(b.keyword.toLowerCase())
        ).length;
        
        return bInJd - aInJd;
      })
      .slice(0, 10); // Return top 10
  }

  /**
   * Process user approvals and return final keywords
   */
  static processApprovals(suggestions: KeywordSuggestion[]): KeywordSuggestion[] {
    return suggestions.filter(s => s.approved === true);
  }

  /**
   * Get summary of suggestions
   */
  static getSummary(suggestions: KeywordSuggestion[]): KeywordSuggestionResult {
    const approved = suggestions.filter(s => s.approved).length;
    const rejected = suggestions.filter(s => s.approved === false).length;

    return {
      suggestions,
      totalSuggestions: suggestions.length,
      approvedCount: approved,
      rejectedCount: rejected,
      processingTime: 0,
    };
  }
}

export default AiKeywordSuggestionService;
