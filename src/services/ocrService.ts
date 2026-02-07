import { 
  OCRServiceInterface, 
  OCRResult, 
  QualityAssessment, 
  BoundingBox,
  OCRQuality 
} from '../types/resume';

/**
 * OCR Service
 * 
 * Provides optical character recognition capabilities for image-based documents.
 * Implements text extraction with quality assessment and preprocessing optimization.
 */
export class OCRService implements OCRServiceInterface {
  
  /**
   * Extract text from image data using OCR
   */
  async extractTextFromImage(imageData: Buffer, useEnhanced: boolean = false): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      // Use enhanced Mistral OCR + GPT-4o-mini if requested
      if (useEnhanced) {
        return await this.extractWithMistralOCR(imageData);
      }
      
      // Preprocess image for better OCR accuracy
      const preprocessedImage = await this.preprocessImage(imageData);
      
      // Perform OCR extraction (placeholder implementation)
      const ocrResult = await this.performOCR(preprocessedImage);
      
      const processingTime = Date.now() - startTime;
      
      return {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        characterAccuracy: this.calculateCharacterAccuracy(ocrResult.text),
        boundingBoxes: ocrResult.boundingBoxes,
        detectedLanguage: ocrResult.detectedLanguage || 'en',
        processingTime,
        imagePreprocessed: true
      };
      
    } catch (error) {
      console.error('OCR extraction failed:', error);
      
      // Return fallback result
      return {
        text: '',
        confidence: 0,
        characterAccuracy: 0,
        boundingBoxes: [],
        detectedLanguage: 'en',
        processingTime: Date.now() - startTime,
        imagePreprocessed: false
      };
    }
  }

  /**
   * Extract text using enhanced Mistral OCR + GPT-4o-mini
   */
  async extractWithMistralOCR(imageData: Buffer): Promise<OCRResult> {
    try {
      const { mistralOCRService } = await import('./mistralOCRService');
      console.log('🔍 Using enhanced Mistral OCR + GPT-4o-mini processing...');
      
      const result = await mistralOCRService.extractTextFromImage(imageData);
      
      console.log(`✅ Enhanced OCR completed with ${result.confidence}% confidence`);
      return result;
      
    } catch (error) {
      console.error('Enhanced Mistral OCR failed, falling back to basic OCR:', error);
      
      // Fallback to basic OCR
      const startTime = Date.now();
      const preprocessedImage = await this.preprocessImage(imageData);
      const ocrResult = await this.performOCR(preprocessedImage);
      const processingTime = Date.now() - startTime;
      
      return {
        text: ocrResult.text,
        confidence: ocrResult.confidence * 0.8, // Reduce confidence for fallback
        characterAccuracy: this.calculateCharacterAccuracy(ocrResult.text),
        boundingBoxes: ocrResult.boundingBoxes,
        detectedLanguage: ocrResult.detectedLanguage || 'en',
        processingTime,
        imagePreprocessed: true
      };
    }
  }
  
  /**
   * Preprocess image to improve OCR accuracy
   */
  async preprocessImage(imageData: Buffer): Promise<Buffer> {
    try {
      // Image preprocessing steps:
      // 1. Enhance contrast
      // 2. Remove noise
      // 3. Optimize resolution
      // 4. Correct skew/rotation
      
      // For now, return original image data
      // In full implementation, this would use image processing libraries
      return imageData;
      
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return imageData; // Return original on failure
    }
  }
  
  /**
   * Assess OCR quality based on results
   */
  assessOCRQuality(result: OCRResult): QualityAssessment {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Assess confidence level
    if (result.confidence < 70) {
      issues.push('Low OCR confidence detected');
      recommendations.push('Consider using a higher quality image or different file format');
    }
    
    // Assess character accuracy
    if (result.characterAccuracy < 80) {
      issues.push('Character recognition accuracy is below optimal threshold');
      recommendations.push('Ensure image has clear, readable text without distortion');
    }
    
    // Assess text length
    if (result.text.length < 100) {
      issues.push('Very little text extracted from image');
      recommendations.push('Verify that the image contains readable text content');
    }
    
    // Assess processing time
    if (result.processingTime > 20000) { // 20 seconds
      issues.push('OCR processing took longer than expected');
      recommendations.push('Consider optimizing image size or format');
    }
    
    // Calculate overall quality score
    let score = 100;
    score -= Math.max(0, (80 - result.confidence) * 0.5); // Confidence penalty
    score -= Math.max(0, (85 - result.characterAccuracy) * 0.3); // Accuracy penalty
    
    if (result.text.length < 100) score -= 20; // Length penalty
    if (!result.imagePreprocessed) score -= 10; // Preprocessing penalty
    
    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      recommendations
    };
  }
  
  /**
   * Perform actual OCR processing (placeholder implementation)
   */
  private async performOCR(imageData: Buffer): Promise<{
    text: string;
    confidence: number;
    boundingBoxes: BoundingBox[];
    detectedLanguage?: string;
  }> {
    // Simulate OCR processing delay (reduced for testing)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Placeholder OCR result
    // In full implementation, this would integrate with OCR services like:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Tesseract.js
    
    const mockText = this.generateMockOCRText();
    const confidence = this.calculateMockConfidence(imageData);
    
    return {
      text: mockText,
      confidence,
      boundingBoxes: this.generateMockBoundingBoxes(mockText),
      detectedLanguage: 'en'
    };
  }
  
  /**
   * Calculate character accuracy based on text analysis
   */
  private calculateCharacterAccuracy(text: string): number {
    if (!text || text.length === 0) return 0;
    
    // Analyze text for OCR quality indicators
    let accuracy = 95; // Start with high assumption
    
    // Check for common OCR errors
    const ocrErrorPatterns = [
      /[^\w\s\-.,;:!?()[\]{}'"@#$%^&*+=<>\/\\|`~]/g, // Invalid characters
      /\w{25,}/g, // Extremely long words (likely OCR errors)
      /[0O]{3,}/g, // Repeated 0/O confusion
      /[Il1]{3,}/g, // Repeated I/l/1 confusion
      /\s{5,}/g // Excessive whitespace
    ];
    
    ocrErrorPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        accuracy -= matches.length * 2; // Reduce accuracy for each error pattern
      }
    });
    
    // Check for reasonable word distribution
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    if (avgWordLength > 15 || avgWordLength < 2) {
      accuracy -= 10; // Unusual word length distribution
    }
    
    return Math.max(0, Math.min(100, accuracy));
  }
  
  /**
   * Generate mock OCR text for testing
   */
  private generateMockOCRText(): string {
    return `JOHN DOE
Software Engineer

CONTACT INFORMATION
Email: john.doe@email.com
Phone: (555) 123-4567
LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years of experience in full-stack development.
Proficient in JavaScript, Python, and cloud technologies.

WORK EXPERIENCE
Senior Software Engineer | Tech Company | 2020-Present
• Developed and maintained web applications using React and Node.js
• Improved application performance by 40% through optimization
• Led a team of 3 junior developers

Software Engineer | Previous Company | 2018-2020
• Built RESTful APIs using Python and Django
• Implemented automated testing reducing bugs by 30%
• Collaborated with cross-functional teams

EDUCATION
Bachelor of Science in Computer Science
University Name | 2018

SKILLS
• Programming: JavaScript, Python, Java, TypeScript
• Frameworks: React, Node.js, Django, Express
• Databases: PostgreSQL, MongoDB, Redis
• Cloud: AWS, Docker, Kubernetes`;
  }
  
  /**
   * Calculate mock confidence based on image properties
   */
  private calculateMockConfidence(imageData: Buffer): number {
    // Simulate confidence calculation based on image size and quality
    const imageSize = imageData.length;
    
    let confidence = 85; // Base confidence
    
    // Adjust based on image size (larger images generally have better quality)
    if (imageSize > 1000000) { // > 1MB
      confidence += 10;
    } else if (imageSize < 100000) { // < 100KB
      confidence -= 15;
    }
    
    // Add some randomness to simulate real OCR variance
    confidence += (Math.random() - 0.5) * 10;
    
    return Math.max(60, Math.min(95, confidence));
  }
  
  /**
   * Generate mock bounding boxes for text regions
   */
  private generateMockBoundingBoxes(text: string): BoundingBox[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const boundingBoxes: BoundingBox[] = [];
    
    lines.forEach((line, index) => {
      boundingBoxes.push({
        x: 50,
        y: 50 + (index * 25),
        width: Math.min(500, line.length * 8),
        height: 20
      });
    });
    
    return boundingBoxes;
  }
  

  
  /**
   * Get OCR quality metrics
   */
  getOCRQuality(result: OCRResult): OCRQuality {
    return {
      characterAccuracy: result.characterAccuracy,
      wordAccuracy: this.calculateWordAccuracy(result.text),
      confidence: result.confidence,
      imageQuality: this.assessImageQuality(result),
      textClarity: this.assessTextClarity(result.text)
    };
  }
  
  /**
   * Calculate word-level accuracy
   */
  private calculateWordAccuracy(text: string): number {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 0;
    
    let validWords = 0;
    
    words.forEach(word => {
      // Simple validation: word should contain mostly letters
      const letterRatio = (word.match(/[a-zA-Z]/g) || []).length / word.length;
      if (letterRatio > 0.7) {
        validWords++;
      }
    });
    
    return (validWords / words.length) * 100;
  }
  
  /**
   * Assess image quality based on OCR results
   */
  private assessImageQuality(result: OCRResult): number {
    let quality = result.confidence;
    
    // Adjust based on processing time (faster usually means clearer image)
    if (result.processingTime < 5000) quality += 5;
    else if (result.processingTime > 15000) quality -= 10;
    
    // Adjust based on text extraction success
    if (result.text.length > 1000) quality += 5;
    else if (result.text.length < 100) quality -= 15;
    
    return Math.max(0, Math.min(100, quality));
  }
  
  /**
   * Assess text clarity from OCR results
   */
  private assessTextClarity(text: string): number {
    if (!text || text.length === 0) return 0;
    
    let clarity = 90; // Start with high assumption
    
    // Check for garbled text indicators
    const garbledPatterns = [
      /[^\w\s\-.,;:!?()[\]{}'"@#$%^&*+=<>\/\\|`~]/g,
      /\w{20,}/g, // Very long words
      /[0O]{4,}/g, // Repeated character confusion
      /\s{3,}/g // Excessive spacing
    ];
    
    garbledPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        clarity -= matches.length * 3;
      }
    });
    
    return Math.max(0, Math.min(100, clarity));
  }

  /**
   * Detect if document requires OCR processing
   */
  detectOCRRequirement(file: File): boolean {
    const imageFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/bmp'];
    
    // Direct image files always need OCR
    if (imageFormats.includes(file.type.toLowerCase())) {
      return true;
    }
    
    // Check for scanned PDF indicators
    if (file.type === 'application/pdf') {
      // In production, this would analyze PDF content to detect if it's image-based
      // For now, use file size heuristics (very large PDFs are often scanned)
      return file.size > 5000000; // 5MB+ PDFs likely scanned
    }
    
    return false;
  }

  /**
   * Route document to appropriate extraction method
   */
  async routeDocumentExtraction(file: File): Promise<{ 
    extractionMode: 'TEXT' | 'OCR' | 'HYBRID'; 
    requiresOCR: boolean; 
    recommendedStrategy: 'direct' | 'ocr' | 'hybrid' | 'fallback'
  }> {
    const requiresOCR = this.detectOCRRequirement(file);
    
    if (requiresOCR) {
      return {
        extractionMode: 'OCR',
        requiresOCR: true,
        recommendedStrategy: 'ocr'
      };
    }
    
    // Check for complex layouts that might benefit from hybrid approach
    const isComplexFormat = file.type === 'application/pdf' && file.size > 1000000; // 1MB+
    
    if (isComplexFormat) {
      return {
        extractionMode: 'HYBRID',
        requiresOCR: false,
        recommendedStrategy: 'hybrid'
      };
    }
    
    return {
      extractionMode: 'TEXT',
      requiresOCR: false,
      recommendedStrategy: 'direct'
    };
  }
}

// Export singleton instance
export const ocrService = new OCRService();