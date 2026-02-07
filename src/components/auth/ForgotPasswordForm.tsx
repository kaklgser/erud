// src/components/auth/ForgotPasswordForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, AlertCircle, CheckCircle, Loader2, ArrowLeft, Clock, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin, onSuccess }) => {
  const { forgotPassword } = useAuth();
  const { isChristmasMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev <= 1) {
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  const onSubmit = async (data: ForgotPasswordData) => {
    if (isRateLimited) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await forgotPassword({ email: data.email });
      setSuccessMessage('Password reset email sent! Please check your inbox and spam folder.');
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';

      if (errorMessage.includes('Too many password reset attempts')) {
        setIsRateLimited(true);
        const match = errorMessage.match(/(\d+) minute/);
        if (match) {
          const minutes = parseInt(match[1]);
          setRetryAfter(minutes * 60);
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <p className="text-slate-400 leading-relaxed text-sm">Enter your email to receive a reset link.</p>
      </div>

      {/* Security info box */}
      <div className={`p-4 rounded-xl flex items-start ${
        isChristmasMode
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-emerald-500/10 border border-emerald-500/30'
      }`}>
        <Shield className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
          isChristmasMode ? 'text-green-400' : 'text-emerald-400'
        }`} />
        <div className="text-sm">
          <p className={`font-medium mb-1 ${isChristmasMode ? 'text-green-300' : 'text-emerald-300'}`}>
            Secure Password Reset
          </p>
          <p className="text-xs text-slate-400">
            The reset link will expire in 1 hour. For security, you can only request 3 resets per 15 minutes.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start">
          <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-red-300 text-sm font-medium">{error}</p>
        </div>
      )}

      {isRateLimited && retryAfter > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start">
          <Clock className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-amber-300 font-medium mb-1">Rate limit reached</p>
            <p className="text-amber-400/80 text-xs">
              Please wait {formatTime(retryAfter)} before requesting another reset.
            </p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className={`p-4 rounded-xl flex items-start ${
          isChristmasMode
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-emerald-500/10 border border-emerald-500/30'
        }`}>
          <CheckCircle className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
            isChristmasMode ? 'text-green-400' : 'text-emerald-400'
          }`} />
          <span className={`text-sm font-medium ${isChristmasMode ? 'text-green-300' : 'text-emerald-300'}`}>
            {successMessage}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="email"
              {...register('email')}
              placeholder="you@example.com"
              className={`w-full pl-12 pr-4 py-3.5 rounded-xl transition-all duration-200 text-white placeholder-slate-500 ${
                errors.email 
                  ? 'border-2 border-red-500/50 bg-red-500/10 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : `border-2 border-slate-700 bg-slate-800/50 focus:bg-slate-800 hover:border-slate-600 ${
                      isChristmasMode 
                        ? 'focus:border-green-500 focus:ring-2 focus:ring-green-500/20' 
                        : 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || isRateLimited}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 ${
            isLoading || isRateLimited
              ? 'bg-slate-700 cursor-not-allowed'
              : isChristmasMode
                ? 'bg-gradient-to-r from-red-500 via-emerald-500 to-green-600 hover:shadow-lg hover:shadow-green-500/30 active:scale-[0.98]'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : isRateLimited ? (
            <>
              <Clock className="w-5 h-5" />
              <span>Wait {formatTime(retryAfter)}</span>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5" />
              <span>Send Reset Link</span>
            </>
          )}
        </button>
      </form>

      <div className={`text-center pt-5 border-t ${
        isChristmasMode ? 'border-green-500/20' : 'border-emerald-500/20'
      }`}>
        <button
          type="button"
          onClick={onBackToLogin}
          className={`font-medium transition-colors flex items-center justify-center mx-auto ${
            isChristmasMode ? 'text-green-400 hover:text-green-300' : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Sign In
        </button>
      </div>
    </div>
  );
};
