// src/components/auth/AuthModal.tsx
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Sparkles } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

type AuthView = 'login' | 'signup' | 'forgot-password' | 'success' | 'postSignupPrompt';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
  onProfileFillRequest?: (mode?: 'profile' | 'wallet') => void;
  onPromptDismissed?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = 'login',
  onProfileFillRequest = () => {},
  onPromptDismissed = () => {}
}) => {
  const { user, isAuthenticated } = useAuth();
  const { isChristmasMode } = useTheme();
  const [currentView, setCurrentView] = useState<AuthView>(initialView);
  const [signupEmail, setSignupEmail] = useState<string>('');

  useEffect(() => {
    if (!isOpen && currentView === 'postSignupPrompt') {
      onPromptDismissed();
      setCurrentView('login');
    }
    if (!isOpen) {
      setCurrentView('login');
    }
  }, [isOpen, currentView, onPromptDismissed]);

  useEffect(() => {
    if (currentView === 'forgot-password' || currentView === 'success') {
      return;
    }

    if (isAuthenticated && user && (user.hasSeenProfilePrompt === null || user.hasSeenProfilePrompt === undefined)) {
      return;
    }

    if (isAuthenticated && user && user.hasSeenProfilePrompt === false && isOpen) {
      onProfileFillRequest('profile');
      onClose();
    } else if (isAuthenticated && user && user.hasSeenProfilePrompt === true && isOpen) {
      onClose();
    }
  }, [isAuthenticated, user, isOpen, onClose, onProfileFillRequest, currentView]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleForgotPasswordSuccess = () => {
    setCurrentView('success');
    setTimeout(() => {
      onClose();
      setCurrentView('login');
    }, 2500);
  };

  const getTitle = () => {
    switch (currentView) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Join PrimoBoost AI';
      case 'forgot-password': return 'Reset Password';
      case 'success': return 'Success!';
      case 'postSignupPrompt': return 'Account Created!';
      default: return 'Authentication';
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case 'login': return 'Sign in to optimize your resume with AI';
      case 'signup': return 'Create your account and start optimizing';
      case 'forgot-password': return "We'll help you reset your password";
      case 'success': return 'Everything is set up perfectly!';
      case 'postSignupPrompt': return 'Your account is ready!';
      default: return '';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4" 
      onClick={handleBackdropClick}
    >
      <div className={`relative w-full max-w-[95vw] sm:max-w-md max-h-[95vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col ${
        isChristmasMode
          ? 'bg-slate-900 border-green-500/30'
          : 'bg-slate-900 border-emerald-500/30'
      }`}>
        {/* Glow effect */}
        <div className={`absolute -inset-1 rounded-2xl blur-xl opacity-30 pointer-events-none ${
          isChristmasMode
            ? 'bg-gradient-to-r from-red-500 via-green-500 to-emerald-500'
            : 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500'
        }`} />
        
        {/* Header */}
        <div className={`relative px-4 sm:px-6 py-5 sm:py-6 border-b flex-shrink-0 ${
          isChristmasMode
            ? 'bg-gradient-to-br from-slate-800/80 to-green-900/30 border-green-500/20'
            : 'bg-gradient-to-br from-slate-800/80 to-emerald-900/30 border-emerald-500/20'
        }`}>
          {/* Close button */}
          <button
            onClick={handleCloseClick}
            className={`absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-200 z-10 ${
              isChristmasMode
                ? 'bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/50'
                : 'bg-slate-800/80 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700/50'
            }`}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="text-center pr-8">
            {/* Icon */}
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg ${
              isChristmasMode
                ? 'bg-gradient-to-br from-red-500 via-emerald-500 to-green-600 shadow-green-500/30'
                : 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-emerald-500/30'
            }`}>
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            
            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
              {getTitle()}
            </h1>
            <p className="text-slate-400 text-sm">
              {getSubtitle()}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-slate-900">
          {currentView === 'login' && (
            <LoginForm
              onSwitchToSignup={() => setCurrentView('signup')}
              onForgotPassword={() => setCurrentView('forgot-password')}
            />
          )}

          {currentView === 'signup' && (
            <SignupForm
              onSwitchToLogin={() => setCurrentView('login')}
              onSignupSuccess={(needsVerification: boolean, email: string) => {
                setSignupEmail(email);
                if (needsVerification) {
                  setCurrentView('success');
                } else {
                  setCurrentView('postSignupPrompt');
                }
              }}
            />
          )}

          {currentView === 'forgot-password' && (
            <ForgotPasswordForm
              onBackToLogin={() => setCurrentView('login')}
              onSuccess={handleForgotPasswordSuccess}
            />
          )}

          {currentView === 'success' && (
            <div className="text-center py-6 sm:py-8">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 ${
                isChristmasMode
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-emerald-500/20 border border-emerald-500/30'
              }`}>
                <CheckCircle className={`w-8 h-8 sm:w-10 sm:h-10 ${
                  isChristmasMode ? 'text-green-400' : 'text-emerald-400'
                }`} />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-3">All Set!</h2>
              {signupEmail ? (
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed px-4">
                  A verification email has been sent to <br />
                  <strong className="text-white">{signupEmail}</strong>
                </p>
              ) : (
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed px-4">
                  Password reset email sent. Check your inbox!
                </p>
              )}
              <button
                onClick={() => onClose()}
                className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-xl text-sm transition-colors border border-slate-700"
              >
                Close
              </button>
            </div>
          )}

          {currentView === 'postSignupPrompt' && (
            <div className="text-center py-6 sm:py-8">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 ${
                isChristmasMode
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-emerald-500/20 border border-emerald-500/30'
              }`}>
                <CheckCircle className={`w-8 h-8 sm:w-10 sm:h-10 ${
                  isChristmasMode ? 'text-green-400' : 'text-emerald-400'
                }`} />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-3">Welcome!</h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed px-4 mb-6">
                Your account for <strong className="text-white">{signupEmail}</strong> has been created successfully!
                Would you like to complete your profile now?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 px-4">
                <button
                  onClick={() => {
                    onProfileFillRequest();
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-300 ${
                    isChristmasMode
                      ? 'bg-gradient-to-r from-red-500 via-emerald-500 to-green-600 hover:shadow-lg hover:shadow-green-500/30'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/30'
                  }`}
                >
                  Complete Profile
                </button>
                <button
                  onClick={() => {
                    onPromptDismissed();
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-xl text-sm transition-colors border border-slate-700"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
