import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSuccess, onBackToLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password', '');

  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  const onSubmit = async (data: ResetPasswordData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('ResetPasswordForm: Attempting to update password...');

      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });

      if (updateError) {
        console.error('ResetPasswordForm: Password update error:', updateError);
        throw updateError;
      }

      console.log('ResetPasswordForm: Password updated successfully', updateData);
      onSuccess();
    } catch (err) {
      console.error('ResetPasswordForm: Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start dark:bg-red-900/20 dark:border-red-500/50">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="Enter new password"
              className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 dark:bg-dark-200 dark:border-dark-300 dark:text-gray-100 dark:placeholder-gray-500 ${
                errors.password
                  ? 'border-red-300 bg-red-50 dark:border-red-500 dark:bg-red-900/20'
                  : 'border-gray-200 bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white dark:focus:bg-dark-100'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.password.message}
            </p>
          )}
          {passwordStrength && !errors.password && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Password strength:</span>
                <span className={`text-xs font-semibold ${
                  passwordStrength.label === 'Weak' ? 'text-red-600 dark:text-red-400' :
                  passwordStrength.label === 'Fair' ? 'text-yellow-600 dark:text-yellow-400' :
                  passwordStrength.label === 'Good' ? 'text-blue-600 dark:text-blue-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-dark-300 rounded-full h-2">
                <div
                  className={`${passwordStrength.color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              placeholder="Confirm new password"
              className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 dark:bg-dark-200 dark:border-dark-300 dark:text-gray-100 dark:placeholder-gray-500 ${
                errors.confirmPassword
                  ? 'border-red-300 bg-red-50 dark:border-red-500 dark:bg-red-900/20'
                  : 'border-gray-200 bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white dark:focus:bg-dark-100'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 active:scale-[0.98] shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Reset Password</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-dark-200 dark:hover:bg-dark-300 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Back to Login
          </button>
        </div>
      </form>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl dark:bg-blue-900/20 dark:border-blue-500/30">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Password Requirements:</strong> At least 8 characters. For better security, use a mix of uppercase, lowercase, numbers, and special characters.
        </p>
      </div>
    </div>
  );
};
