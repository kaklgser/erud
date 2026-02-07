import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { ResetPasswordForm } from '../auth/ResetPasswordForm';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const logoImage = 'https://res.cloudinary.com/dlkovvlud/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1751536902/a-modern-logo-design-featuring-primoboos_XhhkS8E_Q5iOwxbAXB4CqQ_HnpCsJn4S1yrhb826jmMDw_nmycqj.jpg';

  useEffect(() => {
    const validateResetLink = async () => {
      console.log('ResetPasswordPage: Full URL:', window.location.href);
      console.log('ResetPasswordPage: Pathname:', location.pathname);
      console.log('ResetPasswordPage: Hash:', location.hash);

      const hash = window.location.hash;
      
      // Parse hash parameters (Supabase uses hash fragments for recovery)
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashType = hashParams.get('type');
      const hashAccessToken = hashParams.get('access_token');

      console.log('ResetPasswordPage: Hash params - type:', hashType, 'access_token:', hashAccessToken ? 'present' : 'missing');

      // Check if this is a recovery link (has the type=recovery parameter in hash)
      if (hashType !== 'recovery' || !hashAccessToken) {
        console.log('ResetPasswordPage: No valid recovery link found in URL hash');
        setValidationError('Invalid or expired password reset link. Please request a new one.');
        setIsValidating(false);
        return;
      }

      console.log('ResetPasswordPage: Recovery link detected, waiting for Supabase to process...');

      // Give Supabase time to process the hash and establish session
      // Try multiple times with delays
      let session = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts && !session) {
        // Wait before each check
        await new Promise(resolve => setTimeout(resolve, attempts === 0 ? 2000 : 1000));
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        console.log(`ResetPasswordPage: Session check attempt ${attempts + 1} - session:`, currentSession ? 'exists' : 'null', 'error:', error);
        
        if (currentSession) {
          session = currentSession;
          break;
        }
        
        attempts++;
      }

      if (session) {
        console.log('ResetPasswordPage: Valid recovery session detected, user can now reset password');
        setValidationError(null);
        setIsValidating(false);
      } else {
        console.log('ResetPasswordPage: No valid session found after multiple attempts');
        setValidationError('Invalid or expired password reset link. Please request a new one.');
        setIsValidating(false);
      }
    };

    validateResetLink();
  }, [location]);

  const handleResetSuccess = () => {
    setResetSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 2500);
  };

  const handleBackToLogin = () => {
    navigate('/');
  };

  const handleRequestNewLink = () => {
    navigate('/', { state: { openAuthModal: true, view: 'forgot-password' } });
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-dark-50 dark:via-dark-100 dark:to-dark-200 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-neon-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Validating your reset link...</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-dark-50 dark:via-dark-100 dark:to-dark-200 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-br from-neon-cyan-500 to-neon-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg dark:shadow-neon-cyan">
              <img src={logoImage} alt="PrimoBoost AI" className="w-12 h-12 rounded-xl object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reset Password</h1>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start dark:bg-red-900/20 dark:border-red-500/50 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm">{validationError}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRequestNewLink}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Request New Reset Link
            </button>
            <button
              onClick={handleBackToLogin}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-dark-200 dark:hover:bg-dark-300 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-dark-50 dark:via-dark-100 dark:to-dark-200 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="bg-green-100 dark:bg-green-900/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Password Reset Successfully!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your password has been updated. You are now logged in and will be redirected shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-dark-50 dark:via-dark-100 dark:to-dark-200 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-200 dark:to-dark-300 px-6 py-8 border-b border-gray-100 dark:border-dark-400">
          <div className="text-center">
            <div className="bg-gradient-to-br from-neon-cyan-500 to-neon-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg dark:shadow-neon-cyan">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reset Your Password</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Enter your new password below
            </p>
          </div>
        </div>

        <div className="p-6">
          <ResetPasswordForm
            onSuccess={handleResetSuccess}
            onBackToLogin={handleBackToLogin}
          />
        </div>
      </div>
    </div>
  );
};
