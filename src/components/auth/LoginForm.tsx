import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LoginCredentials } from '../../types/auth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid Gmail address'),
  password: z.string().min(1, 'Password is required'),
});

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
  onClose?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onForgotPassword, onClose }) => {
  const { login } = useAuth();
  const { isChristmasMode } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      await login(data);
      setIsSuccess(true);
    } catch (err) {
      let errorMessage = 'Sign in failed. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials') || err.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address before signing in.';
        } else if (err.message.includes('Too many requests')) {
          errorMessage = 'Too many attempts. Please wait a moment and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          isChristmasMode
            ? 'bg-green-500/20 border border-green-500/30'
            : 'bg-emerald-500/20 border border-emerald-500/30'
        }`}>
          <CheckCircle className={`w-8 h-8 ${isChristmasMode ? 'text-green-400' : 'text-emerald-400'}`} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
        <p className="text-slate-400">You have been signed in successfully.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 text-sm font-medium">{error}</p>
              {error.includes('Invalid email or password') && (
                <button 
                  type="button"
                  onClick={onForgotPassword}
                  className="text-red-400 text-xs mt-1 underline hover:no-underline"
                >
                  Forgot your password?
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Gmail Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-500" />
            </div>
            <input
              {...register('email')}
              type="email"
              placeholder="your.email@gmail.com"
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

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-500" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className={`w-full pl-12 pr-12 py-3.5 rounded-xl transition-all duration-200 text-white placeholder-slate-500 ${
                errors.password 
                  ? 'border-2 border-red-500/50 bg-red-500/10 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : `border-2 border-slate-700 bg-slate-800/50 focus:bg-slate-800 hover:border-slate-600 ${
                      isChristmasMode 
                        ? 'focus:border-green-500 focus:ring-2 focus:ring-green-500/20' 
                        : 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className={`text-sm font-medium transition-colors hover:underline ${
              isChristmasMode ? 'text-green-400 hover:text-green-300' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Forgot your password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 ${
            isLoading
              ? 'bg-slate-700 cursor-not-allowed'
              : isChristmasMode
                ? 'bg-gradient-to-r from-red-500 via-emerald-500 to-green-600 hover:shadow-lg hover:shadow-green-500/30 active:scale-[0.98]'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className={`text-center pt-5 border-t ${
        isChristmasMode ? 'border-green-500/20' : 'border-emerald-500/20'
      }`}>
        <p className="text-slate-400 text-sm">
          Don't have an account yet?{' '}
          <button 
            type="button" 
            onClick={onSwitchToSignup} 
            className={`font-semibold transition-colors ${
              isChristmasMode ? 'text-green-400 hover:text-green-300' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};
