/**
 * EdenAI Text Generation Service
 * Uses Supabase Edge Function proxy for secure API calls
 */

import { edenai } from './aiProxyService';

// Available providers: openai/gpt-4o-mini, google/gemini-1.5-flash, etc.
const DEFAULT_PROVIDER = 'openai/gpt-4o-mini';

console.log('EdenAI Text Service: Using Supabase Edge Function proxy');

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface EdenAITextResponse {
  openai?: {
    generated_text: string;
    message: {
      role: string;
      content: string;
    }[];
  };
  google?: {
    generated_text: string;
  };
  [key: string]: any;
}

/**
 * Generate text using EdenAI via Supabase Edge Function proxy
 */
export const generateText = async (
  prompt: string,
  options: {
    provider?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> => {
  const {
    provider = DEFAULT_PROVIDER,
    temperature = 0.3,
    maxTokens = 4000
  } = options;

  console.log('🤖 EdenAI Text Generation Request (via proxy)');
  console.log('   Provider:', provider);
  console.log('   Prompt length:', prompt.length, 'chars');

  const generatedText = await edenai.chat(prompt, { provider, temperature, maxTokens });
  
  if (!generatedText || generatedText.trim().length === 0) {
    throw new Error('Empty response from AI provider');
  }
  
  console.log('✅ EdenAI Response received');
  console.log('   Response length:', generatedText.length, 'chars');
  
  return generatedText;
};

/**
 * Chat with context using EdenAI via proxy
 */
export const chat = async (
  messages: ChatMessage[],
  options: {
    provider?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> => {
  const {
    provider = DEFAULT_PROVIDER,
    temperature = 0.3,
    maxTokens = 4000
  } = options;

  // Convert messages to a single prompt for the proxy
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const lastMessage = messages[messages.length - 1];
  
  const fullPrompt = systemMessage 
    ? `${systemMessage}\n\n${lastMessage.content}`
    : lastMessage.content;

  return await edenai.chat(fullPrompt, { provider, temperature, maxTokens });
};

/**
 * Generate text with retry logic and provider fallback
 */
export const generateTextWithRetry = async (
  prompt: string,
  options: {
    provider?: string;
    temperature?: number;
    maxTokens?: number;
    maxRetries?: number;
  } = {}
): Promise<string> => {
  const { maxRetries = 3, ...generateOptions } = options;
  let lastError: Error | null = null;
  let delay = 1000;

  // Try with primary provider first (openai/gpt-4o-mini)
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 EdenAI attempt ${attempt}/${maxRetries}...`);
      return await generateText(prompt, generateOptions);
    } catch (error) {
      lastError = error as Error;
      console.warn(`EdenAI attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }

  // Try with Google as fallback if OpenAI fails
  const currentProvider = generateOptions.provider || DEFAULT_PROVIDER;
  if (currentProvider.includes('openai')) {
    console.log('🔄 Trying Google as fallback provider...');
    try {
      return await generateText(prompt, {
        ...generateOptions,
        provider: 'google/gemini-1.5-flash'
      });
    } catch (fallbackError) {
      console.warn('Google fallback also failed:', fallbackError);
    }
  }

  throw lastError || new Error('Failed to generate text after retries');
};

/**
 * Parse JSON from AI response
 */
export const parseJSONResponse = <T>(response: string): T => {
  if (!response || response.trim().length === 0) {
    console.error('❌ Empty response received for JSON parsing');
    throw new Error('Empty response from AI - cannot parse JSON');
  }
  
  // Clean the response
  let cleaned = response
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  
  // Try to extract JSON object or array from the response
  const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    cleaned = jsonMatch[1];
  }
  
  console.log('🔍 Attempting to parse JSON, length:', cleaned.length);
  console.log('   First 200 chars:', cleaned.slice(0, 200));
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('❌ Failed to parse JSON response:', error);
    console.error('   Raw response:', cleaned.slice(0, 500));
    
    // Try to fix common JSON issues
    try {
      // Remove trailing commas before closing brackets
      const fixed = cleaned
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(fixed);
    } catch (fixError) {
      console.error('❌ Failed to fix and parse JSON');
      throw new Error('Invalid JSON response from AI');
    }
  }
};

export const edenAITextService = {
  generateText,
  generateTextWithRetry,
  chat,
  parseJSONResponse
};
