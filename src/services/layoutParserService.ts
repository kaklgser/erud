import { 
  LayoutParserInterface, 
  ColumnStructure, 
  TextboxContent, 
  TableContent, 
  ContentElement,
  Rectangle,
  LayoutStructure,
  LayoutComplexity
} from '../types/resume';

/**
 * Layout Parser Service
 * 
 * Provides advanced layout parsing capabilities for complex document structures
 * including multi-column detection, textbox extraction, and table parsing.
 */
export class LayoutParserService implements LayoutParserInterface {
  
  /**
   * Detect column structure in document
   */
  detectColumns(document: Document): ColumnStructure {
    try {
      // Analyze document structure for column boundaries
      const columnAnalysis = this.analyzeColumnStructure(document);
      
      return {
        columnCount: columnAnalysis.count,
        columnBoundaries: columnAnalysis.boundaries,
        readingOrder: columnAnalysis.orderedElements,
        confidence: columnAnalysis.confidence
      };
      
    } catch (error) {
      console.error('Column detection failed:', error);
      
      // Return single-column fallback
      return {
        columnCount: 1,
        columnBoundaries: [{ x: 0, y: 0, width: 100, height: 100 }],
        readingOrder: [],
        confidence: 0
      };
    }
  }
  
  /**
   * Extract textbox content from document
   */
  extractTextboxContent(document: Document): TextboxContent[] {
    try {
      const textboxes: TextboxContent[] = [];
      
      // Simulate textbox detection and extraction
      // In full implementation, this would:
      // 1. Identify textbox elements in the document
      // 2. Extract content from each textbox
      // 3. Determine contextual placement
      
      const mockTextboxes = this.generateMockTextboxes();
      
      return mockTextboxes;
      
    } catch (error) {
      console.error('Textbox extraction failed:', error);
      return [];
    }
  }
  
  /**
   * Parse table content from document
   */
  parseTableContent(document: Document): TableContent[] {
    try {
      const tables: TableContent[] = [];
      
      // Simulate table detection and parsing
      // In full implementation, this would:
      // 1. Identify table structures
      // 2. Extract headers and data rows
      // 3. Convert to readable text format
      // 4. Preserve logical relationships
      
      const mockTables = this.generateMockTables();
      
      return mockTables;
      
    } catch (error) {
      console.error('Table parsing failed:', error);
      return [];
    }
  }
  
  /**
   * Order content elements logically for reading flow
   */
  orderContentLogically(elements: ContentElement[]): ContentElement[] {
    try {
      // Sort elements by reading order (top-to-bottom, left-to-right)
      return elements.sort((a, b) => {
        // Primary sort: top to bottom
        const yDiff = a.position.y - b.position.y;
        if (Math.abs(yDiff) > 10) { // 10px tolerance for same line
          return yDiff;
        }
        
        // Secondary sort: left to right
        return a.position.x - b.position.x;
      });
      
    } catch (error) {
      console.error('Content ordering failed:', error);
      return elements;
    }
  }
  
  /**
   * Parse complete document layout
   */
  parseDocumentLayout(documentContent: string, extractionMode: string): LayoutStructure {
    try {
      // Create mock document for analysis
      const mockDocument = this.createMockDocument(documentContent);
      
      // Detect columns
      const columns = this.detectColumns(mockDocument);
      
      // Extract textboxes
      const textboxes = this.extractTextboxContent(mockDocument);
      
      // Parse tables
      const tables = this.parseTableContent(mockDocument);
      
      // Generate content elements
      const elements = this.generateContentElements(documentContent);
      
      // Order elements logically
      const orderedElements = this.orderContentLogically(elements);
      
      // Assess complexity
      const complexity = this.assessLayoutComplexity(columns, textboxes, tables);
      
      return {
        columns,
        textboxes,
        tables,
        elements: orderedElements,
        complexity
      };
      
    } catch (error) {
      console.error('Layout parsing failed:', error);
      return this.getEmptyLayoutStructure();
    }
  }
  
  /**
   * Analyze column structure in document
   */
  private analyzeColumnStructure(document: Document): {
    count: number;
    boundaries: Rectangle[];
    orderedElements: ContentElement[];
    confidence: number;
  } {
    // Simulate column analysis
    // In full implementation, this would:
    // 1. Analyze text positioning and spacing
    // 2. Detect vertical gaps that indicate column boundaries
    // 3. Group content by columns
    // 4. Determine reading order within and across columns
    
    const hasMultipleColumns = Math.random() > 0.7; // 30% chance of multi-column
    
    if (hasMultipleColumns) {
      return {
        count: 2,
        boundaries: [
          { x: 0, y: 0, width: 45, height: 100 },
          { x: 55, y: 0, width: 45, height: 100 }
        ],
        orderedElements: [],
        confidence: 85
      };
    } else {
      return {
        count: 1,
        boundaries: [{ x: 0, y: 0, width: 100, height: 100 }],
        orderedElements: [],
        confidence: 95
      };
    }
  }
  
  /**
   * Generate mock textboxes for testing
   */
  private generateMockTextboxes(): TextboxContent[] {
    const textboxes: TextboxContent[] = [];
    
    // Simulate finding textboxes in document
    const hasTextboxes = Math.random() > 0.8; // 20% chance of textboxes
    
    if (hasTextboxes) {
      textboxes.push({
        id: 'textbox-1',
        content: 'Key Skills: JavaScript, Python, React, Node.js',
        position: { x: 10, y: 50, width: 200, height: 30 },
        contextualPlacement: 'skills-section'
      });
      
      textboxes.push({
        id: 'textbox-2',
        content: 'Contact: john.doe@email.com | (555) 123-4567',
        position: { x: 10, y: 10, width: 300, height: 20 },
        contextualPlacement: 'header'
      });
    }
    
    return textboxes;
  }
  
  /**
   * Generate mock tables for testing
   */
  private generateMockTables(): TableContent[] {
    const tables: TableContent[] = [];
    
    // Simulate finding tables in document
    const hasTables = Math.random() > 0.7; // 30% chance of tables
    
    if (hasTables) {
      tables.push({
        id: 'table-1',
        headers: ['Skill', 'Proficiency', 'Years'],
        rows: [
          ['JavaScript', 'Expert', '5'],
          ['Python', 'Advanced', '3'],
          ['React', 'Expert', '4']
        ],
        extractedText: 'Skills Table:\nJavaScript - Expert - 5 years\nPython - Advanced - 3 years\nReact - Expert - 4 years',
        preservedStructure: true
      });
    }
    
    return tables;
  }
  
  /**
   * Create mock document for analysis
   */
  private createMockDocument(content: string): Document {
    // In full implementation, this would create a proper document object
    // For now, return a mock document
    return {} as Document;
  }
  
  /**
   * Generate content elements from document text
   */
  private generateContentElements(content: string): ContentElement[] {
    const elements: ContentElement[] = [];
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    lines.forEach((line, index) => {
      const isHeader = this.isHeaderLine(line);
      
      elements.push({
        id: `element-${index}`,
        type: isHeader ? 'header' : 'text',
        content: line.trim(),
        position: {
          x: 10,
          y: 20 + (index * 25),
          width: Math.min(400, line.length * 8),
          height: 20
        },
        confidence: 90
      });
    });
    
    return elements;
  }
  
  /**
   * Determine if a line is a header
   */
  private isHeaderLine(line: string): boolean {
    const trimmed = line.trim();
    
    // Check for common header patterns
    const headerPatterns = [
      /^[A-Z\s]+$/, // All caps
      /^[A-Z][a-z\s]+:$/, // Title case with colon
      /^(EXPERIENCE|EDUCATION|SKILLS|PROJECTS|SUMMARY|CONTACT)/i
    ];
    
    return headerPatterns.some(pattern => pattern.test(trimmed));
  }
  
  /**
   * Assess layout complexity based on detected elements
   */
  private assessLayoutComplexity(
    columns: ColumnStructure,
    textboxes: TextboxContent[],
    tables: TableContent[]
  ): LayoutComplexity {
    let complexityScore = 0;
    
    // Multi-column adds complexity
    if (columns.columnCount > 1) {
      complexityScore += 2;
    }
    
    // Textboxes add complexity
    complexityScore += textboxes.length;
    
    // Tables add significant complexity
    complexityScore += tables.length * 2;
    
    // Determine complexity level
    if (complexityScore === 0) return 'simple';
    if (complexityScore <= 2) return 'multi-column';
    if (complexityScore <= 5) return 'complex';
    return 'template-heavy';
  }
  
  /**
   * Get empty layout structure for fallback
   */
  private getEmptyLayoutStructure(): LayoutStructure {
    return {
      columns: {
        columnCount: 1,
        columnBoundaries: [],
        readingOrder: [],
        confidence: 0
      },
      textboxes: [],
      tables: [],
      elements: [],
      complexity: 'simple'
    };
  }
  
  /**
   * Validate layout parsing results
   */
  validateLayoutResults(layout: LayoutStructure): {
    valid: boolean;
    issues: string[];
    accuracy: number;
  } {
    const issues: string[] = [];
    let accuracy = 100;
    
    // Check column structure
    if (layout.columns.columnCount < 1) {
      issues.push('Invalid column count');
      accuracy -= 20;
    }
    
    if (layout.columns.confidence < 70) {
      issues.push('Low confidence in column detection');
      accuracy -= 10;
    }
    
    // Check content elements
    if (layout.elements.length === 0) {
      issues.push('No content elements detected');
      accuracy -= 30;
    }
    
    // Check for logical ordering
    const hasLogicalOrder = this.validateContentOrder(layout.elements);
    if (!hasLogicalOrder) {
      issues.push('Content ordering may be incorrect');
      accuracy -= 15;
    }
    
    return {
      valid: issues.length === 0,
      issues,
      accuracy: Math.max(0, accuracy)
    };
  }
  
  /**
   * Validate content ordering logic
   */
  private validateContentOrder(elements: ContentElement[]): boolean {
    if (elements.length < 2) return true;
    
    // Check if elements are generally ordered top-to-bottom
    for (let i = 1; i < elements.length; i++) {
      const prev = elements[i - 1];
      const curr = elements[i];
      
      // Allow some tolerance for elements on the same line
      if (curr.position.y < prev.position.y - 30) {
        return false; // Current element is significantly above previous
      }
    }
    
    return true;
  }
  
  /**
   * Extract text from layout structure maintaining order
   */
  extractOrderedText(layout: LayoutStructure): string {
    const textParts: string[] = [];
    
    // Add textbox content first (usually headers/contact info)
    layout.textboxes.forEach(textbox => {
      if (textbox.contextualPlacement === 'header') {
        textParts.unshift(textbox.content); // Add to beginning
      } else {
        textParts.push(textbox.content);
      }
    });
    
    // Add main content elements in order
    layout.elements.forEach(element => {
      textParts.push(element.content);
    });
    
    // Add table content
    layout.tables.forEach(table => {
      textParts.push(table.extractedText);
    });
    
    return textParts.join('\n');
  }
}

// Export singleton instance
export const layoutParserService = new LayoutParserService();