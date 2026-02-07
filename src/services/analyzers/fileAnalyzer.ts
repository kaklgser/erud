// src/services/analyzers/fileAnalyzer.ts
import { FileAnalyzerInterface, FileAnalysisResult } from '../../types/resume';

/**
 * FileAnalyzer - Analyzes file-level properties of resumes
 * 
 * Handles:
 * - PDF filename validation and formatting
 * - Page count analysis and professional standards validation
 * - Word count calculation across all content
 * - Bullet point detection and counting
 * - File size estimation and email transmission validation
 */
export class FileAnalyzer implements FileAnalyzerInterface {
  
  /**
   * Analyze file-level properties of a resume
   */
  analyzeFile(file: File, resumeText: string): FileAnalysisResult {
    console.log('📄 FileAnalyzer: Starting file analysis...');
    
    const result: FileAnalysisResult = {
      pdf_name: this.analyzePDFName(file.name),
      file_size_kb: this.formatFileSize(file.size),
      page_count: this.estimatePageCount(resumeText, file.size),
      word_count: this.countWords(resumeText),
      bullet_count: this.countBulletPoints(resumeText),
      file_format_valid: this.validateFileFormat(file),
      size_appropriate: this.validateFileSize(file.size),
      page_count_appropriate: this.validatePageCount(this.estimatePageCount(resumeText, file.size))
    };

    console.log('📊 File Analysis Results:', {
      name: result.pdf_name,
      size: result.file_size_kb,
      pages: result.page_count,
      words: result.word_count,
      bullets: result.bullet_count,
      valid_format: result.file_format_valid,
      appropriate_size: result.size_appropriate,
      appropriate_pages: result.page_count_appropriate
    });

    return result;
  }

  /**
   * Analyze and validate PDF filename format
   */
  private analyzePDFName(filename: string): string {
    // Clean up the filename for analysis
    const cleanName = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    
    // Check for professional naming patterns (used in getFileInsights)
    const hasName = /[A-Za-z]{2,}/.test(cleanName);
    const hasRole = /(resume|cv|engineer|developer|manager|analyst|designer)/i.test(cleanName);
    const hasProperFormat = /^[A-Za-z0-9_-]+$/.test(cleanName);
    const hasSpaces = /\s/.test(cleanName);
    
    // Store validation results for insights (could be used for scoring)
    (this as any)._filenameValidation = { hasName, hasRole, hasProperFormat, hasSpaces };
    
    // Return the original filename - analysis is for validation
    return filename;
  }

  /**
   * Format file size for display
   */
  private formatFileSize(sizeInBytes: number): string {
    const sizeInKB = Math.round(sizeInBytes / 1024);
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`;
    } else {
      const sizeInMB = (sizeInKB / 1024).toFixed(1);
      return `${sizeInMB} MB`;
    }
  }

  /**
   * Estimate page count based on content length and file size
   */
  private estimatePageCount(resumeText: string, fileSize: number): number {
    // Method 1: Based on word count (typical page has 250-400 words)
    const wordCount = this.countWords(resumeText);
    const pagesByWords = Math.ceil(wordCount / 350);
    
    // Method 2: Based on character count (typical page has 1800-2500 chars)
    const charCount = resumeText.length;
    const pagesByChars = Math.ceil(charCount / 2000);
    
    // Method 3: Based on line count (typical page has 40-50 lines)
    const lineCount = resumeText.split('\n').filter(line => line.trim().length > 0).length;
    const pagesByLines = Math.ceil(lineCount / 45);
    
    // Method 4: Based on file size (rough estimate)
    const sizeInKB = fileSize / 1024;
    let pagesBySize = 1;
    if (sizeInKB > 150) pagesBySize = 2;
    if (sizeInKB > 300) pagesBySize = 3;
    if (sizeInKB > 500) pagesBySize = Math.ceil(sizeInKB / 200);
    
    // Use the median of the estimates for better accuracy
    const estimates = [pagesByWords, pagesByChars, pagesByLines, pagesBySize];
    estimates.sort((a, b) => a - b);
    
    // Return median, but ensure at least 1 page
    const medianIndex = Math.floor(estimates.length / 2);
    return Math.max(1, estimates[medianIndex]);
  }

  /**
   * Count total words in resume text
   */
  private countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    
    // Clean the text and split by whitespace
    const cleanText = text
      .replace(/[^\w\s'-]/g, ' ') // Replace non-word chars except apostrophes and hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (cleanText.length === 0) return 0;
    
    const words = cleanText.split(' ').filter(word => 
      word.length > 0 && 
      /[a-zA-Z]/.test(word) // Must contain at least one letter
    );
    
    return words.length;
  }

  /**
   * Count bullet points throughout the document
   */
  private countBulletPoints(text: string): number {
    if (!text) return 0;
    
    // Patterns for different bullet point styles
    const bulletPatterns = [
      /^[\s]*[-•*]\s+.+/gm,           // Dash, bullet, asterisk
      /^[\s]*[▪▫■□]\s+.+/gm,          // Square bullets
      /^[\s]*[►▶]\s+.+/gm,            // Arrow bullets
      /^[\s]*\d+\.\s+.+/gm,           // Numbered lists
      /^[\s]*[a-zA-Z]\.\s+.+/gm,      // Lettered lists
      /^[\s]*[ivxlcdm]+\.\s+.+/gim,   // Roman numerals
    ];
    
    let totalBullets = 0;
    const processedLines = new Set<string>(); // Avoid double counting
    
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
   * Validate file format is appropriate for resumes
   */
  private validateFileFormat(file: File): boolean {
    const validFormats = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const hasValidMimeType = validFormats.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    return hasValidMimeType || hasValidExtension;
  }

  /**
   * Validate file size is appropriate for email transmission
   */
  private validateFileSize(sizeInBytes: number): boolean {
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    // Most email systems have 25MB limit, but 5MB is more practical
    // For resumes, anything over 2MB is usually excessive
    return sizeInMB <= 2.0;
  }

  /**
   * Validate page count meets professional standards
   */
  private validatePageCount(pageCount: number): boolean {
    // Professional standard: 1-2 pages for most roles
    // 3 pages acceptable for very senior roles (15+ years experience)
    return pageCount >= 1 && pageCount <= 2;
  }

  /**
   * Get detailed file analysis insights
   */
  getFileInsights(result: FileAnalysisResult): string[] {
    const insights: string[] = [];
    
    // Filename insights
    const filename = result.pdf_name.replace(/\.[^/.]+$/, '');
    if (!/[A-Za-z]{2,}/.test(filename)) {
      insights.push('Consider using your name in the filename (e.g., "John_Smith_Resume.pdf")');
    }
    if (/\s/.test(filename)) {
      insights.push('Replace spaces in filename with underscores or hyphens for better compatibility');
    }
    
    // File size insights
    if (!result.size_appropriate) {
      insights.push('File size is too large for email transmission. Consider compressing or optimizing the PDF');
    }
    
    // Page count insights
    if (!result.page_count_appropriate) {
      if (result.page_count > 2) {
        insights.push(`Resume is ${result.page_count} pages. Consider condensing to 1-2 pages for better readability`);
      }
    }
    
    // Word count insights
    if (result.word_count < 200) {
      insights.push('Resume appears quite brief. Consider adding more detail about your experience and achievements');
    } else if (result.word_count > 800) {
      insights.push('Resume is quite lengthy. Consider condensing to highlight only the most relevant information');
    }
    
    // Bullet point insights
    if (result.bullet_count < 5) {
      insights.push('Consider using more bullet points to clearly structure your experience and achievements');
    } else if (result.bullet_count > 25) {
      insights.push('Consider reducing bullet points to focus on your most impactful achievements');
    }
    
    // File format insights
    if (!result.file_format_valid) {
      insights.push('File format may not be ATS-compatible. PDF is the recommended format for resumes');
    }
    
    return insights;
  }
}

// Export singleton instance
export const fileAnalyzer = new FileAnalyzer();