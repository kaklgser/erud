import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface GradientButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}) => {
  const sizeClasses = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 shadow-emerald-glow hover:shadow-emerald-glow-lg',
    secondary: 'bg-slate-800/50 text-slate-200 border border-slate-700 hover:bg-slate-700/50 hover:border-emerald-500/30',
    outline: 'bg-transparent text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/10 hover:border-emerald-400',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400 }}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-xl font-semibold
        relative overflow-hidden
        flex items-center justify-center gap-2
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        group
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {Icon && <Icon className="w-5 h-5 relative z-10" />}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};
