import { 
  ExtractionMode, 
  ParsingQuality, 
  ProcessingWarning,
  LayoutComplexity,
  DocumentFormat 
} from '../types/resume';

/**
 * Parsing Metrics Service
 * 
 * Tracks and monitors parsing performance, success rates, and quality metrics
 * for continuous improvement of the ATS parsing system.
 */

export interface ParsingMetrics {
  // Success Rates
  overallSuccessRate: number;
  ocrSuccessRate: number;
  layoutParsingAccuracy: number;
  
  // Performance Metrics
  averageProcessingTime: number;
  timeoutRate: number;
  fallbackUsageRate: number;
  
  // Quality Metrics
  averageParsingQuality: number;
  averageConfidence: number;
  
  // Error Tracking
  commonErrors: ErrorFrequency[];
  criticalFailures: number;
  
  // Format-specific metrics
  formatMetrics: Record<DocumentFormat, FormatMetrics>;
  
  // Timestamp
  lastUpdated: string;
  sampleSize: number;
}

export interface ErrorFrequency {
  error: string;
  count: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface FormatMetrics {
  successRate: number;
  averageProcessingTime: number;
  averageQuality: number;
  commonIssues: string[];
  sampleCount: number;
}

export interface ParsingSession {
  sessionId: string;
  fileName: string;
  fileSize: number;
  documentFormat: DocumentFormat;
  extractionMode: ExtractionMode;
  layoutComplexity: LayoutComplexity;
  processingTime: number;
  success: boolean;
  parsingQuality?: ParsingQuality;
  confidence?: number;
  warnings: ProcessingWarning[];
  errors: string[];
  fallbackUsed: boolean;
  timestamp: string;
}

export class ParsingMetricsService {
  
  private readonly STORAGE_KEY = 'parsing_metrics_data';
  private readonly MAX_SESSIONS = 1000; // Keep last 1000 sessions
  private readonly METRICS_VERSION = '1.0';
  
  private sessions: ParsingSession[] = [];
  private currentMetrics: ParsingMetrics | null = null;
  
  constructor() {
    this.loadStoredData();
  }
  
  /**
   * Record a parsing session for metrics tracking
   */
  recordParsingSession(session: Omit<ParsingSession, 'sessionId' | 'timestamp'>): void {
    const fullSession: ParsingSession = {
      ...session,
      sessionId: this.generateSessionId(),
      timestamp: new Date().toISOString()
    };
    
    // Add to sessions array
    this.sessions.push(fullSession);
    
    // Maintain session limit
    if (this.sessions.length > this.MAX_SESSIONS) {
      this.sessions = this.sessions.slice(-this.MAX_SESSIONS);
    }
    
    // Update metrics
    this.updateMetrics();
    
    // Persist to storage
    this.saveToStorage();
    
    console.log('📊 Parsing session recorded:', {
      sessionId: fullSession.sessionId,
      success: fullSession.success,
      processingTime: fullSession.processingTime,
      quality: fullSession.parsingQuality?.overallScore
    });
  }
  
  /**
   * Get current parsing metrics
   */
  getCurrentMetrics(): ParsingMetrics {
    if (!this.currentMetrics) {
      this.updateMetrics();
    }
    return this.currentMetrics!;
  }
  
  /**
   * Get metrics for a specific time period
   */
  getMetricsForPeriod(hours: number = 24): ParsingMetrics {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentSessions = this.sessions.filter(
      session => new Date(session.timestamp) > cutoffTime
    );
    
    return this.calculateMetrics(recentSessions);
  }
  
  /**
   * Get detailed error analysis
   */
  getErrorAnalysis(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByFormat: Record<DocumentFormat, string[]>;
    criticalErrors: string[];
    recommendations: string[];
  } {
    const allErrors = this.sessions.flatMap(session => session.errors);
    const errorsByType: Record<string, number> = {};
    const errorsByFormat: Record<DocumentFormat, string[]> = {} as Record<DocumentFormat, string[]>;
    const criticalErrors: string[] = [];
    
    // Count errors by type
    allErrors.forEach(error => {
      errorsByType[error] = (errorsByType[error] || 0) + 1;
    });
    
    // Group errors by format
    this.sessions.forEach(session => {
      if (session.errors.length > 0) {
        if (!errorsByFormat[session.documentFormat]) {
          errorsByFormat[session.documentFormat] = [];
        }
        errorsByFormat[session.documentFormat].push(...session.errors);
      }
    });
    
    // Identify critical errors (high frequency or severe impact)
    Object.entries(errorsByType).forEach(([error, count]) => {
      if (count > this.sessions.length * 0.1) { // Affects >10% of sessions
        criticalErrors.push(error);
      }
    });
    
    const recommendations = this.generateErrorRecommendations(errorsByType, criticalErrors);
    
    return {
      totalErrors: allErrors.length,
      errorsByType,
      errorsByFormat,
      criticalErrors,
      recommendations
    };
  }
  
  /**
   * Get performance trends
   */
  getPerformanceTrends(days: number = 7): {
    dailyMetrics: Array<{
      date: string;
      successRate: number;
      averageProcessingTime: number;
      averageQuality: number;
      sessionCount: number;
    }>;
    trends: {
      successRateTrend: 'improving' | 'declining' | 'stable';
      processingTimeTrend: 'improving' | 'declining' | 'stable';
      qualityTrend: 'improving' | 'declining' | 'stable';
    };
  } {
    const dailyMetrics = this.calculateDailyMetrics(days);
    const trends = this.analyzeTrends(dailyMetrics);
    
    return { dailyMetrics, trends };
  }
  
  /**
   * Update overall metrics based on current sessions
   */
  private updateMetrics(): void {
    this.currentMetrics = this.calculateMetrics(this.sessions);
  }
  
  /**
   * Calculate metrics from session data
   */
  private calculateMetrics(sessions: ParsingSession[]): ParsingMetrics {
    if (sessions.length === 0) {
      return this.getEmptyMetrics();
    }
    
    const successfulSessions = sessions.filter(s => s.success);
    const ocrSessions = sessions.filter(s => s.extractionMode === 'OCR');
    const successfulOcrSessions = ocrSessions.filter(s => s.success);
    const fallbackSessions = sessions.filter(s => s.fallbackUsed);
    
    // Calculate success rates
    const overallSuccessRate = (successfulSessions.length / sessions.length) * 100;
    const ocrSuccessRate = ocrSessions.length > 0 
      ? (successfulOcrSessions.length / ocrSessions.length) * 100 
      : 0;
    
    // Calculate layout parsing accuracy (based on quality scores)
    const layoutAccuracyScores = successfulSessions
      .map(s => s.parsingQuality?.structurePreservation || 0)
      .filter(score => score > 0);
    const layoutParsingAccuracy = layoutAccuracyScores.length > 0
      ? layoutAccuracyScores.reduce((sum, score) => sum + score, 0) / layoutAccuracyScores.length
      : 0;
    
    // Calculate performance metrics
    const processingTimes = sessions.map(s => s.processingTime);
    const averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    
    const timeoutSessions = sessions.filter(s => s.processingTime > 30000); // 30 seconds
    const timeoutRate = (timeoutSessions.length / sessions.length) * 100;
    
    const fallbackUsageRate = (fallbackSessions.length / sessions.length) * 100;
    
    // Calculate quality metrics
    const qualityScores = successfulSessions
      .map(s => s.parsingQuality?.overallScore || 0)
      .filter(score => score > 0);
    const averageParsingQuality = qualityScores.length > 0
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;
    
    const confidenceScores = successfulSessions
      .map(s => s.confidence || 0)
      .filter(score => score > 0);
    const averageConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : 0;
    
    // Calculate error frequencies
    const commonErrors = this.calculateErrorFrequencies(sessions);
    
    // Count critical failures
    const criticalFailures = sessions.filter(s => 
      !s.success && s.errors.some(error => 
        error.toLowerCase().includes('critical') || 
        error.toLowerCase().includes('timeout') ||
        error.toLowerCase().includes('memory')
      )
    ).length;
    
    // Calculate format-specific metrics
    const formatMetrics = this.calculateFormatMetrics(sessions);
    
    return {
      overallSuccessRate,
      ocrSuccessRate,
      layoutParsingAccuracy,
      averageProcessingTime,
      timeoutRate,
      fallbackUsageRate,
      averageParsingQuality,
      averageConfidence,
      commonErrors,
      criticalFailures,
      formatMetrics,
      lastUpdated: new Date().toISOString(),
      sampleSize: sessions.length
    };
  }
  
  /**
   * Calculate error frequencies
   */
  private calculateErrorFrequencies(sessions: ParsingSession[]): ErrorFrequency[] {
    const errorCounts: Record<string, number> = {};
    const totalSessions = sessions.length;
    
    sessions.forEach(session => {
      session.errors.forEach(error => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
    });
    
    return Object.entries(errorCounts)
      .map(([error, count]) => ({
        error,
        count,
        percentage: (count / totalSessions) * 100,
        severity: this.classifyErrorSeverity(error, count, totalSessions)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 errors
  }
  
  /**
   * Calculate format-specific metrics
   */
  private calculateFormatMetrics(sessions: ParsingSession[]): Record<DocumentFormat, FormatMetrics> {
    const formats: DocumentFormat[] = ['pdf', 'docx', 'doc', 'txt', 'jpg', 'png', 'rtf', 'md', 'unknown'];
    const formatMetrics: Record<DocumentFormat, FormatMetrics> = {} as Record<DocumentFormat, FormatMetrics>;
    
    formats.forEach(format => {
      const formatSessions = sessions.filter(s => s.documentFormat === format);
      
      if (formatSessions.length === 0) {
        formatMetrics[format] = {
          successRate: 0,
          averageProcessingTime: 0,
          averageQuality: 0,
          commonIssues: [],
          sampleCount: 0
        };
        return;
      }
      
      const successfulFormatSessions = formatSessions.filter(s => s.success);
      const successRate = (successfulFormatSessions.length / formatSessions.length) * 100;
      
      const avgProcessingTime = formatSessions.reduce((sum, s) => sum + s.processingTime, 0) / formatSessions.length;
      
      const qualityScores = successfulFormatSessions
        .map(s => s.parsingQuality?.overallScore || 0)
        .filter(score => score > 0);
      const avgQuality = qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : 0;
      
      const allIssues = formatSessions.flatMap(s => s.errors);
      const issueCounts: Record<string, number> = {};
      allIssues.forEach(issue => {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      });
      
      const commonIssues = Object.entries(issueCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([issue]) => issue);
      
      formatMetrics[format] = {
        successRate,
        averageProcessingTime: avgProcessingTime,
        averageQuality: avgQuality,
        commonIssues,
        sampleCount: formatSessions.length
      };
    });
    
    return formatMetrics;
  }
  
  /**
   * Classify error severity
   */
  private classifyErrorSeverity(error: string, count: number, totalSessions: number): 'low' | 'medium' | 'high' | 'critical' {
    const percentage = (count / totalSessions) * 100;
    
    // Critical errors
    if (error.toLowerCase().includes('critical') || 
        error.toLowerCase().includes('timeout') ||
        error.toLowerCase().includes('memory') ||
        percentage > 20) {
      return 'critical';
    }
    
    // High severity
    if (percentage > 10 || 
        error.toLowerCase().includes('failed') ||
        error.toLowerCase().includes('error')) {
      return 'high';
    }
    
    // Medium severity
    if (percentage > 5) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Calculate daily metrics for trend analysis
   */
  private calculateDailyMetrics(days: number): Array<{
    date: string;
    successRate: number;
    averageProcessingTime: number;
    averageQuality: number;
    sessionCount: number;
  }> {
    const dailyMetrics: Array<{
      date: string;
      successRate: number;
      averageProcessingTime: number;
      averageQuality: number;
      sessionCount: number;
    }> = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySessions = this.sessions.filter(session => 
        session.timestamp.startsWith(dateStr)
      );
      
      if (daySessions.length === 0) {
        dailyMetrics.push({
          date: dateStr,
          successRate: 0,
          averageProcessingTime: 0,
          averageQuality: 0,
          sessionCount: 0
        });
        continue;
      }
      
      const successfulSessions = daySessions.filter(s => s.success);
      const successRate = (successfulSessions.length / daySessions.length) * 100;
      
      const avgProcessingTime = daySessions.reduce((sum, s) => sum + s.processingTime, 0) / daySessions.length;
      
      const qualityScores = successfulSessions
        .map(s => s.parsingQuality?.overallScore || 0)
        .filter(score => score > 0);
      const avgQuality = qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : 0;
      
      dailyMetrics.push({
        date: dateStr,
        successRate,
        averageProcessingTime: avgProcessingTime,
        averageQuality: avgQuality,
        sessionCount: daySessions.length
      });
    }
    
    return dailyMetrics;
  }
  
  /**
   * Analyze trends from daily metrics
   */
  private analyzeTrends(dailyMetrics: Array<{
    successRate: number;
    averageProcessingTime: number;
    averageQuality: number;
  }>): {
    successRateTrend: 'improving' | 'declining' | 'stable';
    processingTimeTrend: 'improving' | 'declining' | 'stable';
    qualityTrend: 'improving' | 'declining' | 'stable';
  } {
    if (dailyMetrics.length < 2) {
      return {
        successRateTrend: 'stable',
        processingTimeTrend: 'stable',
        qualityTrend: 'stable'
      };
    }
    
    const calculateTrend = (values: number[]): 'improving' | 'declining' | 'stable' => {
      const validValues = values.filter(v => v > 0);
      if (validValues.length < 2) return 'stable';
      
      const firstHalf = validValues.slice(0, Math.floor(validValues.length / 2));
      const secondHalf = validValues.slice(Math.floor(validValues.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
      
      const change = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      if (change > 5) return 'improving';
      if (change < -5) return 'declining';
      return 'stable';
    };
    
    return {
      successRateTrend: calculateTrend(dailyMetrics.map(m => m.successRate)),
      processingTimeTrend: calculateTrend(dailyMetrics.map(m => -m.averageProcessingTime)), // Negative because lower is better
      qualityTrend: calculateTrend(dailyMetrics.map(m => m.averageQuality))
    };
  }
  
  /**
   * Generate recommendations based on error analysis
   */
  private generateErrorRecommendations(
    errorsByType: Record<string, number>,
    criticalErrors: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (criticalErrors.length > 0) {
      recommendations.push(`Address critical errors: ${criticalErrors.slice(0, 3).join(', ')}`);
    }
    
    // Check for common patterns
    const ocrErrors = Object.keys(errorsByType).filter(error => 
      error.toLowerCase().includes('ocr') || error.toLowerCase().includes('image')
    );
    if (ocrErrors.length > 0) {
      recommendations.push('Improve OCR preprocessing and quality assessment');
    }
    
    const timeoutErrors = Object.keys(errorsByType).filter(error => 
      error.toLowerCase().includes('timeout') || error.toLowerCase().includes('slow')
    );
    if (timeoutErrors.length > 0) {
      recommendations.push('Optimize processing performance and implement better timeout handling');
    }
    
    const formatErrors = Object.keys(errorsByType).filter(error => 
      error.toLowerCase().includes('format') || error.toLowerCase().includes('unsupported')
    );
    if (formatErrors.length > 0) {
      recommendations.push('Expand file format support and improve format detection');
    }
    
    return recommendations;
  }
  
  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): ParsingMetrics {
    return {
      overallSuccessRate: 0,
      ocrSuccessRate: 0,
      layoutParsingAccuracy: 0,
      averageProcessingTime: 0,
      timeoutRate: 0,
      fallbackUsageRate: 0,
      averageParsingQuality: 0,
      averageConfidence: 0,
      commonErrors: [],
      criticalFailures: 0,
      formatMetrics: {} as Record<DocumentFormat, FormatMetrics>,
      lastUpdated: new Date().toISOString(),
      sampleSize: 0
    };
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `parse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Load stored metrics data
   */
  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === this.METRICS_VERSION) {
          this.sessions = data.sessions || [];
          this.currentMetrics = data.metrics || null;
        }
      }
    } catch (error) {
      console.error('Failed to load stored metrics data:', error);
      this.sessions = [];
      this.currentMetrics = null;
    }
  }
  
  /**
   * Save metrics data to storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        version: this.METRICS_VERSION,
        sessions: this.sessions,
        metrics: this.currentMetrics,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save metrics data:', error);
    }
  }
  
  /**
   * Clear all metrics data
   */
  clearMetrics(): void {
    this.sessions = [];
    this.currentMetrics = null;
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('📊 Parsing metrics cleared');
  }
  
  /**
   * Export metrics data for analysis
   */
  exportMetrics(): {
    summary: ParsingMetrics;
    sessions: ParsingSession[];
    exportDate: string;
  } {
    return {
      summary: this.getCurrentMetrics(),
      sessions: this.sessions,
      exportDate: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const parsingMetricsService = new ParsingMetricsService();