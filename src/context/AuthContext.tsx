import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseStorage } from '../utils/supabaseStorage';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Add this at the top of your AuthContext.tsx file
let isSigningUp = false;
let signUpTimeout: NodeJS.Timeout | null = null;

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  isAdmin?: boolean;
  provider?: 'email' | 'google';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authTimeout: NodeJS.Timeout;

    // Fast initialization with 3 second timeout
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setInitializing(true);

        // Reduced timeout to 3 seconds for faster startup
        const authPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          authTimeout = setTimeout(() => reject(new Error('Auth initialization timeout')), 2000);
        });

        let session, error;
        try {
          const result = await Promise.race([authPromise, timeoutPromise]) as any;
          session = result.data?.session;
          error = result.error;
        } catch (timeoutError) {
          console.warn('AuthContext: Session fetch timed out, continuing without session');
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitializing(false);
          }
          return;
        }

        if (authTimeout) clearTimeout(authTimeout);

        if (error) {
          console.error('AuthContext: Error getting session:', error);

          // Handle invalid refresh token by clearing session and redirecting to login
          if (error.message && error.message.includes('Refresh Token Not Found')) {
            console.log('Invalid refresh token detected, clearing session and redirecting to login');
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('Error signing out after invalid refresh token:', signOutError);
            }
            window.location.href = '/login';
            return;
          }

          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitializing(false);
          }
          return;
        }

        if (session?.user && mounted) {
          await fetchUserProfile(session.user);
        } else if (mounted) {
          setUser(null);
          setLoading(false);
          setInitializing(false);
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setInitializing(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes with faster response
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.email || 'No user');

      try {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setLoading(false);
          setInitializing(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setLoading(true);
          await fetchUserProfile(session.user);
        } else if (event === 'PASSWORD_RECOVERY') {
          // Handle password recovery
          console.log('Password recovery initiated');
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthContext: Error handling auth state change:', error);

        // Handle invalid refresh token in auth state changes
        if (error.message && error.message.includes('Refresh Token Not Found')) {
          console.log('Invalid refresh token detected in auth state change, clearing session');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error signing out after invalid refresh token:', signOutError);
          }
          window.location.href = '/login';
          return;
        }

        if (mounted) {
          setUser(null);
          setLoading(false);
          setInitializing(false);
        }
      }
    });

    return () => {
      mounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Fetching user profile for:', supabaseUser.email);

      // Create fallback user first to ensure we always have something
      const fallbackProfile: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || 'unknown@example.com',
        name: supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.user_metadata?.display_name ||
          supabaseUser.email?.split('@')[0] ||
          'User',
        avatar_url: supabaseUser.user_metadata?.avatar_url,
        isAdmin: supabaseUser.email === 'admin@primojobs.com' ||
          supabaseUser.email === 'your-admin-email@gmail.com' ||
          supabaseUser.email === 'demo@primojobs.com' ||
          supabaseUser.email === 'primoboostai@gmail.com',
        provider: supabaseUser.app_metadata?.provider || 'email'
      };

      // Try to fetch/create user profile with very short timeout (2 seconds)
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 2000);
      });

      let existingUser;
      let error;

      try {
        const result = await Promise.race([profilePromise, timeoutPromise]) as any;
        existingUser = result.data;
        error = result.error;
      } catch (timeoutError) {
        console.warn('Profile fetch timeout, using fallback profile');
        // Use fallback profile immediately for fast login
        setLoading(false);
        setInitializing(false);
        setUser(fallbackProfile);

        // Try to create user in background without blocking login
        setTimeout(async () => {
          try {
            await supabase
              .from('users')
              .upsert({
                id: supabaseUser.id,
                email: supabaseUser.email!,
                name: fallbackProfile.name,
                created_at: new Date().toISOString()
              });
          } catch (bgError) {
            console.log('Background user creation failed:', bgError);
          }
        }, 100);

        return;
      }

      if (error && error.code === 'PGRST116') {
        // User doesn't exist, create them quickly or use fallback
        console.log('Creating new user profile');

        const userName = supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.user_metadata?.display_name ||
          supabaseUser.email?.split('@')[0] ||
          'User';

        try {
          const insertPromise = supabase
            .from('users')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email!,
              name: userName,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          // 2 second timeout for user creation
          const insertTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Insert timeout')), 2000);
          });

          const { data: newUser, error: insertError } = await Promise.race([
            insertPromise,
            insertTimeoutPromise
          ]) as any;

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            existingUser = fallbackProfile;
          } else {
            existingUser = newUser;
          }
        } catch (insertError) {
          console.error('Insert user timeout or error:', insertError);
          existingUser = fallbackProfile;
        }
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);

        // Handle invalid refresh token in profile fetch
        if (error.message && error.message.includes('Refresh Token Not Found')) {
          console.log('Invalid refresh token detected in profile fetch, clearing session');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error signing out after invalid refresh token:', signOutError);
          }
          window.location.href = '/login';
          return;
        }

        existingUser = fallbackProfile;
      } else if (!existingUser) {
        existingUser = fallbackProfile;
      }

      // Check if user is admin
      const isAdmin = existingUser.email === 'admin@primojobs.com' ||
        existingUser.email === 'your-admin-email@gmail.com' ||
        existingUser.email === 'demo@primojobs.com' ||
        existingUser.email === 'primoboostai@gmail.com';

      const userProfile: User = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name || 'User',
        avatar_url: supabaseUser.user_metadata?.avatar_url,
        isAdmin,
        provider: supabaseUser.app_metadata?.provider || 'email'
      };

      console.log('User profile created:', userProfile.email, 'isAdmin:', isAdmin);
      setUser(userProfile);
      setLoading(false);
      setInitializing(false);
    } catch (error) {
      console.error('AuthContext: Error in fetchUserProfile:', error);

      // Handle invalid refresh token in fetchUserProfile catch block
      if (error.message && error.message.includes('Refresh Token Not Found')) {
        console.log('Invalid refresh token detected in fetchUserProfile catch, clearing session');
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Error signing out after invalid refresh token:', signOutError);
        }
        window.location.href = '/login';
        return;
      }

      // Create fallback user profile to prevent infinite loading
      const fallbackProfile: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || 'unknown@example.com',
        name: supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.user_metadata?.display_name ||
          supabaseUser.email?.split('@')[0] ||
          'User',
        avatar_url: supabaseUser.user_metadata?.avatar_url,
        isAdmin: supabaseUser.email === 'admin@primojobs.com' ||
          supabaseUser.email === 'your-admin-email@gmail.com' ||
          supabaseUser.email === 'demo@primojobs.com' ||
          supabaseUser.email === 'primoboostai@gmail.com',
        provider: supabaseUser.app_metadata?.provider || 'email'
      };

      setUser(fallbackProfile);
      setLoading(false);
      setInitializing(false);
    }
  };
  
  // Then modify your signUp function:
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Prevent multiple rapid submissions
      if (isSigningUp) {
        console.log('Sign up already in progress, preventing duplicate request');
        return { error: { message: 'A sign-up request is already in progress. Please wait.' } };
      }
      
      isSigningUp = true;
      console.log('Starting sign up for:', email);
      
      // Use login page as redirect destination
      const redirectTo = `${window.location.origin}/login`;
      
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName,
          }
        }
      });
  
      // Reduced timeout to 5 seconds for signup
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign up timeout')), 3000);
      });
  
      const { data, error } = await Promise.race([signUpPromise, timeoutPromise]) as any;
  
      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }
  
      console.log('Sign up successful');
      return { error: null };
    } catch (error) {
      console.error('Unexpected signup error:', error);
      if (error.message === 'Sign up timeout') {
        return { error: { message: 'Sign up is taking too long. Please check your internet connection and try again.' } };
      }
      return { error: { message: 'Failed to create account. Please try again.' } };
    } finally {
      // Reset the flag after a cooldown period to prevent rapid retries
      signUpTimeout = setTimeout(() => {
        isSigningUp = false;
        signUpTimeout = null;
      }, 5000); // 5 second cooldown before allowing another attempt
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Starting sign in for:', email);

      const signInPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      // Reduced timeout to 5 seconds for fast login
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign in timeout')), 3000);
      });

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      console.log('Sign in successful');
      return { error: null };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      if (error.message === 'Sign in timeout') {
        return { error: { message: 'Sign in is taking too long. Please check your internet connection and try again.' } };
      }
      return { error: { message: 'Failed to sign in. Please try again.' } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign in');

      const redirectTo = `${window.location.origin}/`;

      const googleSignInPromise = supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo
        }
      });

      // Reduced timeout to 5 seconds for Google signin
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Google sign in timeout')), 3000);
      });

      const { data, error } = await Promise.race([googleSignInPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Google sign in error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected Google sign-in error:', error);
      if (error.message === 'Google sign in timeout') {
        return { error: { message: 'Google sign-in is taking too long. Please try email/password login instead.' } };
      }
      return { error: { message: 'Failed to sign in with Google. Please try email/password login instead.' } };
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out');

      setLoading(true);

      const signOutPromise = supabase.auth.signOut();
      // Quick timeout for signout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timeout')), 2000);
      });

      try {
        await Promise.race([signOutPromise, timeoutPromise]);
        console.log('Sign out successful');
      } catch (error) {
        console.error('Sign out error:', error);
      }

      // Always clear state and redirect quickly
      setUser(null);
      setLoading(false);
      window.location.href = '/login';
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      // Force clear state and redirect
      setUser(null);
      setLoading(false);
      window.location.href = '/login';
    }
  };

  const value: AuthContextType = {
    user,
    loading: loading || initializing,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user && !loading && !initializing,
    isAdmin: !!user?.isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};