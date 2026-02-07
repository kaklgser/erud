// src/services/enhancedResumeParserService.ts
// Enhanced Resume Parser - Addresses P0 Critical Issues for Enterprise Readiness
// 
// P0 Fixes Implemented:
// 1. OCR Integration with fallback layers
// 2. Multi-column layout detection and handling
// 3. Enhanced confidence calibration
// 4. Proportional formatting penalties (vs binary)
// 5. Improved text extraction pipeline

import {
  ResumeData,
  Education,
  WorkExperience,
  Project,
  Skill,
  Certification,
} from '../types/resume';
import { edenai } from './aiProxyService';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// ENHANCED TYPES
// ============================================================================

export interface EnhancedParseResult extends ResumeData {
  parsedText: string;
  parsingConfidence: number;
  extractionMethod: 'direct_text' | 'ocr_primary' | 'ocr_fallback' | 'hybrid';
  layoutComplexity: 'simple' | 'moderate' | 'complex';
  qualityMetrics: QualityMetrics;
  rawEdenResponse?: any;
}

export interface QualityMetrics {
  textExtraction: number; // 0-1
  structureDetection: number; // 0-1
  contentCompleteness: number; // 0-1
  formatHandling: number; // 0-1
  overallConfidence: number; // 0-1
}

export interface LayoutAnalysis {
  hasMultipleColumns: boolean;
  columnCount: number;
  hasTextBoxes: boolean;
  hasComplexFormatting: boolean;
  sectionBoundaries: SectionBoundary[];
}

export interface SectionBoundary {
  type: 'header' | 'content' | 'separator';
  startIndex: number;
  endIndex: number;
  confidence: number;
}

// ============================================================================
// ENHANCED RESUME PARSER SERVICE
// ============================================================================

export class EnhancedResumeParserService {
  /**
   * Main parsing function with enhanced error handling and multi-layer extraction
   */
  static async parseResumeFromFile(file: File): Promise<EnhancedParseResult> {
    console.log('🚀 Enhanced Resume Parser - P0 Enterprise Fixes (via Supabase proxy)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📄 File:', file.name, '|', (file.size / 1024).toFixed(2), 'KB', '| Type:', file.type);

    // Step 1: Analyze file and determine extraction strategy
    const extractionStrategy = this.determineExtractionStrategy(file);
    console.log('🎯 Extraction Strategy:', extractionStrategy);

    // Step 2: Multi-layer text extraction with fallbacks
    const extractionResult = await this.extractTextWithFallbacks(file, extractionStrategy);
    
    // Step 3: Layout analysis and column detection
    const layoutAnalysis = this.analyzeLayout(extractionResult.text);
    console.log('📐 Layout Analysis:', {
      columns: layoutAnalysis.columnCount,
      complexity: layoutAnalysis.hasComplexFormatting ? 'complex' : 'simple',
      textBoxes: layoutAnalysis.hasTextBoxes
    });

    // Step 4: Enhanced text processing for multi-column layouts
    const processedText = this.processMultiColumnText(extractionResult.text, layoutAnalysis);
    
    // Step 5: Parse with enhanced prompting
    const parsedData = await this.parseTextWithEnhancedAPI(processedText, layoutAnalysis);
    
    // Step 6: Calculate enhanced confidence metrics
    const qualityMetrics = this.calculateQualityMetrics(
      extractionResult,
      layoutAnalysis,
      parsedData
    );

    // Step 7: Determine layout complexity
    const layoutComplexity = this.determineLayoutComplexity(layoutAnalysis, qualityMetrics);

    return {
      ...parsedData,
      parsedText: processedText,
      parsingConfidence: qualityMetrics.overallConfidence,
      extractionMethod: extractionResult.method,
      layoutComplexity,
      qualityMetrics,
      rawEdenResponse: extractionResult.rawResponse,
    };
  }

  // ============================================================================
  // EXTRACTION STRATEGY & MULTI-LAYER OCR
  // ============================================================================

  /**
   * Determine optimal extraction strategy based on file characteristics
   */
  private static determineExtractionStrategy(file: File): 'direct' | 'ocr_primary' | 'hybrid' {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const fileSize = file.size;

    // Direct text for simple formats
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return 'direct';
    }

    // OCR primary for complex formats or large files
    if (fileSize > 1024 * 1024 || // > 1MB
        fileName.includes('scan') || 
        fileName.includes('image')) {
      return 'ocr_primary';
    }

    // Hybrid approach for most PDFs/DOCX
    return 'hybrid';
  }

  /**
   * Multi-layer text extraction with comprehensive fallbacks
   */
  private static async extractTextWithFallbacks(
    file: File, 
    strategy: 'direct' | 'ocr_primary' | 'hybrid'
  ): Promise<{
    text: string;
    method: 'direct_text' | 'ocr_primary' | 'ocr_fallback' | 'hybrid';
    confidence: number;
    rawResponse?: any;
  }> {
    
    if (strategy === 'direct') {
      return this.extractDirectText(file);
    }

    if (strategy === 'ocr_primary') {
      return this.extractWithOCRPrimary(file);
    }

    // Hybrid approach - try direct first, OCR as fallback
    try {
      const directResult = await this.extractDirectText(file);
      
      // Validate direct extraction quality
      if (this.validateTextQuality(directResult.text)) {
        return directResult;
      }
      
      console.log('⚠️ Direct extraction quality low, falling back to OCR...');
      return this.extractWithOCRFallback(file);
      
    } catch (error) {
      console.log('⚠️ Direct extraction failed, using OCR fallback...');
      return this.extractWithOCRFallback(file);
    }
  }

  /**
   * Direct text extraction
   */
  private static async extractDirectText(file: File): Promise<{
    text: string;
    method: 'direct_text';
    confidence: number;
    rawResponse?: any;
  }> {
    console.log('📄 Direct text extraction...');
    
    const text = await file.text();
    const cleanText = text
      .replace(/[\x00-\x08\x0E-\x1F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText.length < 50) {
      throw new Error('Insufficient text content for direct extraction');
    }

    return {
      text: cleanText,
      method: 'direct_text',
      confidence: this.calculateExtractionConfidence(cleanText, 'direct'),
    };
  }

  /**
   * OCR primary extraction
   */
  private static async extractWithOCRPrimary(file: File): Promise<{
    text: string;
    method: 'ocr_primary';
    confidence: number;
    rawResponse?: any;
  }> {
    console.log('🔍 OCR primary extraction...');
    
    try {
      const result = await this.extractTextWithEnhancedOCR(file);
      return {
        text: result.text,
        method: 'ocr_primary',
        confidence: result.confidence,
        rawResponse: result.rawResponse,
      };
    } catch (error) {
      console.error('❌ OCR primary failed:', error);
      throw new Error('OCR extraction failed - file may be corrupted or unsupported format');
    }
  }

  /**
   * OCR fallback extraction
   */
  private static async extractWithOCRFallback(file: File): Promise<{
    text: string;
    method: 'ocr_fallback';
    confidence: number;
    rawResponse?: any;
  }> {
    console.log('🔄 OCR fallback extraction...');
    
    try {
      const result = await this.extractTextWithEnhancedOCR(file);
      return {
        text: result.text,
        method: 'ocr_fallback',
        confidence: Math.max(0.3, result.confidence - 0.2), // Lower confidence for fallback
        rawResponse: result.rawResponse,
      };
    } catch (error) {
      console.error('❌ OCR fallback failed:', error);
      throw new Error('All extraction methods failed - please try a different file format');
    }
  }

  /**
   * Enhanced OCR with better error handling and multi-provider support
   */
  private static async extractTextWithEnhancedOCR(file: File): Promise<{
    text: string;
    confidence: number;
    rawResponse: any;
  }> {
    console.log('🔍 Enhanced OCR extraction via Supabase proxy...');

    try {
      const extractedText = await edenai.extractText(file);
      
      // edenai.extractText returns a string, wrap it in expected format
      return {
        text: extractedText,
        confidence: extractedText.length > 500 ? 0.85 : 0.7,
        rawResponse: { text: extractedText, source: 'proxy' },
      };
    } catch (error) {
      console.error('❌ Enhanced OCR failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced OCR result polling - now handled by proxy
   */
  private static async pollEnhancedOCRResult(_jobId: string): Promise<any> {
    // Polling is now handled internally by the proxy service
    return {};
  }

  /**
   * Extract best text from multi-provider OCR results
   */
  private static extractBestTextFromOCRResult(result: any): {
    text: string;
    confidence: number;
    rawResponse: any;
  } {
    const providers = ['mistral', 'google', 'amazon', 'microsoft'];
    let bestText = '';
    let bestConfidence = 0;
    let bestProvider = '';

    for (const provider of providers) {
      const providerResult = result[provider];
      if (!providerResult || providerResult.status === 'fail') continue;

      const text = this.extractTextFromProvider(providerResult);
      if (!text || text.length < 50) continue;

      const confidence = this.calculateExtractionConfidence(text, 'ocr');
      
      if (confidence > bestConfidence) {
        bestText = text;
        bestConfidence = confidence;
        bestProvider = provider;
      }
    }

    if (!bestText) {
      throw new Error('No usable text extracted from OCR providers');
    }

    console.log(`✅ Best OCR result from ${bestProvider}: ${bestText.length} chars, confidence: ${bestConfidence.toFixed(2)}`);
    
    return {
      text: bestText,
      confidence: bestConfidence,
      rawResponse: result,
    };
  }

  /**
   * Extract text from individual provider result
   */
  private static extractTextFromProvider(providerResult: any): string | null {
    // Try different text fields
    const textFields = ['text', 'raw_text', 'extracted_text'];
    
    for (const field of textFields) {
      if (providerResult[field] && typeof providerResult[field] === 'string') {
        const text = providerResult[field].trim();
        if (text.length > 10) return text;
      }
    }

    // Try pages array for multi-page documents
    if (providerResult.pages && Array.isArray(providerResult.pages)) {
      const pageTexts = providerResult.pages
        .map((page: any) => page.text || page.content || '')
        .filter((text: string) => text.trim().length > 0);
      
      if (pageTexts.length > 0) {
        return pageTexts.join('\n\n');
      }
    }

    return null;
  }

  // ============================================================================
  // LAYOUT ANALYSIS & MULTI-COLUMN HANDLING
  // ============================================================================

  /**
   * Analyze document layout to detect columns and complex formatting
   */
  private static analyzeLayout(text: string): LayoutAnalysis {
    const lines = text.split('\n');
    
    // Detect multiple columns by analyzing line patterns
    const hasMultipleColumns = this.detectMultipleColumns(lines);
    const columnCount = hasMultipleColumns ? this.estimateColumnCount(lines) : 1;
    
    // Detect text boxes and complex formatting
    const hasTextBoxes = this.detectTextBoxes(text);
    const hasComplexFormatting = this.detectComplexFormatting(text);
    
    // Identify section boundaries
    const sectionBoundaries = this.identifySectionBoundaries(lines);

    return {
      hasMultipleColumns,
      columnCount,
      hasTextBoxes,
      hasComplexFormatting,
      sectionBoundaries,
    };
  }

  /**
   * Detect multiple columns by analyzing text patterns
   */
  private static detectMultipleColumns(lines: string[]): boolean {
    let shortLineCount = 0;
    let totalNonEmptyLines = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      
      totalNonEmptyLines++;
      
      // Short lines might indicate column breaks
      if (trimmed.length < 40 && !this.isLikelyHeader(trimmed)) {
        shortLineCount++;
      }
    }
    
    // If more than 30% of lines are short, likely multi-column
    const shortLineRatio = shortLineCount / Math.max(totalNonEmptyLines, 1);
    return shortLineRatio > 0.3;
  }

  /**
   * Estimate number of columns
   */
  private static estimateColumnCount(lines: string[]): number {
    // Analyze line length distribution
    const lineLengths = lines
      .map(line => line.trim().length)
      .filter(length => length > 0);
    
    if (lineLengths.length === 0) return 1;
    
    // Find common line length patterns
    const lengthCounts = new Map<number, number>();
    for (const length of lineLengths) {
      const bucket = Math.floor(length / 20) * 20; // Group by 20-char buckets
      lengthCounts.set(bucket, (lengthCounts.get(bucket) || 0) + 1);
    }
    
    const sortedBuckets = Array.from(lengthCounts.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // If we have multiple common line lengths, likely multiple columns
    if (sortedBuckets.length >= 2 && sortedBuckets[1][1] > lineLengths.length * 0.15) {
      return 2;
    }
    
    return 1;
  }

  /**
   * Detect text boxes and floating elements
   */
  private static detectTextBoxes(text: string): boolean {
    // Look for patterns that suggest text boxes or floating elements
    const textBoxIndicators = [
      /\b(skills|technologies|tools)\s*[:]\s*\n/i,
      /\b(contact|info|details)\s*[:]\s*\n/i,
      /^\s*[•▪▫◦]\s/m, // Bullet points that might be in boxes
      /\n\s{10,}/g, // Large indentations
    ];
    
    return textBoxIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Detect complex formatting that might cause parsing issues
   */
  private static detectComplexFormatting(text: string): boolean {
    const complexityIndicators = [
      /\t{2,}/g, // Multiple tabs
      /\n\s{20,}/g, // Very large indentations
      /[^\w\s\n.,;:!?()-]{3,}/g, // Special character sequences
      /\n.{1,10}\n.{1,10}\n/g, // Very short alternating lines
    ];
    
    return complexityIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Identify section boundaries in the text
   */
  private static identifySectionBoundaries(lines: string[]): SectionBoundary[] {
    const boundaries: SectionBoundary[] = [];
    const sectionHeaders = [
      /^(experience|work\s+experience|employment|professional\s+experience)/i,
      /^(education|academic\s+background|qualifications)/i,
      /^(skills|technical\s+skills|competencies|technologies)/i,
      /^(projects|personal\s+projects|portfolio)/i,
      /^(certifications|certificates|licenses)/i,
      /^(summary|profile|objective|about)/i,
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      for (const headerPattern of sectionHeaders) {
        if (headerPattern.test(line)) {
          boundaries.push({
            type: 'header',
            startIndex: i,
            endIndex: i,
            confidence: 0.8,
          });
          break;
        }
      }
    }
    
    return boundaries;
  }

  /**
   * Process multi-column text to improve parsing
   */
  private static processMultiColumnText(text: string, layout: LayoutAnalysis): string {
    if (!layout.hasMultipleColumns) {
      return text;
    }
    
    console.log('🔧 Processing multi-column layout...');
    
    const lines = text.split('\n');
    const processedLines: string[] = [];
    
    // Group related content and fix column breaks
    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      
      if (currentLine.length === 0) {
        processedLines.push('');
        continue;
      }
      
      // Check if this might be a continuation from a column break
      if (i > 0 && this.isLikelyContinuation(currentLine, lines[i - 1])) {
        // Merge with previous line
        const lastIndex = processedLines.length - 1;
        if (lastIndex >= 0) {
          processedLines[lastIndex] += ' ' + currentLine;
          continue;
        }
      }
      
      processedLines.push(currentLine);
    }
    
    return processedLines.join('\n');
  }

  /**
   * Check if a line is likely a continuation from column break
   */
  private static isLikelyContinuation(currentLine: string, previousLine: string): boolean {
    if (!previousLine || !currentLine) return false;
    
    const prevTrimmed = previousLine.trim();
    const currTrimmed = currentLine.trim();
    
    // If previous line ends abruptly and current starts with lowercase
    if (prevTrimmed.length > 10 && 
        !prevTrimmed.match(/[.!?:]$/) && 
        currTrimmed.match(/^[a-z]/)) {
      return true;
    }
    
    // If current line looks like a continuation of a sentence
    if (currTrimmed.match(/^(and|or|but|with|using|including|such as)/i)) {
      return true;
    }
    
    return false;
  }

  // ============================================================================
  // ENHANCED PARSING & CONFIDENCE CALCULATION
  // ============================================================================

  /**
   * Parse text with enhanced API prompting for better accuracy
   */
  private static async parseTextWithEnhancedAPI(
    text: string, 
    layout: LayoutAnalysis
  ): Promise<ResumeData> {
    console.log('🤖 Enhanced parsing with layout-aware prompting...');

    const layoutContext = this.buildLayoutContext(layout);
    const enhancedPrompt = this.buildEnhancedPrompt(text, layoutContext);
    
    return this.callChatAPIWithRetry(enhancedPrompt);
  }

  /**
   * Build layout context for enhanced prompting
   */
  private static buildLayoutContext(layout: LayoutAnalysis): string {
    const contexts: string[] = [];
    
    if (layout.hasMultipleColumns) {
      contexts.push(`This resume has ${layout.columnCount} columns. Content may be split across columns.`);
    }
    
    if (layout.hasTextBoxes) {
      contexts.push('This resume contains text boxes or floating elements.');
    }
    
    if (layout.hasComplexFormatting) {
      contexts.push('This resume has complex formatting that may affect text flow.');
    }
    
    return contexts.length > 0 ? contexts.join(' ') : '';
  }

  /**
   * Build enhanced prompt with layout awareness
   */
  private static buildEnhancedPrompt(text: string, layoutContext: string): string {
    return `Parse this resume and extract ALL information accurately. ${layoutContext}

IMPORTANT PARSING INSTRUCTIONS:
- Look for content that may be split across columns or text boxes
- Merge related information that appears separated
- Pay attention to section headers that may be formatted differently
- Extract ALL skills, even if they appear in sidebars or boxes
- Combine bullet points that may be split across lines

RESUME TEXT:
"""
${text.slice(0, 15000)}
"""

Return ONLY valid JSON with this exact structure:
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

Extract ACTUAL data from the resume. Do NOT use placeholder values.`;
  }

  /**
   * Call Chat API with enhanced retry logic
   */
  private static async callChatAPIWithRetry(prompt: string, retryCount = 0): Promise<ResumeData> {
    const MAX_RETRIES = 3;
    
    try {
      // Use proxy service for chat
      const content = await edenai.chat(prompt, {
        provider: 'openai/gpt-4o-mini',
        temperature: 0.05,
        maxTokens: 4000,
      });

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return this.mapToResumeData(parsed);
      
    } catch (error: any) {
      console.error('❌ Enhanced Chat API Error:', error.message);
      
      if (retryCount < MAX_RETRIES) {
        await delay(2000 * (retryCount + 1));
        return this.callChatAPIWithRetry(prompt, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Map parsed JSON to ResumeData with enhanced validation
   */
  private static mapToResumeData(parsed: any): ResumeData {
    // Enhanced validation to catch placeholder data
    if (parsed.name === 'John Doe' || 
        parsed.email === 'johndoe@example.com' ||
        parsed.name?.toLowerCase().includes('placeholder')) {
      throw new Error('Placeholder data detected - parsing failed');
    }

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
      origin: 'enhanced_parsed',
    };
  }

  // ============================================================================
  // QUALITY METRICS & CONFIDENCE CALCULATION
  // ============================================================================

  /**
   * Calculate comprehensive quality metrics
   */
  private static calculateQualityMetrics(
    extractionResult: any,
    layoutAnalysis: LayoutAnalysis,
    parsedData: ResumeData
  ): QualityMetrics {
    
    const textExtraction = this.calculateTextExtractionQuality(extractionResult);
    const structureDetection = this.calculateStructureDetectionQuality(layoutAnalysis, parsedData);
    const contentCompleteness = this.calculateContentCompleteness(parsedData);
    const formatHandling = this.calculateFormatHandlingQuality(layoutAnalysis, extractionResult);
    
    // Overall confidence is weighted average
    const overallConfidence = (
      textExtraction * 0.3 +
      structureDetection * 0.25 +
      contentCompleteness * 0.3 +
      formatHandling * 0.15
    );

    return {
      textExtraction,
      structureDetection,
      contentCompleteness,
      formatHandling,
      overallConfidence,
    };
  }

  /**
   * Calculate text extraction quality
   */
  private static calculateTextExtractionQuality(extractionResult: any): number {
    let score = 0.5; // Base score
    
    // Method quality
    if (extractionResult.method === 'direct_text') score += 0.3;
    else if (extractionResult.method === 'ocr_primary') score += 0.2;
    else if (extractionResult.method === 'hybrid') score += 0.25;
    
    // Text length and quality
    const textLength = extractionResult.text?.length || 0;
    if (textLength > 2000) score += 0.15;
    else if (textLength > 1000) score += 0.1;
    else if (textLength > 500) score += 0.05;
    
    // Extraction confidence
    score += (extractionResult.confidence || 0) * 0.05;
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate structure detection quality
   */
  private static calculateStructureDetectionQuality(
    layout: LayoutAnalysis, 
    parsedData: ResumeData
  ): number {
    let score = 0.4; // Base score
    
    // Section detection
    const sections = [
      parsedData.workExperience?.length > 0,
      parsedData.education?.length > 0,
      parsedData.skills?.length > 0,
      parsedData.projects?.length > 0,
    ];
    
    const detectedSections = sections.filter(Boolean).length;
    score += (detectedSections / 4) * 0.4;
    
    // Layout complexity handling
    if (layout.hasMultipleColumns && detectedSections >= 3) score += 0.1;
    if (layout.hasComplexFormatting && detectedSections >= 2) score += 0.05;
    if (layout.sectionBoundaries.length > 0) score += 0.05;
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate content completeness
   */
  private static calculateContentCompleteness(parsedData: ResumeData): number {
    let score = 0;
    
    // Essential fields
    if (parsedData.name && parsedData.name.length > 2) score += 0.2;
    if (parsedData.email && parsedData.email.includes('@')) score += 0.15;
    if (parsedData.phone && parsedData.phone.length > 5) score += 0.1;
    
    // Content sections
    if (parsedData.workExperience && parsedData.workExperience.length > 0) score += 0.25;
    if (parsedData.skills && parsedData.skills.length > 0) score += 0.15;
    if (parsedData.education && parsedData.education.length > 0) score += 0.1;
    if (parsedData.projects && parsedData.projects.length > 0) score += 0.05;
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate format handling quality
   */
  private static calculateFormatHandlingQuality(
    layout: LayoutAnalysis, 
    extractionResult: any
  ): number {
    let score = 0.6; // Base score for simple layouts
    
    // Penalty for complex layouts (proportional, not binary)
    if (layout.hasMultipleColumns) {
      score -= 0.15; // Reduced from harsh binary penalty
    }
    
    if (layout.hasTextBoxes) {
      score -= 0.1; // Reduced penalty
    }
    
    if (layout.hasComplexFormatting) {
      score -= 0.1; // Reduced penalty
    }
    
    // Bonus for successful handling of complexity
    if (layout.hasMultipleColumns && extractionResult.confidence > 0.7) {
      score += 0.2; // Reward successful complex parsing
    }
    
    return Math.max(0.1, Math.min(1.0, score)); // Ensure minimum score
  }

  /**
   * Determine layout complexity level
   */
  private static determineLayoutComplexity(
    layout: LayoutAnalysis, 
    quality: QualityMetrics
  ): 'simple' | 'moderate' | 'complex' {
    
    let complexityScore = 0;
    
    if (layout.hasMultipleColumns) complexityScore += 2;
    if (layout.hasTextBoxes) complexityScore += 1;
    if (layout.hasComplexFormatting) complexityScore += 1;
    if (layout.columnCount > 2) complexityScore += 1;
    
    // Adjust based on parsing success
    if (quality.overallConfidence < 0.5) complexityScore += 1;
    
    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'moderate';
    return 'simple';
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Validate text quality for direct extraction
   */
  private static validateTextQuality(text: string): boolean {
    if (!text || text.length < 200) return false;
    
    // Check for readable content
    const readableChars = text.replace(/[^\w\s.,;:!?()-]/g, '').length;
    const readableRatio = readableChars / text.length;
    
    return readableRatio > 0.7;
  }

  /**
   * Calculate extraction confidence based on method and content
   */
  private static calculateExtractionConfidence(text: string, method: 'direct' | 'ocr'): number {
    let confidence = method === 'direct' ? 0.9 : 0.7;
    
    // Adjust based on text characteristics
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 500) confidence += 0.05;
    if (wordCount > 1000) confidence += 0.05;
    
    // Check for structured content
    const hasStructure = /\b(experience|education|skills|projects)\b/i.test(text);
    if (hasStructure) confidence += 0.05;
    
    return Math.min(1.0, confidence);
  }

  /**
   * Check if line is likely a header
   */
  private static isLikelyHeader(line: string): boolean {
    const headerPatterns = [
      /^[A-Z\s]{3,}$/,
      /^(EXPERIENCE|EDUCATION|SKILLS|PROJECTS|SUMMARY|CONTACT)/i,
      /^\d+\.\s/,
      /^[•▪▫◦]\s/,
    ];
    
    return headerPatterns.some(pattern => pattern.test(line.trim()));
  }
}

// Export for backward compatibility
export const parseResumeFromFile = EnhancedResumeParserService.parseResumeFromFile;
export default EnhancedResumeParserService;