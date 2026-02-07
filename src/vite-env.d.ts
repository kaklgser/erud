/// <reference types="vite/client" />

/**
 * Type definitions for environment variables
 * These match the Cloudflare Pages Variables & Secrets
 */
interface ImportMetaEnv {
  // Supabase
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  
  // Razorpay (public key only)
  readonly VITE_RAZORPAY_KEY_ID: string;
  
  // Cloudflare Worker
  readonly VITE_WORKER_API_URL: string;
  
  // AI Services
  readonly VITE_EDENAI_API_KEY?: string;
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_DEEPSEEK_API_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  
  // GitHub
  readonly VITE_GITHUB_API_TOKEN?: string;
  
  // External Services
  readonly VITE_NETLIFY_API_TOKEN?: string;
  readonly VITE_RAPIDAPI_KEY?: string;
  readonly VITE_EXTERNAL_BROWSER_SERVICE_URL?: string;
  readonly VITE_EXTERNAL_BROWSER_API_KEY?: string;
  
  // Browser Automation
  readonly BROWSER_WS?: string;
  readonly BROWSER_TIMEOUT?: string;
  readonly BROWSER_HEADLESS?: string;
  
  // Vite built-ins
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
