import { 
  ProcessedDocument, 
  DocumentFormat, 
  ExtractionMode,
  ParsingQuality,
  LayoutStructure,
  ProcessingWarning
} from '../types/resume';

/**
 * Fallback Processor Service
 * 
 * Provides alternative extraction methods when primary parsing fails.
 * Implements progressive fallback strategy for robust document processing.
 */
export class FallbackProcessor {
  
  private readonly FALLBACK_TIMEOUT = 15000; // 15 seconds for fallback operations
  
  /**
   * Process document using fallback methods when primary parsing fails
   */
  async processFallback(
    file: File, 
    primaryError: Error,
    attemptedMethods: string[] = []
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();
    const warnings: string[] = [];
    
    console.log(`🔄 Fallback processing initiated for ${file.name}`);
    console.log(`   Primary error: ${primaryError.message}`);
    console.log(`   Attempted methods: ${attemptedMethods.join(', ')}`);
    
    try {
      // Progressive fallback strategy
      const fallbackResult = await this.executeProgressiveFallback(
        file, 
        attemptedMethods,
        warnings
      );
      
      const processingTime = Date.now() - startTime;
      
      // Add fallback-specific warnings
      warnings.push('Document processed using fallback methods - quality may be reduced');
      warnings.push(`Primary parsing failed: ${primaryError.message}`);
      
      if (processingTime > 10000) {
        warnings.push('Fallback processing took longer than expected');
      }
      
      return {
        extractedText: fallbackResult.text,
        extractionMode: fallbackResult.extractionMode,
        layoutStructure: fallbackResult.layoutStructure,
        parsingQuality: fallbackResult.parsingQuality,
        confidence: Math.max(0, fallbackResult.confidence - 20), // Reduce confidence for fallback
        warnings
      };
      
    } catch (fallbackError) {
      console.error('All fallback methods failed:', fallbackError);
      
      // Return minimal viable result
      return this.createMinimalResult(file, [
        `Primary parsing failed: ${primaryError.message}`,
        `Fallback processing failed: ${fallbackError.message}`,
        'Please try a different file format or contact support'
      ]);
    }
  }
  
  /**
   * Execute progressive fallback strategy
   */
  private async executeProgressiveFallback(
    file: File,
    attemptedMethods: string[],
    warnings: string[]
  ): Promise<{
    text: string;
    extractionMode: ExtractionMode;
    layoutStructure: LayoutStructure;
    parsingQuality: ParsingQuality;
    confidence: number;
  }> {
    
    // Strategy 1: Simple text extraction (fastest)
    if (!attemptedMethods.includes('simple_text')) {
      try {
        console.log('🔄 Trying simple text extraction...');
        const result = await this.simpleTextExtraction(file);
        if (result.text.length > 50) {
          warnings.push('Used simple text extraction method');
          return result;
        }
      } catch (error) {
        console.log('Simple text extraction failed:', error);
      }
    }
    
    // Strategy 2: Basic OCR (if image-based)
    if (!attemptedMethods.includes('basic_ocr') && this.isImageBased(file)) {
      try {
        console.log('🔄 Trying basic OCR extraction...');
        const result = await this.basicOCRExtraction(file);
        if (result.text.length > 30) {
          warnings.push('Used basic OCR extraction method');
          return result;
        }
      } catch (error) {
        console.log('Basic OCR extraction failed:', error);
      }
    }
    
    // Strategy 3: Manual guidance extraction
    if (!attemptedMethods.includes('manual_guidance')) {
      console.log('🔄 Providing manual guidance...');
      const result = await this.manualGuidanceExtraction(file);
      warnings.push('Automatic extraction failed - manual guidance provided');
      return result;
    }
    
    throw new Error('All fallback strategies exhausted');
  }
  
  /**
   * Simple text extraction for basic document formats
   */
  private async simpleTextExtraction(file: File): Promise<{
    text: string;
    extractionMode: ExtractionMode;
    layoutStructure: LayoutStructure;
    parsingQuality: ParsingQuality;
    confidence: number;
  }> {
    
    let extractedText = '';
    
    if (file.type === 'text/plain') {
      // Direct text file reading
      extractedText = await file.text();
    } else if (file.type === 'application/pdf') {
      // Basic PDF text extraction (placeholder)
      extractedText = await this.extractBasicPDFText(file);
    } else {
      // Try to read as text anyway
      try {
        extractedText = await file.text();
      } catch {
        extractedText = `[Unable to extract text from ${file.name}]`;
      }
    }
    
    return {
      text: extractedText,
      extractionMode: 'TEXT',
      layoutStructure: this.getSimpleLayoutStructure(),
      parsingQuality: this.assessSimpleParsingQuality(extractedText),
      confidence: extractedText.length > 100 ? 60 : 30
    };
  }
  
  /**
   * Basic OCR extraction for image files
   */
  private async basicOCRExtraction(file: File): Promise<{
    text: string;
    extractionMode: ExtractionMode;
    layoutStructure: LayoutStructure;
    parsingQuality: ParsingQuality;
    confidence: number;
  }> {
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use OCR service for extraction
    const { ocrService } = await import('./ocrService');
    const ocrResult = await ocrService.extractTextFromImage(buffer);
    
    return {
      text: ocrResult.text,
      extractionMode: 'OCR',
      layoutStructure: this.getSimpleLayoutStructure(),
      parsingQuality: this.convertOCRToParsingQuality(ocrResult),
      confidence: ocrResult.confidence
    };
  }
  
  /**
   * Manual guidance when all automatic methods fail
   */
  private async manualGuidanceExtraction(file: File): Promise<{
    text: string;
    extractionMode: ExtractionMode;
    layoutStructure: LayoutStructure;
    parsingQuality: ParsingQuality;
    confidence: number;
  }> {
    
    const guidanceText = this.generateManualGuidance(file);
    
    return {
      text: guidanceText,
      extractionMode: 'TEXT',
      layoutStructure: this.getSimpleLayoutStructure(),
      parsingQuality: {
        textAccuracy: 0,
        structurePreservation: 0,
        contentCompleteness: 0,
        orderingAccuracy: 0,
        overallScore: 0
      },
      confidence: 0
    };
  }
  
  /**
   * Extract basic text from PDF (placeholder)
   */
  private async extractBasicPDFText(file: File): Promise<string> {
    // In production, this would use a PDF parsing library
    // For now, return a placeholder that indicates PDF processing
    return `[PDF Document: ${file.name}]
    
This PDF document could not be automatically processed. 
Please try one of the following:

1. Save the PDF as a text file (.txt) and upload again
2. Copy and paste the resume content directly into the text area
3. Convert the PDF to a Word document (.docx) format
4. Ensure the PDF is not password protected or corrupted

File details:
- Name: ${file.name}
- Size: ${(file.size / 1024).toFixed(1)} KB
- Type: ${file.type}`;
  }
  
  /**
   * Generate manual guidance text
   */
  private generateManualGuidance(file: File): string {
    const fileType = this.getFileTypeDescription(file.type);
    
    return `[Document Processing Failed: ${file.name}]

We were unable to automatically extract text from your ${fileType} file.

RECOMMENDED ACTIONS:

1. FILE FORMAT SOLUTIONS:
   • Convert to PDF or Word document (.docx)
   • Save as plain text file (.txt)
   • Ensure file is not corrupted or password-protected

2. MANUAL INPUT OPTIONS:
   • Copy and paste resume content directly into the text area
   • Use the resume builder to recreate your resume
   • Upload a different version of your resume

3. IMAGE-BASED DOCUMENTS:
   • Ensure image is high quality and text is clearly readable
   • Try scanning at higher resolution (300+ DPI)
   • Avoid handwritten content or decorative fonts

4. TECHNICAL REQUIREMENTS:
   • File size should be under 10MB
   • Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG
   • Avoid files with complex layouts, tables, or graphics

CONTACT SUPPORT:
If you continue to experience issues, please contact our support team with:
- File name: ${file.name}
- File size: ${(file.size / 1024).toFixed(1)} KB
- File type: ${file.type}
- Error details: Automatic text extraction failed

We'll help you get your resume processed successfully.`;
  }
  
  /**
   * Check if file is image-based
   */
  private isImageBased(file: File): boolean {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/bmp'];
    return imageTypes.includes(file.type.toLowerCase());
  }
  
  /**
   * Get simple layout structure for fallback
   */
  private getSimpleLayoutStructure(): LayoutStructure {
    return {
      columns: {
        columnCount: 1,
        columnBoundaries: [],
        readingOrder: [],
        confidence: 50
      },
      textboxes: [],
      tables: [],
      elements: [],
      complexity: 'simple'
    };
  }
  
  /**
   * Assess parsing quality for simple extraction
   */
  private assessSimpleParsingQuality(text: string): ParsingQuality {
    const textLength = text.length;
    
    let textAccuracy = 70; // Lower assumption for fallback
    let structurePreservation = 40; // Minimal structure preservation
    let contentCompleteness = textLength > 100 ? 60 : 20;
    let orderingAccuracy = 50; // Basic ordering
    
    const overallScore = (textAccuracy + structurePreservation + contentCompleteness + orderingAccuracy) / 4;
    
    return {
      textAccuracy,
      structurePreservation,
      contentCompleteness,
      orderingAccuracy,
      overallScore
    };
  }
  
  /**
   * Convert OCR result to parsing quality
   */
  private convertOCRToParsingQuality(ocrResult: any): ParsingQuality {
    return {
      textAccuracy: ocrResult.characterAccuracy || 70,
      structurePreservation: 60, // OCR has limited structure preservation
      contentCompleteness: ocrResult.text.length > 100 ? 70 : 30,
      orderingAccuracy: 65,
      overallScore: ocrResult.confidence || 60
    };
  }
  
  /**
   * Create minimal result when all methods fail
   */
  private createMinimalResult(file: File, warnings: string[]): ProcessedDocument {
    return {
      extractedText: this.generateManualGuidance(file),
      extractionMode: 'TEXT',
      layoutStructure: this.getSimpleLayoutStructure(),
      parsingQuality: {
        textAccuracy: 0,
        structurePreservation: 0,
        contentCompleteness: 0,
        orderingAccuracy: 0,
        overallScore: 0
      },
      confidence: 0,
      warnings
    };
  }
  
  /**
   * Get user-friendly file type description
   */
  private getFileTypeDescription(mimeType: string): string {
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'text/plain': 'Text File',
      'image/jpeg': 'JPEG Image',
      'image/jpg': 'JPEG Image',
      'image/png': 'PNG Image',
      'image/tiff': 'TIFF Image',
      'image/bmp': 'BMP Image'
    };
    
    return typeMap[mimeType] || 'Document';
  }
  
  /**
   * Validate fallback processing requirements
   */
  validateFallbackRequirements(file: File, error: Error): {
    canProcess: boolean;
    reason?: string;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    // Check file size
    if (file.size > 50 * 1024 * 1024) { // 50MB
      return {
        canProcess: false,
        reason: 'File too large for fallback processing',
        recommendations: ['Reduce file size to under 50MB', 'Split large documents into smaller files']
      };
    }
    
    // Check file type
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (!supportedTypes.includes(file.type)) {
      recommendations.push('Convert to a supported format (PDF, DOC, DOCX, TXT, JPG, PNG)');
    }
    
    // Add general recommendations
    recommendations.push('Ensure file is not corrupted or password-protected');
    recommendations.push('Try copying and pasting content directly if file upload fails');
    
    return {
      canProcess: true,
      recommendations
    };
  }
}

// Export singleton instance
export const fallbackProcessor = new FallbackProcessor();