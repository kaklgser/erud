// src/components/navigation/Navigation.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  Info,
  Phone,
  BookOpen,
  MessageCircle,
  ChevronDown,
  Target,
  TrendingUp,
  PlusCircle,
  Users,
  Briefcase,
  FileText,
  Mail,
  Shield,
  LayoutDashboard,
  Sparkles,
  Gamepad2,
  CalendarCheck,
  Video,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";

interface NavigationProps {
  onPageChange: (path: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onPageChange }) => {
  const [showAIToolsDropdown, setShowAIToolsDropdown] = useState(false);
  const [showDashboardDropdown, setShowDashboardDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const aiToolsRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiToolsRef.current && !aiToolsRef.current.contains(event.target as Node)) {
        setShowAIToolsDropdown(false);
      }
      if (dashboardRef.current && !dashboardRef.current.contains(event.target as Node)) {
        setShowDashboardDropdown(false);
      }
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setShowAdminDropdown(false);
      }
    };
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAIToolsDropdown(false);
        setShowDashboardDropdown(false);
        setShowAdminDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const navigationItems = [
    { id: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    { id: "/jobs", label: "Latest Jobs", icon: <Briefcase className="w-4 h-4" /> },
    { id: "/tutorials", label: "Tutorials", icon: <BookOpen className="w-4 h-4" /> },
  ];

  const dashboardItems = [
    { id: "/about", label: "About Us", icon: <Info className="w-4 h-4" /> },
    { id: "/blog", label: "Blog", icon: <BookOpen className="w-4 h-4" /> },
    { id: "/webinars", label: "Webinars", icon: <Sparkles className="w-4 h-4" /> },
    { id: "/gaming", label: "Gaming", icon: <Gamepad2 className="w-4 h-4" /> },
    { id: "/careers", label: "Careers", icon: <Users className="w-4 h-4" /> },
    { id: "/contact", label: "Contact", icon: <Phone className="w-4 h-4" /> },
    ...(isAuthenticated
      ? [
          {
            id: "/jobs/applications",
            label: "My Applications",
            icon: <FileText className="w-4 h-4" />,
          },
          {
            id: "/my-bookings",
            label: "My Bookings",
            icon: <CalendarCheck className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  const aiTools = [
    { id: "/optimizer", label: "Resume Optimizer", icon: <Target className="w-4 h-4" /> },
    { id: "/score-checker", label: "Score Checker", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "/guided-builder", label: "Guided Builder", icon: <PlusCircle className="w-4 h-4" /> },
    { id: "/linkedin-generator", label: "LinkedIn Messages", icon: <MessageCircle className="w-4 h-4" /> },
  ];

  const adminItems = [
    { id: "/admin/dashboard", label: "Admin Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "/admin/jobs", label: "Manage Jobs", icon: <Briefcase className="w-4 h-4" /> },
    { id: "/admin/webinars", label: "Webinar Management", icon: <Video className="w-4 h-4" /> },
    { id: "/admin/blog", label: "Blog Management", icon: <FileText className="w-4 h-4" /> },
    { id: "/admin/email-testing", label: "Email Testing", icon: <Mail className="w-4 h-4" /> },
    { id: "/admin/users", label: "Manage Users", icon: <Users className="w-4 h-4" /> },
    { id: "/admin/sessions", label: "Session Schedule", icon: <Sparkles className="w-4 h-4" /> },
  ];

  const isAdmin = isAuthenticated && (user?.role === "admin" || user?.email === "primoboostai@gmail.com");

  return (
    <nav className="hidden lg:flex items-center space-x-6">
      {navigationItems.map((item) => (
        <Link
          key={item.id}
          to={item.id}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            typeof window !== "undefined" && window.location.pathname === item.id
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-300 hover:text-emerald-400 hover:bg-slate-800/50"
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}

      {/* AI Tools Dropdown */}
      {isAuthenticated && (
        <div className="relative" ref={aiToolsRef}>
          <button
            onClick={() => {
              setShowAIToolsDropdown(!showAIToolsDropdown);
              setShowDashboardDropdown(false);
              setShowAdminDropdown(false);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              showAIToolsDropdown
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Tools</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAIToolsDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showAIToolsDropdown && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900/95 rounded-xl shadow-2xl border border-emerald-500/30 py-2 z-[100] backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
              {aiTools.map((tool) => (
                <Link
                  key={tool.id}
                  to={tool.id}
                  onClick={() => setShowAIToolsDropdown(false)}
                  className="relative w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-emerald-500/10 transition-colors text-slate-300 hover:text-emerald-400"
                >
                  {tool.icon}
                  <span className="font-medium">{tool.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Primo Space Dropdown */}
      <div className="relative" ref={dashboardRef}>
        <button
          onClick={() => {
            setShowDashboardDropdown(!showDashboardDropdown);
            setShowAIToolsDropdown(false);
            setShowAdminDropdown(false);
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            showDashboardDropdown
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800/50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Primo space</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDashboardDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDashboardDropdown && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900/95 rounded-xl shadow-2xl border border-emerald-500/30 py-2 z-[100] backdrop-blur-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
            {dashboardItems.map((item) => (
              <Link
                key={item.id}
                to={item.id}
                onClick={() => setShowDashboardDropdown(false)}
                className="relative w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-emerald-500/10 transition-colors text-slate-300 hover:text-emerald-400"
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Admin Dropdown */}
      {isAdmin && (
        <div className="relative" ref={adminRef}>
          <button
            onClick={() => {
              setShowAdminDropdown(!showAdminDropdown);
              setShowAIToolsDropdown(false);
              setShowDashboardDropdown(false);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              showAdminDropdown
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'text-slate-300 hover:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAdminDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showAdminDropdown && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900/95 rounded-xl shadow-2xl border border-red-500/30 py-2 z-[100] backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
              {adminItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.id}
                  onClick={() => setShowAdminDropdown(false)}
                  className="relative w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-500/10 transition-colors text-slate-300 hover:text-red-400"
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
