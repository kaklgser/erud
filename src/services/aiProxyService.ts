// src/services/aiProxyService.ts
// Unified frontend service for all AI API calls
// Uses local API keys for development, Supabase Edge Function for production

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/ai-proxy`;

// Local API keys (for development)
const LOCAL_EDENAI_KEY = import.meta.env.VITE_EDENAI_API_KEY || '';
const LOCAL_OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const LOCAL_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const LOCAL_GITHUB_TOKEN = import.meta.env.VITE_GITHUB_API_TOKEN || '';

// Use local keys if available (for development)
const USE_LOCAL_KEYS = LOCAL_EDENAI_KEY.length > 10;

console.log('🔧 AI Proxy Mode:', USE_LOCAL_KEYS ? 'LOCAL (using .env keys)' : 'PROXY (using Supabase Edge Function)');

/**
 * Call the AI proxy Edge Function
 */
const callProxy = async (service: string, action: string, params: Record<string, any> = {}) => {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ service, action, ...params }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `Proxy request failed: ${response.status}`);
  }

  return data;
};

// ======================
// FILE HELPERS
// ======================
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
  });
};

// ======================
// EDENAI FUNCTIONS
// ======================
export const edenai = {
  /**
   * OCR - Extract text from PDF/DOCX
   */
  async extractText(file: File): Promise<string> {
    // Use local API key if available (for development)
    if (USE_LOCAL_KEYS) {
      return this.extractTextLocal(file);
    }
    return this.extractTextViaProxy(file);
  },

  /**
   * OCR using local API key (development)
   */
  async extractTextLocal(file: File): Promise<string> {
    console.log('📄 Starting OCR with LOCAL API key...', file.name, file.type);
    
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('providers', 'mistral'); // Cheapest OCR option ($1/1K pages)
    formData.append('language', 'en');

    const response = await fetch('https://api.edenai.run/v2/ocr/ocr_async', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOCAL_EDENAI_KEY}`,
      },
      body: formData,
    });

    const startResult = await response.json();
    console.log('📄 OCR job started:', startResult.public_id ? 'async' : 'sync', startResult);

    if (startResult.public_id) {
      return await this.pollOCRLocal(startResult.public_id);
    }

    return this.extractTextFromResult(startResult);
  },

  /**
   * Poll OCR job using local API key
   */
  async pollOCRLocal(jobId: string, maxAttempts = 30): Promise<string> {
    console.log('📄 Polling OCR job (local):', jobId);
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000));
      
      const response = await fetch(`https://api.edenai.run/v2/ocr/ocr_async/${jobId}`, {
        headers: { Authorization: `Bearer ${LOCAL_EDENAI_KEY}` },
      });
      const result = await response.json();
      console.log(`📄 Poll ${i + 1}/${maxAttempts}: status=${result.status}`);
      
      if (result.status === 'finished') {
        console.log('📄 OCR finished!');
        const dataToExtract = result.results || result;
        return this.extractTextFromResult(dataToExtract);
      }
      if (result.status === 'failed') {
        console.error('📄 OCR failed:', result);
        throw new Error(`OCR failed: ${result.error || 'Unknown error'}`);
      }
    }
    throw new Error('OCR timeout - job did not complete in time');
  },

  /**
   * OCR via Supabase proxy (production)
   */
  async extractTextViaProxy(file: File): Promise<string> {
    console.log('📄 Starting OCR via Supabase proxy...', file.name, file.type);
    
    const fileBase64 = await fileToBase64(file);
    console.log('📄 File converted to base64, length:', fileBase64.length);
    
    // Start OCR job
    const startResult = await callProxy('edenai', 'ocr_async', {
      fileBase64,
      fileName: file.name,
      fileType: file.type,
    });
    
    console.log('📄 OCR job started:', startResult.public_id ? 'async' : 'sync', startResult);

    // Poll for results if async
    if (startResult.public_id) {
      return await this.pollOCR(startResult.public_id);
    }

    return this.extractTextFromResult(startResult);
  },

  async pollOCR(jobId: string, maxAttempts = 30): Promise<string> {
    console.log('📄 Polling OCR job:', jobId);
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const result = await callProxy('edenai', 'ocr_status', { jobId });
      console.log(`📄 Poll ${i + 1}/${maxAttempts}: status=${result.status}`);
      
      if (result.status === 'finished') {
        console.log('📄 OCR finished! Full result:', JSON.stringify(result).slice(0, 1000));
        // Try results first, then the whole result
        const dataToExtract = result.results || result;
        return this.extractTextFromResult(dataToExtract);
      }
      if (result.status === 'failed') {
        console.error('📄 OCR failed:', result);
        throw new Error(`OCR failed: ${result.error || 'Unknown error'}`);
      }
    }
    throw new Error('OCR timeout - job did not complete in time');
  },

  extractTextFromResult(result: any): string {
    console.log('📄 Extracting text from OCR result:', JSON.stringify(result).slice(0, 500));
    
    // Helper to extract text from pages array (handles lines structure)
    const extractFromPages = (pages: any[]): string => {
      return pages.map((page: any) => {
        // If page has lines array (Mistral format)
        if (page.lines && Array.isArray(page.lines)) {
          return page.lines.map((line: any) => line.text || '').join('\n');
        }
        // If page has direct text
        if (page.text) return page.text;
        // If page has content
        if (page.content) return page.content;
        return '';
      }).filter(Boolean).join('\n\n');
    };

    // Check for mistral provider results
    if (result.mistral?.text) {
      console.log('📄 Found mistral.text');
      return result.mistral.text;
    }
    if (result.mistral?.pages) {
      console.log('📄 Found mistral.pages');
      const text = extractFromPages(result.mistral.pages);
      console.log('📄 Extracted text length:', text.length);
      return text;
    }
    
    // Check results wrapper (from async job)
    if (result.results) {
      console.log('📄 Found results wrapper, checking inside...');
      if (result.results.mistral?.text) return result.results.mistral.text;
      if (result.results.mistral?.pages) {
        return extractFromPages(result.results.mistral.pages);
      }
      // Check other providers in results
      for (const key of Object.keys(result.results)) {
        const provider = result.results[key];
        if (provider?.text) return provider.text;
        if (provider?.pages) {
          return extractFromPages(provider.pages);
        }
      }
    }
    
    // Check any provider at top level
    for (const key of Object.keys(result)) {
      if (key === 'status' || key === 'public_id') continue;
      const provider = result[key];
      if (provider?.text) {
        console.log(`📄 Found ${key}.text`);
        return provider.text;
      }
      if (provider?.pages) {
        console.log(`📄 Found ${key}.pages`);
        return extractFromPages(provider.pages);
      }
    }
    
    console.error('📄 No text found in result:', result);
    throw new Error('No text extracted from OCR result');
  },

  /**
   * Chat - AI text generation
   */
  async chat(prompt: string, options: { provider?: string; temperature?: number; maxTokens?: number } = {}) {
    // Use local API key if available
    if (USE_LOCAL_KEYS) {
      return this.chatLocal(prompt, options);
    }
    return this.chatViaProxy(prompt, options);
  },

  /**
   * Chat using local API key (development)
   */
  async chatLocal(prompt: string, options: { provider?: string; temperature?: number; maxTokens?: number } = {}) {
    console.log('💬 Chat with LOCAL API key...');
    
    const response = await fetch('https://api.edenai.run/v2/text/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOCAL_EDENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        providers: options.provider || 'openai/gpt-4o-mini', // Changed from mistral-large to gpt-4o-mini - much cheaper
        text: prompt,
        chatbot_global_action: 'You are an expert assistant.',
        previous_history: [],
        temperature: options.temperature || 0.1,
        max_tokens: options.maxTokens || 4000,
      }),
    });

    const result = await response.json();
    console.log('💬 Chat response:', JSON.stringify(result).slice(0, 500));
    
    const providerKey = Object.keys(result).find(k => result[k]?.generated_text);
    if (providerKey) return result[providerKey].generated_text;
    
    // Log the full response for debugging
    console.error('💬 No generated_text found in response:', JSON.stringify(result, null, 2));
    throw new Error('No response from EdenAI chat');
  },

  /**
   * Chat via Supabase proxy (production)
   */
  async chatViaProxy(prompt: string, options: { provider?: string; temperature?: number; maxTokens?: number } = {}) {
    const result = await callProxy('edenai', 'chat', {
      prompt,
      provider: options.provider || 'openai/gpt-4o-mini', // Changed from mistral-large to gpt-4o-mini - much cheaper
      temperature: options.temperature || 0.1,
      maxTokens: options.maxTokens || 4000,
    });

    const providerKey = Object.keys(result).find(k => result[k]?.generated_text);
    if (providerKey) return result[providerKey].generated_text;
    
    // Log the full response for debugging
    console.error('💬 No generated_text found in proxy response:', JSON.stringify(result, null, 2));
    throw new Error('No response from EdenAI chat');
  },

  /**
   * Summarize text
   */
  async summarize(text: string, outputLength: 'short' | 'medium' | 'long' = 'medium') {
    const result = await callProxy('edenai', 'summarize', { text, outputLength });
    const providerKey = Object.keys(result).find(k => result[k]?.result);
    if (providerKey) return result[providerKey].result;
    throw new Error('No summary generated');
  },

  /**
   * Content moderation
   */
  async moderate(text: string) {
    return callProxy('edenai', 'moderation', { text });
  },

  /**
   * Spell check
   */
  async spellCheck(text: string) {
    return callProxy('edenai', 'spell_check', { text });
  },
};

// ======================
// OPENROUTER FUNCTIONS
// ======================
export const openrouter = {
  /**
   * Chat completion
   */
  async chat(prompt: string, options: { model?: string; temperature?: number; maxTokens?: number } = {}) {
    const result = await callProxy('openrouter', 'chat', {
      prompt,
      model: options.model || 'google/gemini-2.5-flash',
      temperature: options.temperature || 0.3,
      maxTokens: options.maxTokens || 4000,
    });

    return result.choices?.[0]?.message?.content || '';
  },

  /**
   * Chat with system prompt
   */
  async chatWithSystem(systemPrompt: string, userPrompt: string, options: { model?: string; temperature?: number } = {}) {
    const result = await callProxy('openrouter', 'chat_with_system', {
      systemPrompt,
      userPrompt,
      model: options.model || 'google/gemini-2.5-flash',
      temperature: options.temperature || 0.3,
    });

    return result.choices?.[0]?.message?.content || '';
  },
};

// ======================
// GEMINI FUNCTIONS
// ======================
export const gemini = {
  /**
   * Generate content
   */
  async generate(prompt: string, model = 'gemini-pro') {
    const result = await callProxy('gemini', 'generate', { prompt, model });
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },
};

// ======================
// GITHUB FUNCTIONS
// ======================
export const github = {
  async getUser(username: string) {
    return callProxy('github', 'user', { username });
  },

  async getRepo(owner: string, repo: string) {
    return callProxy('github', 'repo', { owner, repo });
  },

  async getCommits(owner: string, repo: string) {
    return callProxy('github', 'commits', { owner, repo });
  },

  async searchRepos(query: string, options: { sort?: string; order?: string; perPage?: number } = {}) {
    return callProxy('github', 'search_repos', {
      query,
      sort: options.sort || 'stars',
      order: options.order || 'desc',
      perPage: options.perPage || 10,
    });
  },
};

// ======================
// DEFAULT EXPORT
// ======================
export const aiProxy = {
  edenai,
  openrouter,
  gemini,
  github,
};

export default aiProxy;
