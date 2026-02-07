// src/lib/supabaseClient.ts
console.log('DEBUG: Entering supabaseClient.ts');
import { createClient } from '@supabase/supabase-js';

// Fallback values for when ENV variables aren't loaded (deployment issue)
const FALLBACK_SUPABASE_URL = 'https://rixmudvtbfkjpwjoefon.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeG11ZHZ0YmZranB3am9lZm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1ODk4NzIsImV4cCI6MjA2NjE2NTg3Mn0.PQss75_gbLaiJDFxKvCuHNirUVkKUGrINYGO1oewQGA';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

// Log whether we're using ENV or fallback
console.log('SupabaseClient: Attempting to initialize client.');
console.log('SupabaseClient: VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'FROM ENV' : 'USING FALLBACK');
console.log('SupabaseClient: VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'FROM ENV' : 'USING FALLBACK');

// Custom storage adapter to handle iframe/sandboxed environments where localStorage is blocked
const createSafeStorage = () => {
  // In-memory fallback storage
  const memoryStorage: Record<string, string> = {};
  
  const isLocalStorageAvailable = () => {
    try {
      const testKey = '__supabase_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  };

  if (isLocalStorageAvailable()) {
    console.log('SupabaseClient: localStorage is available');
    return window.localStorage;
  }

  console.warn('SupabaseClient: localStorage not available, using in-memory storage fallback');
  return {
    getItem: (key: string) => memoryStorage[key] ?? null,
    setItem: (key: string, value: string) => { memoryStorage[key] = value; },
    removeItem: (key: string) => { delete memoryStorage[key]; },
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createSafeStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('SupabaseClient: Supabase client initialized successfully.');

// Database types for better TypeScript support - Updated for new table structure
interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          email_address: string;
          is_active: boolean;
          profile_created_at: string;
          profile_updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email_address: string;
          is_active?: boolean;
          profile_created_at?: string;
          profile_updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email_address?: string;
          is_active?: boolean;
          profile_created_at?: string;
          profile_updated_at?: string;
        };
      };
    };
  };
}
