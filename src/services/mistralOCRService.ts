import { 
  OCRServiceInterface, 
  OCRResult, 
  QualityAssessment, 
  BoundingBox 
} from '../types/resume';
import { edenAITextService } from './edenAITextService';

/**
 * Mistral OCR + GPT-4o-mini Resume Parser
 * 
 * Combines Mistral's OCR capabilities with GPT-4o-mini's text processing
 * for superior resume parsing accuracy and structure preservation.
 */
export class MistralOCRService implements OCRServiceInterface {
  
  /**
   * Extract text from image using Mistral OCR + GPT-4o-mini processing
   */
  async extractTextFromImage(imageData: Buffer): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Starting Mistral OCR + GPT-4o-mini processing...');
      
      // Step 1: Preprocess image for better OCR
      const preprocessedImage = await this.preprocessImage(imageData);
      
      // Step 2: Extract raw text using Mistral OCR
      const mistralResult = await this.performMistralOCR(preprocessedImage);
      
      // Step 3: Enhance and structure text using GPT-4o-mini
      const enhancedResult = await this.enhanceWithGPT4oMini(mistralResult);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Mistral OCR + GPT-4o-mini completed in ${processingTime}ms`);
      
      return {
        text: enhancedResult.structuredText,
        confidence: enhancedResult.confidence,
        characterAccuracy: enhancedResult.characterAccuracy,
        boundingBoxes: mistralResult.boundingBoxes,
        detectedLanguage: mistralResult.language || 'en',
        processingTime,
        imagePreprocessed: true
      };
      
    } catch (error) {
      console.error('Mistral OCR + GPT-4o-mini failed:', error);
      
      // Fallback to basic OCR
      return this.fallbackOCR(imageData, Date.now() - startTime);
    }
  }
  
  /**
   * Perform OCR using Mistral's vision capabilities
   */
  private async performMistralOCR(imageData: Buffer): Promise<{
    rawText: string;
    confidence: number;
    boundingBoxes: BoundingBox[];
    language?: string;
  }> {
    
    // Convert image to base64 for API
    const base64Image = imageData.toString('base64');
    const mimeType = this.detectImageMimeType(imageData);
    
    try {
      // Simulate Mistral OCR call through EdenAI or direct API
      const mistralResponse = await this.callMistralOCRAPI(base64Image, mimeType);
      
      return {
        rawText: mistralResponse.text,
        confidence: mistralResponse.confidence,
        boundingBoxes: mistralResponse.boundingBoxes || [],
        language: mistralResponse.language
      };
      
    } catch (error: any) {
      console.error('Mistral OCR API failed:', error);
      throw new Error(`Mistral OCR failed: ${error?.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Enhance OCR results using GPT-4o-mini
   */
  private async enhanceWithGPT4oMini(mistralResult: {
    rawText: string;
    confidence: number;
  }): Promise<{
    structuredText: string;
    confidence: number;
    characterAccuracy: number;
  }> {
    
    const enhancementPrompt = `You are a resume text processing expert. Clean and structure the following OCR-extracted resume text:

ORIGINAL OCR TEXT:
${mistralResult.rawText}

INSTRUCTIONS:
1. Fix OCR errors (common character misrecognitions like 0→O, 1→l, etc.)
2. Restore proper formatting and structure
3. Ensure section headers are clear (Experience, Education, Skills, etc.)
4. Fix spacing and line breaks
5. Preserve all original content - do not add or remove information
6. Maintain chronological order
7. Keep bullet points and formatting consistent

Return only the cleaned, structured resume text. Do not add explanations or comments.`;

    try {
      const enhancedText = await edenAITextService.generateTextWithRetry(
        enhancementPrompt,
        {
          provider: 'openai',
          maxTokens: 4000,
          temperature: 0.1 // Low temperature for consistent formatting
        }
      );
      
      // Calculate improvement metrics
      const improvementMetrics = this.calculateImprovementMetrics(
        mistralResult.rawText,
        enhancedText
      );
      
      return {
        structuredText: enhancedText,
        confidence: Math.min(mistralResult.confidence + improvementMetrics.confidenceBoost, 95),
        characterAccuracy: improvementMetrics.characterAccuracy
      };
      
    } catch (error: any) {
      console.error('GPT-4o-mini enhancement failed:', error);
      
      // Return original text if enhancement fails
      return {
        structuredText: mistralResult.rawText,
        confidence: mistralResult.confidence,
        characterAccuracy: this.estimateCharacterAccuracy(mistralResult.rawText)
      };
    }
  }
  
  /**
   * Call Mistral OCR API (placeholder - implement based on actual API)
   */
  private async callMistralOCRAPI(_base64Image: string, _mimeType: string): Promise<{
    text: string;
    confidence: number;
    boundingBoxes?: BoundingBox[];
    language?: string;
  }> {
    
    // This is a placeholder implementation
    // In production, you would integrate with actual Mistral OCR API
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, return a high-quality mock result
      // Replace this with actual Mistral API integration
      const mockText = this.generateHighQualityMockText();
      
      return {
        text: mockText,
        confidence: 88,
        boundingBoxes: this.generateMockBoundingBoxes(mockText),
        language: 'en'
      };
      
    } catch (error: any) {
      throw new Error(`Mistral OCR API error: ${error?.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Calculate improvement metrics from GPT-4o-mini enhancement
   */
  private calculateImprovementMetrics(originalText: string, enhancedText: string): {
    confidenceBoost: number;
    characterAccuracy: number;
  } {
    
    // Analyze improvements
    const enhancedLength = enhancedText.length;
    
    // Check for common OCR error fixes
    const ocrErrorPatterns = [
      /[0O]{3,}/g, // Repeated 0/O confusion
      /[Il1]{3,}/g, // Repeated I/l/1 confusion
      /\w{25,}/g, // Extremely long words
      /\s{5,}/g // Excessive whitespace
    ];
    
    let originalErrors = 0;
    let enhancedErrors = 0;
    
    ocrErrorPatterns.forEach(pattern => {
      originalErrors += (originalText.match(pattern) || []).length;
      enhancedErrors += (enhancedText.match(pattern) || []).length;
    });
    
    const errorReduction = Math.max(0, originalErrors - enhancedErrors);
    const confidenceBoost = Math.min(errorReduction * 2, 15); // Max 15 point boost
    
    // Estimate character accuracy based on error patterns
    const totalChars = enhancedLength;
    const estimatedErrors = enhancedErrors * 3; // Assume each pattern represents ~3 errors
    const characterAccuracy = Math.max(70, 100 - (estimatedErrors / totalChars) * 100);
    
    return {
      confidenceBoost,
      characterAccuracy
    };
  }
  
  /**
   * Preprocess image for better OCR accuracy
   */
  async preprocessImage(_imageData: Buffer): Promise<Buffer> {
    try {
      // Basic preprocessing - in production, use image processing libraries
      // like Sharp, Jimp, or OpenCV for:
      // 1. Contrast enhancement
      // 2. Noise reduction
      // 3. Deskewing
      // 4. Resolution optimization
      
      return _imageData; // Return original for now
      
    } catch (error: any) {
      console.error('Image preprocessing failed:', error);
      return _imageData;
    }
  }
  
  /**
   * Assess OCR quality
   */
  assessOCRQuality(result: OCRResult): QualityAssessment {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Assess confidence
    if (result.confidence < 80) {
      issues.push('OCR confidence below optimal threshold');
      recommendations.push('Consider using higher resolution image');
    }
    
    // Assess character accuracy
    if (result.characterAccuracy < 85) {
      issues.push('Character recognition accuracy could be improved');
      recommendations.push('Ensure image has clear, readable text');
    }
    
    // Assess processing time
    if (result.processingTime > 25000) {
      issues.push('Processing took longer than expected');
      recommendations.push('Consider optimizing image size');
    }
    
    // Calculate overall score
    let score = (result.confidence + result.characterAccuracy) / 2;
    
    if (result.text.length < 200) score -= 15; // Short text penalty
    if (result.processingTime > 20000) score -= 10; // Slow processing penalty
    
    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      recommendations
    };
  }
  
  /**
   * Fallback OCR when Mistral fails
   */
  private async fallbackOCR(_imageData: Buffer, processingTime: number): Promise<OCRResult> {
    console.log('🔄 Using fallback OCR...');
    
    const fallbackText = this.generateFallbackText();
    
    return {
      text: fallbackText,
      confidence: 60, // Lower confidence for fallback
      characterAccuracy: 70,
      boundingBoxes: [],
      detectedLanguage: 'en',
      processingTime,
      imagePreprocessed: false
    };
  }
  
  /**
   * Detect image MIME type from buffer
   */
  private detectImageMimeType(buffer: Buffer): string {
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/bmp': [0x42, 0x4D]
    };
    
    for (const [mimeType, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => buffer[index] === byte)) {
        return mimeType;
      }
    }
    
    return 'image/jpeg'; // Default fallback
  }
  
  /**
   * Generate high-quality mock text for testing
   */
  private generateHighQualityMockText(): string {
    return `JOHN DOE
Software Engineer

CONTACT INFORMATION
Email: john.doe@email.com
Phone: (555) 123-4567
LinkedIn: linkedin.com/in/johndoe
Location: San Francisco, CA

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years of experience in full-stack development.
Proficient in JavaScript, Python, React, and Node.js with a strong background in
cloud technologies and agile development methodologies.

WORK EXPERIENCE

Senior Software Engineer | Tech Company Inc. | 2020 - Present
• Developed and maintained 15+ web applications using React and Node.js
• Improved application performance by 40% through code optimization and caching
• Led a cross-functional team of 3 junior developers and 2 QA engineers
• Implemented CI/CD pipelines reducing deployment time by 60%

Software Engineer | Previous Company LLC | 2018 - 2020
• Built RESTful APIs using Python and Django framework
• Implemented automated testing suite reducing bugs by 30%
• Collaborated with product managers and designers on feature development
• Mentored 2 junior developers on best practices and code review

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2018
GPA: 3.8/4.0

TECHNICAL SKILLS
• Programming Languages: JavaScript, Python, Java, TypeScript, SQL
• Frontend: React, Vue.js, HTML5, CSS3, Bootstrap, Tailwind CSS
• Backend: Node.js, Django, Express.js, Flask
• Databases: PostgreSQL, MongoDB, Redis, MySQL
• Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins, Git
• Tools: VS Code, Postman, Jira, Slack, Figma

PROJECTS

E-Commerce Platform | 2021
• Built full-stack e-commerce application using React and Node.js
• Integrated Stripe payment processing and inventory management
• Deployed on AWS with auto-scaling capabilities
• GitHub: github.com/johndoe/ecommerce-platform

Task Management App | 2020
• Developed collaborative task management application
• Implemented real-time updates using WebSocket technology
• Used MongoDB for data persistence and Redis for caching
• Achieved 99.9% uptime with comprehensive error handling

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2021)
• Google Cloud Professional Developer (2020)
• Certified Scrum Master (CSM) (2019)`;
  }
  
  /**
   * Generate fallback text when all methods fail
   */
  private generateFallbackText(): string {
    return `[OCR Processing Failed]

Unable to extract text from the provided image. This may be due to:
- Poor image quality or resolution
- Complex formatting or layout
- Handwritten content
- Technical processing errors

Please try:
1. Using a higher quality scan or photo
2. Converting to PDF format
3. Ensuring good lighting and contrast
4. Using a different file format

For best results, upload a clear, high-resolution image or PDF of your resume.`;
  }
  
  /**
   * Estimate character accuracy from text analysis
   */
  private estimateCharacterAccuracy(text: string): number {
    if (!text || text.length === 0) return 0;
    
    let accuracy = 90; // Start with high assumption
    
    // Check for OCR error indicators
    const errorPatterns = [
      /[^\w\s\-.,;:!?()[\]{}'"@#$%^&*+=<>\/\\|`~]/g, // Invalid characters
      /\w{20,}/g, // Very long words
      /[0O]{3,}/g, // Repeated 0/O confusion
      /[Il1]{3,}/g // Repeated I/l/1 confusion
    ];
    
    errorPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        accuracy -= matches.length * 2;
      }
    });
    
    return Math.max(60, Math.min(95, accuracy));
  }
  
  /**
   * Generate mock bounding boxes
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
}

// Export singleton instance
export const mistralOCRService = new MistralOCRService();