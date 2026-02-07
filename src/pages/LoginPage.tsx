import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import logoImage from '../assets/wihout-gb-logo.png';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { signIn, signInWithGoogle, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for resend confirmation
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  // Handle URL parameters and email confirmation
  // Handle messages from signup page
  useEffect(() => {
    const state = location.state as any;
    const urlParams = new URLSearchParams(location.search);
    
    // Check if user came from email confirmation
    if (urlParams.get('type') === 'signup' || urlParams.get('confirmation') === 'success') {
      setSuccess('✅ Email confirmed successfully!\n\n🎉 Your account is now verified\n🔑 You can now sign in with your credentials\n\nWelcome to Primo JobsCracker!');
    }
    
    // Handle Supabase auth callback
    if (urlParams.get('type') === 'signup' && urlParams.get('token_hash')) {
      setSuccess('✅ Email verification complete!\n\n🎉 Your account has been successfully verified\n🔑 Please sign in below to access your account\n\nThank you for joining Primo JobsCracker!');
      // Clear URL parameters to clean up the address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (state?.message) {
      setSuccess(state.message);
      if (state.email) {
        setEmail(state.email);
      }
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
    
    // Handle Supabase session after email confirmation
    const handleAuthStateChange = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && urlParams.get('type') === 'signup') {
        // User is already signed in after email confirmation
        setSuccess('✅ Email confirmed and signed in!\n\n🎉 Welcome to Primo JobsCracker!\n🚀 Redirecting to your dashboard...');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      }
    };
    
    handleAuthStateChange();
  }, [location.state]);

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User authenticated, redirecting...');
      // Use setTimeout to ensure state is fully updated
      const redirectTimer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, user, navigate]);

  // Auto-clear messages after some time
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 15000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateForm = () => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      setError('Email is required');
      return false;
    }
    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Login form submitted');
    
    // Clear previous messages
    setError('');
    setSuccess('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Add strict 4-second timeout for login
      const loginTimeout = setTimeout(() => {
        setLoading(false);
        setError('Login is taking too long. Please check your internet connection and try again.');
      }, 4000);
      
      // Add timeout to prevent infinite loading
      // Reduced timeout to 5 seconds for fast login experience
      const loginTimeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError('Login is taking too long. Please check your internet connection and try again.');
        }
      }, 5000);

      const { error: signInError } = await signIn(email.trim(), password);
      
      clearTimeout(loginTimeout);
      clearTimeout(loginTimeoutId);
      
      if (signInError) {
        console.error('Sign in failed:', signInError);
        
        // Handle specific error types
        let errorMessage = 'An error occurred during sign in. Please try again.';
        
        if (signInError.message?.includes('Invalid login credentials')) {
          errorMessage = '❌ Invalid email or password\n\n• Double-check your email address\n• Verify your password is correct\n• Make sure your account is activated\n\nIf you forgot your password, please contact support or create a new account.';
        } else if (signInError.message?.includes('Email not confirmed')) {
          errorMessage = '📧 Email not confirmed\n\n• Check your email inbox for confirmation link\n• Look in spam/junk folder\n• Click the verification link\n• Try signing in again\n\nNeed help? Contact support for assistance.';
          setShowResendConfirmation(true);
          setResendEmail(email.trim());
        } else if (signInError.message?.includes('Too many requests')) {
          errorMessage = '⏰ Too many login attempts\n\n• Please wait 5-10 minutes\n• Clear your browser cache\n• Try again with correct credentials\n\nThis is a security measure to protect your account.';
        } else if (signInError.message?.includes('Network') || signInError.message?.includes('timeout')) {
          errorMessage = '🌐 Connection problem\n\n• Check your internet connection\n• Try refreshing the page\n• Disable VPN if using one\n• Try again in a few moments\n\nIf problem persists, contact support.';
        } else if (signInError.message?.includes('User not found')) {
          errorMessage = '👤 Account not found\n\n• This email is not registered\n• Check if you typed the email correctly\n• Create a new account if needed\n\nNeed an account? Sign up now!';
        } else if (signInError.message) {
          errorMessage = signInError.message;
        }
        
        setError(errorMessage);
        setLoading(false);
      } else {
        console.log('Sign in successful');
        setSuccess('Sign in successful! Redirecting...');
        // Keep loading state until redirect happens
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Add strict 4-second timeout for Google login
      const googleTimeout = setTimeout(() => {
        setLoading(false);
        setError('Google sign-in is taking too long. Please try email/password login instead.');
      }, 4000);
      
      console.log('Attempting Google sign in');
      
      // Add timeout for Google sign in
      // Reduced timeout to 5 seconds for Google signin
      const googleTimeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError('Google sign-in is taking too long. Please try email/password sign-in below.');
        }
      }, 5000);
      
      const { error: googleError } = await signInWithGoogle();
      
      clearTimeout(googleTimeout);
      clearTimeout(googleTimeoutId);
      
      if (googleError) {
        console.error('Google sign-in error:', googleError);
        
        let errorMessage = 'Google sign-in failed. Please try email/password sign-in below.';
        
        if (googleError.message?.includes('Google OAuth configuration error') || 
            googleError.message?.includes('origin')) {
          errorMessage = 'Google sign-in is temporarily unavailable due to configuration issues.\n\nPlease use email/password sign-in below or try again later.';
        } else if (googleError.message?.includes('popup')) {
          errorMessage = 'Google sign-in popup was blocked or closed.\n\nPlease allow popups for this site and try again.';
        } else if (googleError.message?.includes('timed out') || googleError.message?.includes('timeout')) {
          errorMessage = 'Google sign-in timed out.\n\nPlease check your internet connection and try again.';
        } else if (googleError.message) {
          errorMessage = googleError.message;
        }
        
        setError(errorMessage);
        setLoading(false);
      } else {
        setSuccess('Google sign-in successful! Redirecting...');
        // Keep loading state until redirect happens
      }
    } catch (err) {
      console.error('Unexpected error during Google sign-in:', err);
      setError('An unexpected error occurred with Google sign-in. Please try email/password sign-in below.');
      setLoading(false);
    }
  };

  // Demo account helper
  const fillDemoCredentials = () => {
    setEmail('demo@primojobs.com');
    setPassword('demo123');
    setError('');
    setSuccess('');
    setShowResendConfirmation(false);
  };

  // Handle resend confirmation email
  const handleResendConfirmation = async () => {
    if (!resendEmail) {
      setError('Please enter your email address');
      return;
    }

    setResendLoading(true);
    setError('');
    setResendSuccess('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        console.error('Resend confirmation error:', error);
        setError(`Failed to resend confirmation email: ${error.message}`);
      } else {
        setResendSuccess('✅ Confirmation email sent!\n\n📧 Check your inbox and spam folder\n🔗 Click the link to verify your account\n🔑 Return here to sign in');
        setShowResendConfirmation(false);
      }
    } catch (err) {
      console.error('Unexpected resend error:', err);
      setError('Failed to resend confirmation email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img 
              src={logoImage} 
              alt="Primo JobsCracker Logo" 
              className="h-24 w-auto max-w-none"
              onError={(e) => {
                // Fallback to text if image fails to load
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg';
                fallback.textContent = 'PJ';
                e.currentTarget.parentNode!.appendChild(fallback);
              }}
            />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your Primo JobsCracker account
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-red-700 text-sm whitespace-pre-line">{error}</div>
                </div>
                {error.includes('Email not confirmed') && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-blue-800 font-medium text-sm">Email Confirmation Steps:</p>
                    <div className="text-blue-700 text-sm mt-1 space-y-1">
                      <p>• Check your email inbox for a confirmation email</p>
                      <p>• Look in your spam/junk folder if needed</p>
                      <p>• Click the verification link in the email</p>
                      <p>• Return here and try signing in again</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-blue-800 font-medium text-sm mb-2">Didn't receive the email?</p>
                      <button
                        type="button"
                        onClick={() => setShowResendConfirmation(true)}
                        className="text-blue-600 hover:text-blue-700 underline text-sm font-medium"
                      >
                        Resend confirmation email
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <div className="text-green-700 text-sm">{success}</div>
                </div>
              </div>
            )}
            
            {/* Resend Confirmation Modal */}
            {showResendConfirmation && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-yellow-800 font-medium text-sm mb-3">Resend Confirmation Email</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-yellow-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                      placeholder="Enter your email"
                      disabled={resendLoading}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resendLoading || !resendEmail.trim()}
                      className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {resendLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                          Sending...
                        </>
                      ) : (
                        'Resend Email'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResendConfirmation(false);
                        setResendEmail('');
                        setResendSuccess('');
                      }}
                      disabled={resendLoading}
                      className="px-3 py-2 text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <div className="text-green-700 text-sm">{resendSuccess}</div>
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(''); // Clear error when user types
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(''); // Clear error when user types
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 transition-colors"
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;