// src/services/edenModerationService.ts
// EdenAI Moderation & Spell Check Service via Supabase Edge Function proxy

import { edenai } from './aiProxyService';

// Moderation result interface
export interface ModerationResult {
  isSafe: boolean;
  flaggedCategories: string[];
  confidence: number;
  details?: string;
  rawResponse?: any;
}

// Spell check result interface
export interface SpellCheckResult {
  correctedText: string;
  corrections: SpellCorrection[];
  hasCorrections: boolean;
  rawResponse?: any;
}

export interface SpellCorrection {
  original: string;
  corrected: string;
  offset: number;
  length: number;
  type: 'spelling' | 'grammar' | 'style';
}

/**
 * Check text for unsafe/offensive content using EdenAI Moderation via proxy
 */
export const moderateText = async (text: string): Promise<ModerationResult> => {
  if (!text || text.trim().length < 10) {
    return { isSafe: true, flaggedCategories: [], confidence: 1 };
  }

  try {
    const result = await edenai.moderate(text);
    const openaiResult = result?.openai || {};
    
    // Check if content is flagged
    const nsfw = openaiResult?.nsfw_likelihood || 0;
    const categories = openaiResult?.items || [];
    
    const flaggedCategories: string[] = [];
    for (const item of categories) {
      if (item?.likelihood && item.likelihood > 0.5) {
        flaggedCategories.push(item.label || 'unknown');
      }
    }

    const isSafe = nsfw < 0.5 && flaggedCategories.length === 0;

    return {
      isSafe,
      flaggedCategories,
      confidence: 1 - nsfw,
      rawResponse: result,
    };
  } catch (error: any) {
    console.error('EdenAI Moderation error:', error);
    return { isSafe: true, flaggedCategories: [], confidence: 0 };
  }
};

/**
 * Check and correct spelling/grammar using EdenAI Spell Check via proxy
 */
export const spellCheck = async (text: string): Promise<SpellCheckResult> => {
  if (!text || text.trim().length < 10) {
    return { correctedText: text, corrections: [], hasCorrections: false };
  }

  try {
    const result = await edenai.spellCheck(text);
    const openaiResult = result?.openai || {};
    
    // Get corrected text
    let correctedText = openaiResult?.text || text;
    
    // Extract corrections
    const items = openaiResult?.items || [];
    const corrections: SpellCorrection[] = items.map((item: any) => ({
      original: item?.text || '',
      corrected: item?.suggestion || '',
      offset: item?.offset || 0,
      length: item?.length || 0,
      type: item?.type || 'spelling',
    })).filter((c: SpellCorrection) => c.original && c.corrected && c.original !== c.corrected);

    // Preserve numbers and metrics (critical for resumes)
    correctedText = preserveMetrics(text, correctedText);

    return {
      correctedText,
      corrections,
      hasCorrections: corrections.length > 0,
      rawResponse: result,
    };
  } catch (error: any) {
    console.error('EdenAI Spell Check error:', error);
    return { correctedText: text, corrections: [], hasCorrections: false };
  }
};

/**
 * Preserve numeric metrics from original text
 * This ensures numbers like "40%", "$1M", "10,000+" are not changed
 */
const preserveMetrics = (original: string, corrected: string): string => {
  // Extract all metrics from original
  const metricPatterns: RegExp[] = [
    /\d+%/g,                    // Percentages: 40%
    /\$[\d,]+[KMB]?/gi,         // Currency: $1M, $50K
    /[\d,]+\+?/g,               // Numbers: 10,000+
    /\d+x/gi,                   // Multipliers: 2x, 10x
    /\d+\s*(?:years?|months?|weeks?|days?)/gi, // Time: 3 years
  ];

  let result = corrected;
  
  for (const pattern of metricPatterns) {
    const originalMatches: string[] = original.match(pattern) || [];
    const correctedMatches: string[] = result.match(pattern) || [];
    
    // If a metric was changed, try to restore it
    for (const origMetric of originalMatches) {
      if (!correctedMatches.includes(origMetric)) {
        // Find similar position in corrected text and restore
        const origIndex = original.indexOf(origMetric);
        const contextBefore = original.slice(Math.max(0, origIndex - 20), origIndex);
        
        // Look for the context in corrected text
        const contextIndex = result.indexOf(contextBefore);
        if (contextIndex !== -1) {
          // Metric should be near this position
          const searchStart = contextIndex + contextBefore.length;
          const searchEnd = Math.min(result.length, searchStart + 30);
          const searchArea = result.slice(searchStart, searchEnd);
          
          // Replace any modified metric in this area
          for (const corrMetric of correctedMatches) {
            if (searchArea.includes(corrMetric) && corrMetric !== origMetric) {
              result = result.replace(corrMetric, origMetric);
              break;
            }
          }
        }
      }
    }
  }
  
  return result;
};

/**
 * Combined moderation and spell check for resume text
 */
export const processResumeText = async (text: string): Promise<{
  processedText: string;
  moderation: ModerationResult;
  spellCheck: SpellCheckResult;
  isApproved: boolean;
}> => {
  // Run moderation first
  const moderationResult = await moderateText(text);
  
  if (!moderationResult.isSafe) {
    return {
      processedText: text,
      moderation: moderationResult,
      spellCheck: { correctedText: text, corrections: [], hasCorrections: false },
      isApproved: false,
    };
  }
  
  // Run spell check
  const spellCheckResult = await spellCheck(text);
  
  return {
    processedText: spellCheckResult.correctedText,
    moderation: moderationResult,
    spellCheck: spellCheckResult,
    isApproved: true,
  };
};

/**
 * Quick safety check for user input
 */
export const isInputSafe = async (text: string): Promise<boolean> => {
  const result = await moderateText(text);
  return result.isSafe;
};

export const edenModerationService = {
  moderateText,
  spellCheck,
  processResumeText,
  isInputSafe,
};

export default edenModerationService;
