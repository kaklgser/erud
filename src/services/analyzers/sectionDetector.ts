// src/services/analyzers/sectionDetector.ts
import { SectionDetectorInterface, SectionDetectionResult, OrderIssue } from '../../types/resume';

/**
 * SectionDetector - Analyzes resume section organization and structure
 * 
 * Handles:
 * - Section identification for Header, Summary, Skills, Experience, Projects, Education, Certifications, Achievements
 * - Missing section detection against standard sections
 * - Section order validation against professional best practices
 * - ATS-specific section ordering validation
 * - Word counts and bullet counts per section
 */
export class SectionDetector implements SectionDetectorInterface {
  
  private readonly STANDARD_SECTIONS = [
    'header',
    'summary', 
    'skills',
    'experience',
    'projects',
    'education',
    'certifications',
    'achievements'
  ];

  private readonly EXPECTED_ORDER = [
    'header',
    'summary',
    'skills', 
    'experience',
    'projects',
    'education',
    'certifications',
    'achievements'
  ];

  private readonly SECTION_PATTERNS = {
    header: /^[\s]*(?:contact|personal\s+info|header)/i,
    summary: /^[\s]*(?:professional\s+summary|summary|profile|about\s+me|career\s+objective|objective)/i,
    skills: /^[\s]*(?:skills|technical\s+skills|core\s+competencies|technologies|expertise)/i,
    experience: /^[\s]*(?:work\s+experience|professional\s+experience|experience|employment|career\s+history)/i,
    projects: /^[\s]*(?:projects?|portfolio|key\s+projects|notable\s+projects)/i,
    education: /^[\s]*(?:education|academic\s+background|qualifications)/i,
    certifications: /^[\s]*(?:certifications?|licenses?|credentials)/i,
    achievements: /^[\s]*(?:achievements?|accomplishments?|awards?|honors?)/i
  };

  /**
   * Detect and analyze resume sections
   */
  detectSections(resumeText: string): SectionDetectionResult {
    console.log('📋 SectionDetector: Starting section analysis...');
    
    const sections = this.identifySections(resumeText);
    const presentSections = Object.keys(sections);
    const missingSections = this.findMissingSections(presentSections);
    const orderIssues = this.validateSectionOrder(presentSections);
    const sectionWordCounts = this.calculateWordCounts(sections);
    const sectionBulletCounts = this.calculateBulletCounts(sections);
    
    const result: SectionDetectionResult = {
      present_sections: presentSections,
      missing_sections: missingSections,
      section_order_correct: orderIssues.length === 0,
      section_positions: this.getSectionPositions(presentSections),
      section_word_counts: sectionWordCounts,
      section_bullet_counts: sectionBulletCounts,
      order_issues: orderIssues
    };

    console.log('📊 Section Detection Results:', {
      present: result.present_sections.length,
      missing: result.missing_sections.length,
      order_correct: result.section_order_correct,
      order_issues: result.order_issues.length
    });

    return result;
  }

  /**
   * Identify sections in resume text
   */
  private identifySections(text: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = text.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];
    
    // First, try to identify contact/header info at the top
    const headerContent = this.extractHeaderSection(lines);
    if (headerContent) {
      sections.header = headerContent;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.length === 0) continue;
      
      // Check if this line is a section header
      const detectedSection = this.detectSectionHeader(line);
      
      if (detectedSection) {
        // Save previous section if it exists
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        // Start new section
        currentSection = detectedSection;
        currentContent = [];
      } else if (currentSection) {
        // Add content to current section
        currentContent.push(line);
      }
    }
    
    // Don't forget the last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  /**
   * Extract header/contact information from top of resume
   */
  private extractHeaderSection(lines: string[]): string | null {
    const headerLines: string[] = [];
    
    // Look at first 10 lines for contact info
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      
      if (line.length === 0) continue;
      
      // Stop if we hit a section header
      if (this.detectSectionHeader(line)) {
        break;
      }
      
      // Check if line contains contact info patterns
      const hasEmail = /@/.test(line);
      const hasPhone = /[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/.test(line);
      const hasLinkedIn = /linkedin/i.test(line);
      const hasGitHub = /github/i.test(line);
      const hasLocation = /\b(?:city|state|country|address)\b/i.test(line) || /,\s*[A-Z]{2}\b/.test(line);
      const isName = i < 3 && /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line) && line.split(' ').length <= 4;
      
      if (hasEmail || hasPhone || hasLinkedIn || hasGitHub || hasLocation || isName) {
        headerLines.push(line);
      } else if (headerLines.length > 0) {
        // If we've started collecting header info but this line doesn't match, we might be done
        break;
      }
    }
    
    return headerLines.length > 0 ? headerLines.join('\n') : null;
  }

  /**
   * Detect if a line is a section header
   */
  private detectSectionHeader(line: string): string | null {
    // Skip if line is too long to be a header
    if (line.length > 50) return null;
    
    // Check against all section patterns
    for (const [section, pattern] of Object.entries(this.SECTION_PATTERNS)) {
      if (pattern.test(line)) {
        return section;
      }
    }
    
    return null;
  }

  /**
   * Find missing standard sections
   */
  private findMissingSections(presentSections: string[]): string[] {
    return this.STANDARD_SECTIONS.filter(section => !presentSections.includes(section));
  }

  /**
   * Validate section order against professional standards
   */
  private validateSectionOrder(presentSections: string[]): OrderIssue[] {
    const issues: OrderIssue[] = [];
    
    // Create a map of expected positions
    const expectedPositions = new Map<string, number>();
    this.EXPECTED_ORDER.forEach((section, index) => {
      expectedPositions.set(section, index);
    });
    
    // Check each present section's position
    for (let i = 0; i < presentSections.length; i++) {
      const section = presentSections[i];
      const expectedPosition = expectedPositions.get(section);
      
      if (expectedPosition !== undefined) {
        // Find how many sections that should come before this one are present
        const sectionsThatShouldComeBefore = this.EXPECTED_ORDER
          .slice(0, expectedPosition)
          .filter(s => presentSections.includes(s));
        
        const expectedCurrentPosition = sectionsThatShouldComeBefore.length;
        
        if (i !== expectedCurrentPosition) {
          issues.push({
            section,
            currentPosition: i,
            expectedPosition: expectedCurrentPosition,
            penalty: Math.abs(i - expectedCurrentPosition) * 2 // 2 points per position off
          });
        }
      }
    }
    
    return issues;
  }

  /**
   * Get section positions in the resume
   */
  private getSectionPositions(presentSections: string[]): Record<string, number> {
    const positions: Record<string, number> = {};
    presentSections.forEach((section, index) => {
      positions[section] = index;
    });
    return positions;
  }

  /**
   * Calculate word counts for each section
   */
  private calculateWordCounts(sections: Record<string, string>): Record<string, number> {
    const wordCounts: Record<string, number> = {};
    
    for (const [section, content] of Object.entries(sections)) {
      wordCounts[section] = this.countWords(content);
    }
    
    return wordCounts;
  }

  /**
   * Calculate bullet point counts for each section
   */
  private calculateBulletCounts(sections: Record<string, string>): Record<string, number> {
    const bulletCounts: Record<string, number> = {};
    
    for (const [section, content] of Object.entries(sections)) {
      bulletCounts[section] = this.countBulletPoints(content);
    }
    
    return bulletCounts;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    
    const cleanText = text
      .replace(/[^\w\s'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanText.length === 0) return 0;
    
    const words = cleanText.split(' ').filter(word => 
      word.length > 0 && /[a-zA-Z]/.test(word)
    );
    
    return words.length;
  }

  /**
   * Count bullet points in text
   */
  private countBulletPoints(text: string): number {
    if (!text) return 0;
    
    const bulletPatterns = [
      /^[\s]*[-•*]\s+.+/gm,
      /^[\s]*[▪▫■□]\s+.+/gm,
      /^[\s]*[►▶]\s+.+/gm,
      /^[\s]*\d+\.\s+.+/gm,
      /^[\s]*[a-zA-Z]\.\s+.+/gm,
    ];
    
    let totalBullets = 0;
    const processedLines = new Set<string>();
    
    bulletPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const trimmedMatch = match.trim();
          if (!processedLines.has(trimmedMatch) && trimmedMatch.length > 10) {
            processedLines.add(trimmedMatch);
            totalBullets++;
          }
        });
      }
    });
    
    return totalBullets;
  }

  /**
   * Get section analysis insights
   */
  getSectionInsights(result: SectionDetectionResult): string[] {
    const insights: string[] = [];
    
    // Missing sections insights
    if (result.missing_sections.length > 0) {
      const criticalMissing = result.missing_sections.filter(s => 
        ['summary', 'skills', 'experience'].includes(s)
      );
      
      if (criticalMissing.length > 0) {
        insights.push(`Critical sections missing: ${criticalMissing.join(', ')}. These are essential for ATS parsing.`);
      }
      
      const optionalMissing = result.missing_sections.filter(s => 
        !['summary', 'skills', 'experience'].includes(s)
      );
      
      if (optionalMissing.length > 0) {
        insights.push(`Consider adding: ${optionalMissing.join(', ')} to strengthen your resume.`);
      }
    }
    
    // Section order insights
    if (!result.section_order_correct) {
      insights.push(`Section order could be improved. Recommended order: ${this.EXPECTED_ORDER.join(' → ')}`);
      
      result.order_issues.forEach(issue => {
        insights.push(`Move "${issue.section}" section to position ${issue.expectedPosition + 1} for better ATS compatibility`);
      });
    }
    
    // Section length insights
    const totalWords = Object.values(result.section_word_counts).reduce((sum, count) => sum + count, 0);
    
    if (result.section_word_counts.experience && result.section_word_counts.experience < totalWords * 0.4) {
      insights.push('Experience section should be the largest part of your resume (40-50% of total content)');
    }
    
    if (result.section_word_counts.summary && result.section_word_counts.summary > 100) {
      insights.push('Summary section is quite long. Consider condensing to 50-75 words for better impact');
    }
    
    // Bullet point insights
    const experienceBullets = result.section_bullet_counts.experience || 0;
    if (experienceBullets < 3) {
      insights.push('Experience section needs more bullet points to showcase your achievements effectively');
    }
    
    return insights;
  }
}

// Export singleton instance
export const sectionDetector = new SectionDetector();