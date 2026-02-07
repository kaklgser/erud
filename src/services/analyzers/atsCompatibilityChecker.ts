// src/services/analyzers/atsCompatibilityChecker.ts
import { ATSCompatibilityCheckerInterface, ATSCompatibilityResult } from '../../types/resume';

/**
 * ATSCompatibilityChecker - Analyzes resume formatting for ATS compatibility
 * 
 * Handles:
 * - Table detection that may break ATS parsing
 * - Image and icon identification that ATS cannot process
 * - Multi-column layout detection that confuses ATS systems
 * - Fancy font and color detection that may not render properly
 * - Text-in-shapes/graphics detection that ATS cannot extract
 * - Header/footer analysis for contact information that may be missed
 */
export class ATSCompatibilityChecker implements ATSCompatibilityCheckerInterface {
  
  private readonly TABLE_PATTERNS = [
    /\|[\s\S]*?\|/g,                    // Markdown-style tables
    /<table[\s\S]*?<\/table>/gi,        // HTML tables
    /\+[-=]+\+/g,                       // ASCII table borders
    /┌[\s\S]*?┘/g,                      // Unicode box drawing
    /╔[\s\S]*?╝/g,                      // Double-line box drawing
  ];

  private readonly IMAGE_ICON_PATTERNS = [
    /<img[\s\S]*?>/gi,                  // HTML images
    /\.(jpg|jpeg|png|gif|svg|bmp|webp)/gi, // Image file extensions
    /📧|📱|💼|🏠|🌐|📍|✉️|📞/g,          // Common resume emojis
    /[★☆✓✗●○■□▲▼◆◇]/g,               // Symbol characters
    /[►▶▷▸▹▻▼▽▾▿◀◁◂◃◄◅]/g,           // Arrow symbols
  ];

  private readonly MULTI_COLUMN_INDICATORS = [
    /\s{10,}/g,                         // Large gaps indicating columns
    /\t{2,}/g,                          // Multiple tabs
    /(?:.*\s{15,}.*\n){3,}/g,          // Multiple lines with large gaps
  ];

  private readonly FANCY_FONT_INDICATORS = [
    /[\u{1D400}-\u{1D7FF}]/gu,         // Mathematical Alphanumeric Symbols block
    /[\u{1D49C}-\u{1D4CF}]/gu,         // Script/calligraphy subset
    /[\u{1D504}-\u{1D537}]/gu,         // Fraktur subset
    /[\u{1D56C}-\u{1D59F}]/gu,         // Double-struck subset
  ];

  private readonly COLOR_INDICATORS = [
    /#[0-9a-fA-F]{3,6}/g,              // Hex colors
    /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi, // RGB colors
    /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/gi, // RGBA colors
    /color:\s*[a-zA-Z]+/gi,            // Named colors in CSS
    /<font[\s\S]*?color[\s\S]*?>/gi,   // HTML font color
  ];

  private readonly GRAPHICS_TEXT_PATTERNS = [
    /<svg[\s\S]*?<text[\s\S]*?<\/svg>/gi, // SVG with text
    /<canvas[\s\S]*?>/gi,               // Canvas elements
    /\[.*?\]\(.*?\)/g,                  // Markdown links (could be images)
  ];

  /**
   * Check ATS compatibility of resume formatting
   */
  checkCompatibility(resumeText: string, extractionMode: string): ATSCompatibilityResult {
    console.log('🔍 ATSCompatibilityChecker: Starting ATS compatibility analysis...');
    
    const result: ATSCompatibilityResult = {
      critical_errors: [],
      warnings: [],
      compatibility_score: 100,
      has_tables: this.detectTables(resumeText),
      has_images_icons: this.detectImagesIcons(resumeText),
      has_multi_columns: this.detectMultiColumns(resumeText),
      has_fancy_fonts_colors: this.detectFancyFontsColors(resumeText),
      has_text_in_graphics: this.detectTextInGraphics(resumeText),
      has_problematic_headers_footers: this.detectProblematicHeadersFooters(resumeText)
    };

    // Calculate compatibility issues and score
    this.assessCompatibilityIssues(result, extractionMode);

    console.log('📊 ATS Compatibility Results:', {
      score: result.compatibility_score,
      critical_errors: result.critical_errors.length,
      warnings: result.warnings.length,
      has_tables: result.has_tables,
      has_images: result.has_images_icons,
      has_columns: result.has_multi_columns
    });

    return result;
  }

  /**
   * Detect tables that may break ATS parsing
   */
  private detectTables(text: string): boolean {
    return this.TABLE_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Detect images and icons that ATS cannot process
   */
  private detectImagesIcons(text: string): boolean {
    return this.IMAGE_ICON_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Detect multi-column layouts that confuse ATS systems
   */
  private detectMultiColumns(text: string): boolean {
    // Check for consistent large gaps across multiple lines (indicating columns)
    const lines = text.split('\n');
    let columnIndicators = 0;
    
    for (const line of lines) {
      // Look for lines with large gaps that might indicate column separation
      if (/\s{15,}/.test(line) && line.trim().length > 20) {
        columnIndicators++;
      }
    }
    
    // If more than 20% of substantial lines have large gaps, likely multi-column
    const substantialLines = lines.filter(line => line.trim().length > 10).length;
    const columnRatio = columnIndicators / Math.max(substantialLines, 1);
    
    return columnRatio > 0.2 || this.MULTI_COLUMN_INDICATORS.some(pattern => pattern.test(text));
  }

  /**
   * Detect fancy fonts or colors that may not render properly
   */
  private detectFancyFontsColors(text: string): boolean {
    const hasFancyFonts = this.FANCY_FONT_INDICATORS.some(pattern => pattern.test(text));
    const hasColors = this.COLOR_INDICATORS.some(pattern => pattern.test(text));
    
    return hasFancyFonts || hasColors;
  }

  /**
   * Detect text inside shapes or graphics that ATS cannot extract
   */
  private detectTextInGraphics(text: string): boolean {
    return this.GRAPHICS_TEXT_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Detect headers and footers containing contact information that may be missed
   */
  private detectProblematicHeadersFooters(text: string): boolean {
    const lines = text.split('\n');
    const firstFewLines = lines.slice(0, 3).join('\n');
    const lastFewLines = lines.slice(-3).join('\n');
    
    // Check if contact info appears only in first/last few lines (potential header/footer)
    const contactPatterns = [
      /@[\w.-]+\.\w+/,                   // Email
      /[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/, // Phone
      /linkedin\.com/i,                  // LinkedIn
      /github\.com/i                     // GitHub
    ];
    
    const hasContactInHeader = contactPatterns.some(pattern => pattern.test(firstFewLines));
    const hasContactInFooter = contactPatterns.some(pattern => pattern.test(lastFewLines));
    const hasContactInBody = contactPatterns.some(pattern => 
      pattern.test(lines.slice(3, -3).join('\n'))
    );
    
    // Problematic if contact info is ONLY in header/footer
    return (hasContactInHeader || hasContactInFooter) && !hasContactInBody;
  }

  /**
   * Assess compatibility issues and calculate score
   */
  private assessCompatibilityIssues(result: ATSCompatibilityResult, extractionMode: string): void {
    let scoreDeduction = 0;
    
    // OCR extraction mode indicates image-based resume (major issue)
    if (extractionMode === 'OCR') {
      result.critical_errors.push('Resume appears to be image-based (JPG/PNG) which is not ATS-compatible');
      scoreDeduction += 40;
    }
    
    // Tables (critical issue)
    if (result.has_tables) {
      result.critical_errors.push('Tables detected - ATS systems cannot parse tabular data correctly');
      scoreDeduction += 25;
    }
    
    // Multi-column layout (critical issue)
    if (result.has_multi_columns) {
      result.critical_errors.push('Multi-column layout detected - ATS systems read left-to-right and may scramble content');
      scoreDeduction += 20;
    }
    
    // Images and icons (major issue)
    if (result.has_images_icons) {
      result.critical_errors.push('Images, icons, or symbols detected - ATS systems cannot process visual elements');
      scoreDeduction += 15;
    }
    
    // Text in graphics (major issue)
    if (result.has_text_in_graphics) {
      result.critical_errors.push('Text inside graphics or shapes detected - ATS cannot extract this information');
      scoreDeduction += 15;
    }
    
    // Fancy fonts and colors (moderate issue)
    if (result.has_fancy_fonts_colors) {
      result.warnings.push('Fancy fonts or colors detected - may not render correctly in all ATS systems');
      scoreDeduction += 10;
    }
    
    // Problematic headers/footers (moderate issue)
    if (result.has_problematic_headers_footers) {
      result.warnings.push('Contact information may be in headers/footers - some ATS systems ignore these areas');
      scoreDeduction += 10;
    }
    
    // Additional format-specific warnings
    this.addFormatSpecificWarnings(result);
    
    // Calculate final score
    result.compatibility_score = Math.max(0, 100 - scoreDeduction);
  }

  /**
   * Add format-specific warnings
   */
  private addFormatSpecificWarnings(result: ATSCompatibilityResult): void {
    // Add general ATS best practice warnings
    if (result.compatibility_score < 80) {
      result.warnings.push('Consider creating a plain-text version of your resume for maximum ATS compatibility');
    }
    
    if (result.critical_errors.length > 0) {
      result.warnings.push('Critical ATS issues detected - strongly recommend using a simple, single-column format');
    }
  }

  /**
   * Get ATS compatibility insights
   */
  getCompatibilityInsights(result: ATSCompatibilityResult): string[] {
    const insights: string[] = [];
    
    // Critical issues
    if (result.critical_errors.length > 0) {
      insights.push(`${result.critical_errors.length} critical ATS issues found that may prevent proper parsing`);
      result.critical_errors.forEach(error => {
        insights.push(`• ${error}`);
      });
    }
    
    // Warnings
    if (result.warnings.length > 0) {
      insights.push(`${result.warnings.length} potential ATS issues that could affect parsing`);
      result.warnings.forEach(warning => {
        insights.push(`• ${warning}`);
      });
    }
    
    // Score-based recommendations
    if (result.compatibility_score >= 90) {
      insights.push('Excellent ATS compatibility - your resume should parse correctly in most systems');
    } else if (result.compatibility_score >= 70) {
      insights.push('Good ATS compatibility with minor issues - consider addressing warnings for optimal results');
    } else if (result.compatibility_score >= 50) {
      insights.push('Moderate ATS compatibility - several issues need attention for reliable parsing');
    } else {
      insights.push('Poor ATS compatibility - major formatting changes needed for ATS systems to parse correctly');
    }
    
    // Specific recommendations
    if (result.has_tables || result.has_multi_columns) {
      insights.push('Recommendation: Use a simple, single-column layout with clear section headers');
    }
    
    if (result.has_images_icons) {
      insights.push('Recommendation: Remove all images, icons, and symbols - use text-only formatting');
    }
    
    if (result.has_fancy_fonts_colors) {
      insights.push('Recommendation: Use standard fonts (Arial, Calibri, Times New Roman) and black text only');
    }
    
    return insights;
  }

  /**
   * Get ATS-friendly formatting recommendations
   */
  getATSFriendlyRecommendations(): string[] {
    return [
      'Use a simple, single-column layout',
      'Stick to standard fonts (Arial, Calibri, Times New Roman)',
      'Use black text on white background',
      'Avoid tables, text boxes, and multi-column layouts',
      'Remove all images, icons, graphics, and symbols',
      'Use clear section headers (EXPERIENCE, EDUCATION, SKILLS)',
      'Save as PDF or Word document (avoid image formats)',
      'Keep contact information in the main body, not headers/footers',
      'Use standard bullet points (• or -) instead of fancy symbols',
      'Ensure consistent formatting throughout the document'
    ];
  }
}

// Export singleton instance
export const atsCompatibilityChecker = new ATSCompatibilityChecker();