import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeColors {
  primaryGradient: string;
  accentColor: string;
  glowColor: string;
  borderColor: string;
  badgeBackground: string;
  badgeBorder: string;
  badgeText: string;
  successColor: string;
  backgroundGradient: string;
}

interface ThemeContextType {
  isChristmasMode: boolean;
  toggleChristmasMode: () => void;
  colors: ThemeColors;
  getButtonClasses: (variant: 'primary' | 'secondary') => string;
  getCardClasses: (glow?: boolean) => string;
  getBadgeClasses: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultColors: ThemeColors = {
  primaryGradient: 'from-emerald-500 to-cyan-500',
  accentColor: 'emerald',
  glowColor: 'emerald-400',
  borderColor: 'emerald-400/40',
  badgeBackground: 'bg-emerald-500/10',
  badgeBorder: 'border-emerald-400/30',
  badgeText: 'text-emerald-300',
  successColor: 'emerald-400',
  backgroundGradient: 'from-[#0a1e1e] via-[#0d1a1a] to-[#070b14]',
};

const christmasColors: ThemeColors = {
  primaryGradient: 'from-red-500 via-emerald-500 to-green-600',
  accentColor: 'green',
  glowColor: 'green-400',
  borderColor: 'green-400/40',
  badgeBackground: 'bg-gradient-to-r from-red-500/10 to-green-500/10',
  badgeBorder: 'border-red-400/30',
  badgeText: 'text-red-300',
  successColor: 'green-400',
  backgroundGradient: 'from-[#1a0a0f] via-[#0f1a0f] to-[#070b14]',
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isChristmasMode, setIsChristmasMode] = useState(() => {
    const stored = localStorage.getItem('christmasModeEnabled');
    if (stored !== null) {
      return stored === 'true';
    }
    const month = new Date().getMonth();
    return month === 11;
  });

  useEffect(() => {
    localStorage.setItem('christmasModeEnabled', isChristmasMode.toString());
  }, [isChristmasMode]);

  const toggleChristmasMode = () => {
    setIsChristmasMode(prev => !prev);
  };

  const colors = isChristmasMode ? christmasColors : defaultColors;

  const getButtonClasses = (variant: 'primary' | 'secondary'): string => {
    if (variant === 'primary') {
      return isChristmasMode
        ? 'bg-gradient-to-r from-red-500 via-emerald-500 to-green-600 hover:shadow-red-500/50 text-white'
        : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-emerald-500/50 text-white';
    } else {
      return isChristmasMode
        ? 'border-red-500/40 bg-red-500/10 hover:bg-red-500/20 hover:border-red-400/60 text-slate-100'
        : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-emerald-400/50 text-slate-100';
    }
  };

  const getCardClasses = (glow = true): string => {
    const baseClasses = 'bg-slate-900/80 border backdrop-blur-xl rounded-2xl transition-all duration-300';
    if (!glow) {
      return `${baseClasses} border-slate-800`;
    }
    return isChristmasMode
      ? `${baseClasses} border-green-500/30 hover:border-green-400/50 hover:shadow-[0_0_40px_rgba(34,197,94,0.25)]`
      : `${baseClasses} border-slate-800 hover:border-emerald-500/40 hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]`;
  };

  const getBadgeClasses = (): string => {
    return isChristmasMode
      ? 'bg-gradient-to-r from-red-500/10 to-green-500/10 border border-red-400/30 text-red-300'
      : 'bg-emerald-500/10 border border-emerald-400/30 text-emerald-300';
  };

  return (
    <ThemeContext.Provider
      value={{
        isChristmasMode,
        toggleChristmasMode,
        colors,
        getButtonClasses,
        getCardClasses,
        getBadgeClasses,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
