import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface GlowBadgeProps {
  text: string;
  icon?: LucideIcon | string;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'error';
  pulse?: boolean;
  className?: string;
}

export const GlowBadge: React.FC<GlowBadgeProps> = ({
  text,
  icon,
  variant = 'default',
  pulse = false,
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300',
    success: 'bg-emerald-500/10 border border-emerald-400/30 text-emerald-300',
    warning: 'bg-amber-500/10 border border-amber-400/30 text-amber-300',
    info: 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300',
    error: 'bg-red-500/10 border border-red-400/30 text-red-300',
  };

  const pulseColors = {
    default: 'bg-emerald-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    info: 'bg-cyan-400',
    error: 'bg-red-400',
  };

  const Icon = typeof icon === 'string' ? null : icon;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur ${variantClasses[variant]} ${className}`}
    >
      {pulse && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-2 h-2 rounded-full ${pulseColors[variant]}`}
        />
      )}
      {typeof icon === 'string' ? (
        <span className="text-base">{icon}</span>
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      <span>{text}</span>
    </motion.div>
  );
};
