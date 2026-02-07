import React, { useState, useEffect } from 'react';
import { Home, Info, BookOpen, Phone, Menu, Wallet, User, Briefcase, FileText, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface MobileNavBarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ currentPage, onPageChange }) => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.email === 'primoboostai@gmail.com');
  
  // Check if Christmas mode is active (December)
  const [isChristmasMode] = useState(() => {
    const month = new Date().getMonth();
    return month === 11; // December
  });

  const navItems = [
    { id: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: '/about', label: 'About', icon: <Info className="w-5 h-5" /> },
    { id: '/careers', label: 'Careers', icon: <Briefcase className="w-5 h-5" /> },
    { id: '/jobs', label: 'Jobs', icon: <Briefcase className="w-5 h-5" /> },
    { id: '/tutorials', label: 'Tutorials', icon: <BookOpen className="w-5 h-5" /> },
    { id: '/contact', label: 'Contact', icon: <Phone className="w-5 h-5" /> },
    ...(isAuthenticated ? [{ id: '/profile', label: 'Profile', icon: <User className="w-5 h-5" /> }] : []),
    ...(isAuthenticated ? [{ id: '/profile?tab=wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> }] : []),
    ...(isAuthenticated ? [{ id: '/jobs/applications', label: 'Applications', icon: <FileText className="w-5 h-5" /> }] : []),
    ...(isAdmin ? [{ id: '/admin/email-testing', label: 'Email', icon: <Mail className="w-5 h-5" /> }] : []),
    { id: 'menu', label: 'Menu', icon: <Menu className="w-5 h-5" /> }
  ];

  // Christmas theme colors
  const activeColor = isChristmasMode ? 'text-red-400' : 'text-emerald-400';
  const activeBg = isChristmasMode ? 'bg-red-500/20' : 'bg-emerald-500/20';
  const hoverColor = isChristmasMode ? 'hover:text-red-400' : 'hover:text-emerald-400';
  const bgGradient = isChristmasMode 
    ? 'bg-gradient-to-t from-[#1a0a0f]/98 via-slate-900/98 to-slate-900/95' 
    : 'bg-slate-900/95';
  const borderColor = isChristmasMode ? 'border-red-900/30' : 'border-slate-700/50';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${bgGradient} backdrop-blur-xl border-t ${borderColor} shadow-lg lg:hidden safe-area`}>
      {/* Christmas decoration line */}
      {isChristmasMode && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-green-500 to-red-500" />
      )}
      
      <div className="flex items-center justify-around pb-safe-bottom">
        {navItems.map((item) => (
          item.id === 'menu' ? (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center justify-center py-2 sm:py-3 px-2 min-w-touch min-h-touch transition-colors touch-spacing ${
                currentPage === item.id
                  ? activeColor
                  : `text-slate-400 ${hoverColor}`
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className={`p-1.5 rounded-full mb-1 transition-colors ${
                currentPage === item.id ? activeBg : 'hover:bg-slate-800'
              }`}>
                {item.icon}
              </div>
              <span className="text-xs font-medium leading-tight">{item.label}</span>
            </button>
          ) : (
            <Link
              key={item.id}
              to={item.id}
              className={`flex flex-col items-center justify-center py-2 sm:py-3 px-2 min-w-touch min-h-touch transition-colors touch-spacing ${
                (window.location.pathname + window.location.search) === item.id || window.location.pathname === item.id
                  ? activeColor
                  : `text-slate-400 ${hoverColor}`
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className={`p-1.5 rounded-full mb-1 transition-colors ${
                (window.location.pathname + window.location.search) === item.id || window.location.pathname === item.id ? activeBg : 'hover:bg-slate-800'
              }`}>
                {item.icon}
              </div>
              <span className="text-xs font-medium leading-tight">{item.label}</span>
            </Link>
          )
        ))}
      </div>
    </div>
  );
};
