// src/services/authService.ts
import { User, LoginCredentials, SignupCredentials, ForgotPasswordData } from '../types/auth';
import { supabase } from '../lib/supabaseClient';
import { deviceTrackingService } from './deviceTrackingService';
import { paymentService } from './paymentService'; // This line is essential

class AuthService {
  // Add a static variable to track the last time device activity was logged
  private static lastDeviceActivityLog: number = 0;
  private static readonly DEVICE_ACTIVITY_LOG_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  // MODIFIED: Updated isValidGmail to validate any email address
  private isValidEmail(email: string): boolean {
    console.log('DEBUG: isValidEmail received email:', email);
    const trimmedEmail = (email || '').trim();
    console.log('DEBUG: isValidEmail trimmedEmail:', trimmedEmail);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // General email regex
    const isValid = emailRegex.test(trimmedEmail);
    console.log('DEBUG: isValidEmail regex test result:', isValid);
    return isValid;
  }

  private validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters long' };
    if (!/(?=.*[a-z])/.test(password)) return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    if (!/(?=.*[A-Z])/.test(password)) return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    if (!/(?=.*\d)/.test(password)) return { isValid: false, message: 'Password must contain at least one number' };
    if (!/(?=.*[@$!%*?&])/.test(password)) return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
    return { isValid: true };
  }

  async login(credentials: LoginCredentials): Promise<User> {
    console.log('AuthService: Starting login for email:', credentials.email);
    // MODIFIED: Call isValidEmail instead of isValidGmail
    if (!this.isValidEmail(credentials.email)) throw new Error('Please enter a valid email address.');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      console.error('AuthService: Supabase signInWithPassword error:', error);
      throw new Error(error.message);
    }
    if (!data.user) {
      console.error('AuthService: signInWithPassword returned no user data.');
      throw new Error('Login failed. Please try again.');
    }
    console.log('AuthService: User signed in with Supabase. User ID:', data.user.id);

    // Register device and create session for tracking
    try {
      console.log('AuthService: Attempting device registration and session creation...');
      const deviceId = await deviceTrackingService.registerDevice(data.user.id);
      if (deviceId && data.session) {
        await deviceTrackingService.logActivity(data.user.id, 'login', {
          loginMethod: 'email_password',
          success: true
        }, deviceId);
        AuthService.lastDeviceActivityLog = Date.now(); // Update last log time
        console.log('AuthService: Device and session tracking successful.');
      } else {
        console.warn('AuthService: Device ID or session not available for tracking.');
      }
    } catch (deviceError) {
      console.warn('AuthService: Device tracking failed during login:', deviceError);
      // Don't fail login if device tracking fails
    }

    const isAdmin = data.user.email === 'primoboostai@gmail.com';
const profileRole = data.user.user_metadata?.role || (isAdmin ? 'admin' : 'client');

    const userResult: User = {
      id: data.user.id,
      name: data.user.email?.split('@')[0] || 'User',
      email: data.user.email!,
      isVerified: data.user.email_confirmed_at !== null,
      createdAt: data.user.created_at || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    role: profileRole as 'admin' | 'client',

    };
    console.log('AuthService: Login process completed. Returning minimal user data.');
    return userResult;
  }

  async signup(credentials: SignupCredentials): Promise<{ needsVerification: boolean; email: string }> {
    console.log('AuthService: Starting signup for email:', credentials.email);
    if (!credentials.name.trim()) throw new Error('Full name is required');
    if (credentials.name.trim().length < 2) throw new Error('Name must be at least 2 characters long');
    if (!/^[a-zA-Z\s]+$/.test(credentials.name.trim())) throw new Error('Name can only contain letters and spaces');
    if (!credentials.email) throw new Error('Email address is required');
    // MODIFIED: Call isValidEmail instead of isValidGmail
    if (!this.isValidEmail(credentials.email)) throw new Error('Please enter a valid email address.');

    const passwordValidation = this.validatePasswordStrength(credentials.password);
    if (!passwordValidation.isValid) throw new Error(passwordValidation.message!);
    if (credentials.password !== credentials.confirmPassword) throw new Error('Passwords do not match');

    console.log('AuthService: Calling supabase.auth.signUp() for email:', credentials.email);

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      console.error('AuthService: Supabase signUp error:', error);
      throw new Error(error.message);
    }
    if (!data.user) {
      console.error('AuthService: signUp returned no user data.');
      throw new Error('Signup failed. Please try again.');
    }
    console.log('AuthService: User signed up with Supabase. User ID:', data.user.id);

    // Create user profile in user_profiles table
    console.log('AuthService: Creating user profile in user_profiles table...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        full_name: credentials.name,
        email_address: credentials.email,
        role: 'client',
        has_seen_profile_prompt: false,
        resumes_created_count: 0
      });

    if (profileError) {
      console.error('AuthService: Error creating user profile in user_profiles:', profileError);
      // Don't throw - user account is created, profile creation can be retried
    } else {
      console.log('AuthService: User profile created successfully in user_profiles.');
    }

    // Handle referral if present
    if (credentials.referralCode && credentials.referralCode.trim() !== '') {
      try {
        console.log('AuthService: Processing referral code:', credentials.referralCode);
        await paymentService.processReferral(data.user.id, credentials.referralCode);
        console.log('AuthService: Referral processed successfully.');
      } catch (referralError) {
        console.warn('AuthService: Failed to process referral:', referralError);
        // Don't throw - signup is successful even if referral fails
      }
    }

    // Send welcome email
    try {
      console.log('AuthService: Sending welcome email to:', credentials.email);
      const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          userId: data.user.id,
          recipientEmail: credentials.email,
          recipientName: credentials.name
        }
      });

      if (emailError) {
        console.error('AuthService: Welcome email failed:', emailError);
      } else {
        console.log('AuthService: Welcome email sent successfully.');
      }
    } catch (emailError) {
      console.warn('AuthService: Failed to send welcome email:', emailError);
      // Don't throw - signup is successful even if email fails
    }

    console.log('AuthService: Signup process completed.');
    return {
      needsVerification: true,
      email: credentials.email
    };
  }

  public async fetchUserProfile(userId: string): Promise<{
    full_name: string,
    email_address: string,
    phone?: string,
    linkedin_profile_url?: string,
    github_profile_url?: string,
    username?: string,
    referral_code?: string,
    has_seen_profile_prompt?: boolean,
    resumes_created_count?: number,
    role?: 'client' | 'admin',
    resume_headline?: string,
    current_location?: string,
    education_details?: any,
    experience_details?: any,
    skills_details?: any,
    certifications_details?: any,
    projects_details?: any
  } | null> {
    console.log('AuthService: Fetching user profile for user ID:', userId);
    try {
      const { data, error }
        = await supabase
        .from('user_profiles')
        .select('full_name, email_address, phone, linkedin_profile_url, github_profile_url, username, referral_code, has_seen_profile_prompt, resumes_created_count, role, resume_headline, current_location, education_details, experience_details, skills_details, certifications_details, projects_details')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.error('AuthService: Error fetching user profile from DB:', error);
        return null;
      }
      console.log('AuthService: User profile fetched from DB:', data ? data.full_name : 'none');
      return data;
    } catch (error) {
      console.error('AuthService: Error in fetchUserProfile catch block:', error);
      return null;
    }
  }

  // Streamlined getCurrentUser to primarily handle session validity and return full user object
  async getCurrentUser(): Promise<User | null> {
    console.log('AuthService: Starting getCurrentUser (streamlined)...');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('AuthService: getSession error in getCurrentUser:', error);
        return null;
      }

      if (!session?.user) {
        console.log('AuthService: No user in session in getCurrentUser.');
        return null;
      }
      console.log('AuthService: Session found. User ID:', session.user.id);

      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now + 300) { // Refresh if expires in 5 minutes
        console.log('AuthService: Session expiring soon, refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error('AuthService: Session refresh failed:', refreshError);
          if (refreshError?.message === "Invalid Refresh Token: Refresh Token Not Found") {
            console.warn('AuthService: Invalid refresh token detected. Forcing logout.');
            await supabase.auth.signOut();
          }
          return null;
        }
        console.log('AuthService: ✅ Session refreshed successfully in getCurrentUser.');
        session.user = refreshData.session.user; // Update user object from refreshed session
      }

      // Update device activity for current session, but only if interval has passed
      const currentTime = Date.now();
      if (currentTime - AuthService.lastDeviceActivityLog > AuthService.DEVICE_ACTIVITY_LOG_INTERVAL_MS) {
        try {
          console.log('AuthService: Attempting device activity update...');
          const deviceId = await deviceTrackingService.registerDevice(session.user.id);
          if (deviceId) {
            await deviceTrackingService.logActivity(session.user.id, 'session_activity', {
              action: 'session_check',
              timestamp: new Date().toISOString()
            }, deviceId);
            AuthService.lastDeviceActivityLog = currentTime; // Update last log time
            console.log('AuthService: Device activity updated.');
          } else {
            console.warn('AuthService: Device ID not obtained for activity update.');
          }
        } catch (deviceError) {
          console.warn('AuthService: Device activity update failed during session check:', deviceError);
        }
      } else {
        console.log('AuthService: Skipping device activity update (interval not passed).');
      }

      // Fetch the full profile using the new public method
      const profile = await this.fetchUserProfile(session.user.id);
      console.log('AuthService: User profile fetched for getCurrentUser. Profile:', profile ? profile.full_name : 'none');

      const isAdmin = session.user.email === 'primoboostai@gmail.com';
const profileRole = profile?.role || (isAdmin ? 'admin' : 'client');

      const userResult: User = {
        id: session.user.id,
        name: profile?.full_name || session.user.email?.split('@')[0] || 'User',
        email: profile?.email_address || session.user.email!,
        phone: profile?.phone || undefined,
        linkedin: profile?.linkedin_profile_url || undefined,
        github: profile?.github_profile_url || undefined,
        referralCode: profile?.referral_code || undefined,
        username: profile?.username || undefined,
        isVerified: session.user.email_confirmed_at !== null,
        createdAt: session.user.created_at || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        hasSeenProfilePrompt: profile?.has_seen_profile_prompt || false,
        resumesCreatedCount: profile?.resumes_created_count || 0,
        role: profileRole as 'admin' | 'client',
        resumeHeadline: profile?.resume_headline || undefined,
        currentLocation: profile?.current_location || undefined,
        educationDetails: profile?.education_details || undefined,
        experienceDetails: profile?.experience_details || undefined,
        skillsDetails: profile?.skills_details || undefined,
        certificationsDetails: profile?.certifications_details || undefined,
        projectsDetails: profile?.projects_details || undefined
      };
      console.log('AuthService: getCurrentUser completed. Returning user data.');
      return userResult;
    } catch (error) {
      console.error('AuthService: Error in getCurrentUser:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    console.log('AuthService: Starting logout process...');
    // Capture session info BEFORE signing out
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    const accessToken = session?.access_token;

    console.log('AuthService: Calling supabase.auth.signOut() first for immediate UI feedback.');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('AuthService: supabase.auth.signOut() failed:', error);
      throw new Error('Failed to sign out. Please try again.');
    }

    console.log('AuthService: supabase.auth.signOut() completed. Now handling device tracking.');
    try {
      if (userId && accessToken) {
        console.log('AuthService: Previous session info captured, attempting to log logout activity.');
        const deviceId = await deviceTrackingService.registerDevice(userId); // Use captured userId
        if (deviceId) {
          await deviceTrackingService.logActivity(userId, 'logout', { // Use captured userId
            logoutMethod: 'manual',
            timestamp: new Date().toISOString()
          }, deviceId);
          console.log('AuthService: Logout activity logged. Ending session via device tracking service.');
          await deviceTrackingService.endSession(accessToken, 'logout'); // Use captured accessToken
        } else {
          console.warn('AuthService: Device ID not obtained, skipping device tracking session end.');
        }
      } else {
        console.log('AuthService: No active session info to log for device tracking after sign out.');
      }
    } catch (deviceError) {
      console.warn('AuthService: Failed to log logout activity or end session via device tracking:', deviceError);
    }
    console.log('AuthService: Logout process finished.');
  }

async forgotPassword(email: string): Promise<void> {
  console.log('AuthService: Starting forgotPassword for email:', email);

  if (!this.isValidEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }

  // Check rate limit before sending reset email
  try {
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc(
      'check_password_reset_rate_limit',
      { p_email: email }
    );

    if (rateLimitError) {
      console.error('AuthService: Rate limit check error:', rateLimitError);
      // Continue even if rate limit check fails
    } else if (rateLimitCheck && !rateLimitCheck.allowed) {
      const minutes = Math.ceil(rateLimitCheck.retry_after_seconds / 60);
      throw new Error(
        `Too many password reset attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
  }

  // Get the current origin for redirect URL
 const redirectUrl = `${window.location.origin}/reset-password`;

  console.log('AuthService: Password reset redirect URL:', redirectUrl);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  // Log the attempt
  try {
    await supabase.rpc('log_password_reset_attempt', {
      p_email: email,
      p_ip_address: null, // Could be captured from client if needed
      p_user_agent: navigator.userAgent,
      p_success: error === null
    });
  } catch (logError) {
    console.warn('AuthService: Failed to log password reset attempt:', logError);
  }

  if (error) {
    console.error('AuthService: resetPasswordForEmail error:', error);
    throw new Error(error.message);
  }

  console.log('AuthService: Password reset email sent successfully.');
}

  async resetPassword(newPassword: string): Promise<{ user: User | null; autoLoginSuccess: boolean }> {
    console.log('AuthService: Starting resetPassword...');
    
    // Validate access token from URL first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('AuthService: No valid session found for password reset:', sessionError);
      throw new Error('Invalid or expired reset link. Please request a new password reset.');
    }

    const passwordValidation = this.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) throw new Error(passwordValidation.message!);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error('AuthService: updateUser error during password reset:', error);
      throw new Error(error.message);
    }

    console.log('AuthService: Password reset successful.');
    
    // User is already authenticated after password reset, fetch their profile
    const user = await this.getCurrentUser();
    
    return {
      user,
      autoLoginSuccess: !!user
    };
  }

  async verifyEmail(token: string): Promise<void> {
    console.log('AuthService: Verifying email with token');
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    });
    if (error) {
      console.error('AuthService: Email verification error:', error);
      throw new Error(error.message);
    }
    console.log('AuthService: Email verified successfully');
  }

  async refreshUserProfile(userId: string): Promise<User | null> {
    console.log('AuthService: Refreshing user profile for user ID:', userId);
    const profile = await this.fetchUserProfile(userId);
    if (!profile) {
      console.warn('AuthService: Could not fetch profile for refreshUserProfile.');
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.warn('AuthService: No session found during refreshUserProfile.');
      return null;
    }

    const isAdmin = session.user.email === 'primoboostai@gmail.com';
const profileRole = profile?.role || (isAdmin ? 'admin' : 'client');

    const userResult: User = {
      id: session.user.id,
      name: profile.full_name || session.user.email?.split('@')[0] || 'User',
      email: profile.email_address || session.user.email!,
      phone: profile.phone || undefined,
      linkedin: profile.linkedin_profile_url || undefined,
      github: profile.github_profile_url || undefined,
      referralCode: profile.referral_code || undefined,
      username: profile.username || undefined,
      isVerified: session.user.email_confirmed_at !== null,
      createdAt: session.user.created_at || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      hasSeenProfilePrompt: profile.has_seen_profile_prompt || false,
      resumesCreatedCount: profile.resumes_created_count || 0,
      role: profileRole as 'admin' | 'client',
      resumeHeadline: profile.resume_headline || undefined,
      currentLocation: profile.current_location || undefined,
      educationDetails: profile.education_details || undefined,
      experienceDetails: profile.experience_details || undefined,
      skillsDetails: profile.skills_details || undefined,
      certificationsDetails: profile.certifications_details || undefined,
      projectsDetails: profile.projects_details || undefined
    };

    console.log('AuthService: refreshUserProfile completed.');
    return userResult;
  }

  async updateUserProfile(userId: string, updates: {
    full_name?: string;
    email_address?: string;
    phone?: string;
    linkedin_profile?: string;
    github_profile?: string;
    has_seen_profile_prompt?: boolean;
    resume_headline?: string;
    current_location?: string;
    education_details?: any;
    experience_details?: any;
    skills_details?: any;
    projects_details?: any;
    certifications_details?: any;
  }): Promise<void> {
    console.log('AuthService: Starting updateUserProfile for user ID:', userId, 'updates:', updates);
    try {
      const dbUpdates: { [key: string]: any } = {
  full_name: updates.full_name,
  email_address: updates.email_address,
  phone: updates.phone,
  linkedin_profile_url: updates.linkedin_profile, // FIXED: Correct column name
  github_profile_url: updates.github_profile, // FIXED: Correct column name (was wellfound_profile)
  has_seen_profile_prompt: updates.has_seen_profile_prompt,
  resume_headline: updates.resume_headline,
  current_location: updates.current_location,
  education_details: updates.education_details,
  experience_details: updates.experience_details,
  skills_details: updates.skills_details,
  projects_details: updates.projects_details,
  certifications_details: updates.certifications_details,
  profile_updated_at: new Date().toISOString(),
};

Object.keys(dbUpdates).forEach((key) => {
  if (dbUpdates[key] === undefined) {
    delete dbUpdates[key];
  }
});

      const { error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('id', userId);

      if (error) {
        console.error('AuthService: Error updating user profile in DB:', error);
        throw new Error('Failed to update profile');
      }
      console.log('AuthService: User profile updated successfully in DB.');
    } catch (error) {
      console.error('AuthService: Error in updateUserProfile catch block:', error);
      throw error;
    }
  }

  async markProfilePromptSeen(userId: string): Promise<void> {
    console.log('AuthService: Marking profile prompt as seen for user ID:', userId);
    try {
       await this.updateUserProfile(userId, {
        has_seen_profile_prompt: true
      });
      console.log('AuthService: Profile prompt marked as seen successfully.');
    } catch (error) {
      console.error('AuthService: Error marking profile prompt as seen:', error);
      throw new Error('Failed to update profile prompt status');
    }
  }

  async ensureValidSession(): Promise<boolean> {
    console.log('AuthService: Starting ensureValidSession...');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('AuthService: getSession result - session:', session ? 'exists' : 'null', 'error:', error);

      if (error) {
        console.error('AuthService: Session check failed in ensureValidSession:', error);
        console.log('AuthService: Returning false due to getSession error.');
        return false;
      }

      if (!session?.user) {
        console.log('AuthService: No session found in ensureValidSession.');
        return false;
      }

      console.log('AuthService: Session exists. Checking expiration...');
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now + 300) {
        console.log('AuthService: Session expiring soon, attempting refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error('AuthService: Session refresh failed in ensureValidSession:', refreshError);
          console.log('AuthService: Returning false due to session refresh error.');
          if (refreshError?.message === "Invalid Refresh Token: Refresh Token Not Found") {
            console.warn('AuthService: Invalid refresh token detected. Forcing logout.');
            await supabase.auth.signOut();
          }
          return false;
        }
        console.log('AuthService: ✅ Session refreshed successfully in ensureValidSession.');
      } else {
        console.log('AuthService: Session is valid and not expiring soon.');
      }

      console.log('AuthService: ensureValidSession completed. Returning true.');
      return true;
    } catch (error) {
      console.error('AuthService: Error in ensureValidSession:', error);
      console.log('AuthService: Returning false due to catch block error.');
      return false;
    }
  }

  // Return total resumes created (app-wide)
  async getGlobalResumesCreatedCount(): Promise<number> {
    console.log('AuthService: Fetching global resumes created count...');
    try {
      const { data, error } = await supabase
        .from('app_metrics')
        .select('metric_value')
        .eq('metric_name', 'total_resumes_created')
        .single();
      
      if (error) {
        console.error('AuthService: Error fetching global resumes count:', error);
        return 50000; // Return default if fetch fails
      }
      
      console.log('AuthService: Global resumes count fetched successfully:', data.metric_value);
      return data.metric_value;
    } catch (error) {
      console.error('AuthService: Error in getGlobalResumesCreatedCount catch block:', error);
      return 50000; // Return default if fetch fails
    }
  }

  // Increment current user's resume count (user_profiles.resumes_created_count)
  async incrementResumesCreatedCount(userId: string): Promise<number> {
    try {
      const profile = await this.fetchUserProfile(userId);
      const current = profile?.resumes_created_count ?? 0;
      const next = current + 1;

      const { error } = await supabase
        .from('user_profiles')
        .update({ resumes_created_count: next })
        .eq('id', userId);

      if (error) {
        console.error('AuthService: Failed to update resumes_created_count:', error);
        throw new Error(error.message);
      }

      console.log('AuthService: resumes_created_count incremented to', next);
      return next;
    } catch (err) {
      console.error('AuthService: Error incrementing user resumes count:', err);
      throw err;
    }
  }

  // Increment global metric total_resumes_created in app_metrics
  async incrementGlobalResumesCreatedCount(): Promise<number> {
    try {
      console.log('AuthService: Incrementing global resumes created count via RPC...');
      const { data, error } = await supabase.rpc('increment_total_resumes_created');

      if (error) {
        console.error('AuthService: Failed to increment total_resumes_created via RPC:', error);
        throw new Error(error.message);
      }

      const newCount = typeof data === 'number' ? data : Number(data ?? 0);
      console.log('AuthService: total_resumes_created incremented to', newCount);
      return newCount;
    } catch (err) {
      console.error('AuthService: Error incrementing global resumes count:', err);
      throw err;
    }
  }

}

export const authService = new AuthService();
