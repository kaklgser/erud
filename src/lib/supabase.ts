import { createClient } from '@supabase/supabase-js';

// Fallback values for when ENV variables aren't loaded (deployment issue)
const FALLBACK_SUPABASE_URL = 'https://rixmudvtbfkjpwjoefon.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeG11ZHZ0YmZranB3am9lZm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1ODk4NzIsImV4cCI6MjA2NjE2NTg3Mn0.PQss75_gbLaiJDFxKvCuHNirUVkKUGrINYGO1oewQGA';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

console.log("SUPABASE ENV:", {
  url: import.meta.env.VITE_SUPABASE_URL ? 'FROM ENV' : 'USING FALLBACK',
  key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'FROM ENV' : 'USING FALLBACK'
});

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
    return window.localStorage;
  }

  console.warn('localStorage not available, using in-memory storage fallback');
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
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'primojobs-web'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Add connection health check
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection healthy');
    return true;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          created_at?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          description: string;
          category: string;
          date: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          description: string;
          category: string;
          date?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          description?: string;
          category?: string;
          date?: string;
          created_at?: string | null;
        };
      };
      questions: {
        Row: {
          id: string;
          company: string;
          role: string;
          category: string;
          difficulty: string;
          question_text: string;
          solution_text: string;
          code_example: string | null;
          explanation: string;
          tags: string[];
          image_url: string | null;
          price: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company: string;
          role: string;
          category: string;
          difficulty: string;
          question_text: string;
          solution_text: string;
          code_example?: string | null;
          explanation: string;
          tags?: string[];
          image_url?: string | null;
          price?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company?: string;
          role?: string;
          category?: string;
          difficulty?: string;
          question_text?: string;
          solution_text?: string;
          code_example?: string | null;
          explanation?: string;
          tags?: string[];
          image_url?: string | null;
          price?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      access_logs: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          access_start_time: string;
          access_expiry_time: string;
          payment_status: boolean;
          payment_id: string | null;
          amount_paid: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          access_start_time: string;
          access_expiry_time: string;
          payment_status?: boolean;
          payment_id?: string | null;
          amount_paid: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          access_start_time?: string;
          access_expiry_time?: string;
          payment_status?: boolean;
          payment_id?: string | null;
          amount_paid?: number;
          created_at?: string | null;
        };
      };
      materials: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          company: string | null;
          role: string | null;
          content: string;
          image_url: string;
          uploaded_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          company?: string | null;
          role?: string | null;
          content: string;
          image_url: string;
          uploaded_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          company?: string | null;
          role?: string | null;
          content?: string;
          image_url?: string;
          uploaded_at?: string | null;
        };
      };
      payment_settings: {
        Row: {
          id: string;
          base_price: number;
          currency: string;
          active_coupons: any;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          base_price?: number;
          currency?: string;
          active_coupons?: any;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          base_price?: number;
          currency?: string;
          active_coupons?: any;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
}