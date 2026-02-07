/**
 * Environment Configuration
 * 
 * This file centralizes all environment variables for the application.
 * 
 * HOW IT WORKS:
 * - Local Development: Uses .env.local file (not committed to git)
 * - Production (Cloudflare Pages): Uses Variables & Secrets from dashboard
 * 
 * All VITE_ prefixed variables are automatically available via import.meta.env
 */

// ======================
// SUPABASE
// ======================
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ======================
// RAZORPAY (Frontend - Public Key Only)
// ======================
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// ======================
// CLOUDFLARE WORKER API
// ======================
export const WORKER_API_URL = import.meta.env.VITE_WORKER_API_URL || '';

// ======================
// AI SERVICES (if exposed to frontend)
// ======================
export const EDENAI_API_KEY = import.meta.env.VITE_EDENAI_API_KEY || '';
export const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// ======================
// GITHUB
// ======================
export const GITHUB_API_TOKEN = import.meta.env.VITE_GITHUB_API_TOKEN || '';

// ======================
// EXTERNAL SERVICES
// ======================
export const NETLIFY_API_TOKEN = import.meta.env.VITE_NETLIFY_API_TOKEN || '';
export const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
export const EXTERNAL_BROWSER_SERVICE_URL = import.meta.env.VITE_EXTERNAL_BROWSER_SERVICE_URL || '';
export const EXTERNAL_BROWSER_API_KEY = import.meta.env.VITE_EXTERNAL_BROWSER_API_KEY || '';

// ======================
// BROWSER AUTOMATION
// ======================
export const BROWSER_WS = import.meta.env.BROWSER_WS || '';
export const BROWSER_TIMEOUT = import.meta.env.BROWSER_TIMEOUT || '60000';
export const BROWSER_HEADLESS = import.meta.env.BROWSER_HEADLESS !== 'false';

// ======================
// ENVIRONMENT FLAGS
// ======================
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;
export const MODE = import.meta.env.MODE;

// ======================
// HELPER FUNCTIONS
// ======================

/**
 * Get Supabase Edge Function URL
 */
export const getSupabaseEdgeFunctionUrl = (functionName: string): string => {
  return `${SUPABASE_URL}/functions/v1/${functionName}`;
};

/**
 * Get Worker API endpoint
 */
export const getWorkerEndpoint = (path: string): string => {
  const baseUrl = WORKER_API_URL.replace(/\/$/, ''); // Remove trailing slash
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Check if a required env variable is configured
 */
export const isConfigured = (value: string | undefined): boolean => {
  return !!value && value.length > 0;
};

/**
 * Validate required environment variables
 * Call this on app startup to catch missing config early
 */
export const validateRequiredEnvVars = (): { valid: boolean; missing: string[] } => {
  const required = [
    { name: 'VITE_SUPABASE_URL', value: SUPABASE_URL },
    { name: 'VITE_SUPABASE_ANON_KEY', value: SUPABASE_ANON_KEY },
    { name: 'VITE_RAZORPAY_KEY_ID', value: RAZORPAY_KEY_ID },
    { name: 'VITE_WORKER_API_URL', value: WORKER_API_URL },
  ];

  const missing = required.filter(v => !isConfigured(v.value)).map(v => v.name);

  if (missing.length > 0 && IS_DEVELOPMENT) {
    console.warn('⚠️ Missing environment variables:', missing);
  }

  return { valid: missing.length === 0, missing };
};

// ======================
// DEFAULT EXPORT
// ======================
const env = {
  // Supabase
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  
  // Razorpay
  RAZORPAY_KEY_ID,
  
  // Worker
  WORKER_API_URL,
  
  // AI Services
  EDENAI_API_KEY,
  OPENROUTER_API_KEY,
  DEEPSEEK_API_KEY,
  GEMINI_API_KEY,
  
  // GitHub
  GITHUB_API_TOKEN,
  
  // External Services
  NETLIFY_API_TOKEN,
  RAPIDAPI_KEY,
  EXTERNAL_BROWSER_SERVICE_URL,
  EXTERNAL_BROWSER_API_KEY,
  
  // Browser
  BROWSER_WS,
  BROWSER_TIMEOUT,
  BROWSER_HEADLESS,
  
  // Flags
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  MODE,
  
  // Helpers
  getSupabaseEdgeFunctionUrl,
  getWorkerEndpoint,
  isConfigured,
  validateRequiredEnvVars,
};

export default env;
