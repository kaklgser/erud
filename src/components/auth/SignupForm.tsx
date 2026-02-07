// src/components/auth/SignupForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, Loader2, ArrowRight, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SignupCredentials } from '../../types/auth';

const signupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine((email) => email.includes('@') && email.split('@')[1]?.includes('.'), {
      message: 'Please enter a valid email address with @ and domain',
    }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Must contain at least one number')
    .regex(/(?=.*[@$!%*?&])/, 'Must contain at least one special character (@$!%*?&)'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (needsVerification: boolean, email: string) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin, onSignupSuccess }) => {
  const { signup } = useAuth();
  const { isChristmasMode } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupCredentials>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch('password');

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[@$!%*?&])/.test(password)) strength++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-emerald-500'];
    
    return {
      strength,
      label: labels[strength - 1] || 'Very Weak',
      color: colors[strength - 1] || 'bg-red-500'
    };
  };

  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = async (data: SignupCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signup(data);
      onSignupSuccess(result.needsVerification, data.email);
    } catch (err) {
      let errorMessage = 'Account creation failed. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('already registered') || err.message.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClass = `w-full pl-12 pr-4 py-3.5 rounded-xl transition-all duration-200 text-white placeholder-slate-500 border-2 border-slate-700 bg-slate-800/50 focus:bg-slate-800 hover:border-slate-600 ${
    isChristmasMode 
      ? 'focus:border-green-500 focus:ring-2 focus:ring-green-500/20' 
      : 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
  }`;

  const inputErrorClass = 'border-2 border-red-500/50 bg-red-500/10 focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 text-sm font-medium">{error}</p>
              {error.includes('already exists') && (
                <button
                  onClick={onSwitchToLogin}
                  className="text-red-400 text-xs mt-1 underline hover:no-underline"
                >
                  Sign in instead
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Full Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-500" />
            </div>
            <input
              {...register('name')}
              type="text"
              placeholder="Enter your full name"
              className={errors.name ? `w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-slate-500 ${inputErrorClass}` : inputBaseClass}
            />
          </div>
          {errors.name && (
            <p className="mt-2 text-sm text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email Address <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-500" />
            </div>
            <input
              {...register('email')}
              type="email"
              placeholder="your.email@example.com"
              className={errors.email ? `w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-slate-500 ${inputErrorClass}` : inputBaseClass}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Any email address is accepted (Gmail, college email, etc.)
          </p>
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
            Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-500" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              className={`${errors.password ? `w-full pl-12 pr-12 py-3.5 rounded-xl text-white placeholder-slate-500 ${inputErrorClass}` : `${inputBaseClass} pr-12`}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-400 min-w-[60px]">{passwordStrength.label}</span>
              </div>
            </div>
          )}
          
          {errors.password && (
            <p className="mt-2 text-sm text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Confirm Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-500" />
            </div>
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              className={`${errors.confirmPassword ? `w-full pl-12 pr-12 py-3.5 rounded-xl text-white placeholder-slate-500 ${inputErrorClass}` : `${inputBaseClass} pr-12`}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Referral Code Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Referral Code <span className="text-slate-500">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Gift className="h-5 w-5 text-slate-500" />
            </div>
            <input
              {...register('referralCode')}
              type="text"
              placeholder="Enter referral code"
              className={inputBaseClass}
            />
          </div>
          <p className={`mt-2 text-xs flex items-center gap-1 ${
            isChristmasMode ? 'text-green-400' : 'text-emerald-400'
          }`}>
            💰 Get ₹10 bonus in your wallet when you use a valid referral code!
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 mt-2 ${
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
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className={`text-center pt-4 border-t ${
        isChristmasMode ? 'border-green-500/20' : 'border-emerald-500/20'
      }`}>
        <p className="text-slate-400 text-sm">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className={`font-semibold transition-colors ${
              isChristmasMode ? 'text-green-400 hover:text-green-300' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Sign in here →
          </button>
        </p>
      </div>
    </div>
  );
};
