// updated overlay hover icon
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Target,
  PlusCircle,
  MessageSquare,
  TrendingUp,
  MessageCircle,
  Gamepad2,
  BookOpen,
  Info,
  Phone,
  Briefcase,
  FileText,
  Sparkles,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Calendar,
  CalendarCheck,
} from 'lucide-react';

// Interfaces
interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  highlight?: boolean; // For special highlighting
}

interface SidebarSection {
  id: string;
  label: string;
  items: SidebarItem[];
}

interface PageSidebarProps {
  currentPath?: string;
}

// Navigation items configuration
const toolsSection: SidebarSection = {
  id: 'tools',
  label: 'Tools',
  items: [
    { id: 'optimizer', label: 'JD-Based Optimizer', icon: <Target className="w-5 h-5" />, path: '/optimizer' },
    { id: 'guided-builder', label: 'Guided Resume Builder', icon: <PlusCircle className="w-5 h-5" />, path: '/guided-builder' },
    { id: 'mock-interview', label: 'AI Mock Interview', icon: <MessageSquare className="w-5 h-5" />, path: '/mock-interview' },
    { id: 'score-checker', label: 'Resume Score Check', icon: <TrendingUp className="w-5 h-5" />, path: '/score-checker' },
    { id: 'linkedin-generator', label: 'Outreach Messages', icon: <MessageCircle className="w-5 h-5" />, path: '/linkedin-generator' },
    { id: 'gaming', label: 'Gaming Aptitude', icon: <Gamepad2 className="w-5 h-5" />, path: '/gaming' },
    { id: 'session', label: 'Resume Session', icon: <Calendar className="w-5 h-5" />, path: '/session' },
    { id: 'my-bookings', label: 'My Bookings', icon: <CalendarCheck className="w-5 h-5" />, path: '/my-bookings' },
  ],
};

const pagesSection: SidebarSection = {
  id: 'pages',
  label: 'Explore',
  items: [
    { id: 'jobs', label: 'Latest Jobs', icon: <Briefcase className="w-5 h-5" />, path: '/jobs' },
    { id: 'pricing', label: 'Pricing', icon: <CreditCard className="w-5 h-5" />, path: '/pricing' },
    { id: 'blog', label: 'Blog', icon: <FileText className="w-5 h-5" />, path: '/blog' },
    { id: 'webinars', label: 'Webinars', icon: <Sparkles className="w-5 h-5" />, path: '/webinars' },
    { id: 'tutorials', label: 'Tutorials', icon: <BookOpen className="w-5 h-5" />, path: '/tutorials' },
    { id: 'about', label: 'About Us', icon: <Info className="w-5 h-5" />, path: '/about' },
    { id: 'contact', label: 'Contact Us', icon: <Phone className="w-5 h-5" />, path: '/contact' },
  ],
};



export const PageSidebar: React.FC<PageSidebarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (hoveredItem && !isExpanded && itemRefs.current[hoveredItem]) {
      const rect = itemRefs.current[hoveredItem]!.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
    } else {
      setTooltipPosition(null);
    }
  }, [hoveredItem, isExpanded]);

  const renderSidebarItem = (item: SidebarItem, _index: number) => {
    const active = isActive(item.path);

    return (
      <div 
        key={item.id} 
        ref={(el) => (itemRefs.current[item.id] = el)}
        className="relative"
        onMouseEnter={() => !isExpanded && setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <motion.button
          onClick={() => handleNavigation(item.path)}
          className={`w-full flex items-center ${isExpanded ? 'justify-start gap-3 px-3' : 'justify-center'} p-3 rounded-lg transition-all duration-200 ${
            active
              ? 'bg-[rgba(0,230,184,0.15)] text-[#00E6B8]'
              : 'text-[#7A8CAA] hover:text-[#00E6B8] hover:bg-[rgba(0,230,184,0.15)]'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          {isExpanded && (
            <span className="text-sm font-medium text-slate-200 transition-opacity duration-200">
              {item.label}
            </span>
          )}
        </motion.button>
      </div>
    );
  };

  const hoveredItemData = hoveredItem 
    ? [...toolsSection.items, ...pagesSection.items].find(item => item.id === hoveredItem)
    : null;

  return (
    <>
      <motion.aside
        initial={{ width: 64 }}
        animate={{ width: isExpanded ? 232 : 64 }}
        className="fixed left-0 top-14 sm:top-16 bottom-0 z-[9999] hidden md:flex flex-col bg-[#05131A] backdrop-blur-sm border-r border-[#0c1d25] transition-[width]"
      >
        {/* Toggle button */}
        <div className="px-2 pt-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-200 p-2 hover:bg-slate-800/80 transition-colors"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Tools Section */}
        <div className="flex-1 overflow-y-auto px-2 pt-3">
          <div className="space-y-1">
            {toolsSection.items.map((item, index) => renderSidebarItem(item, index))}
          </div>

          {/* Divider */}
          <div className="my-4 mx-2 border-t border-slate-800" />

          {/* Pages Section */}
          <div className="space-y-1">
            {pagesSection.items.map((item, index) =>
              renderSidebarItem(item, index + toolsSection.items.length)
            )}
          </div>
        </div>
      </motion.aside>

      {/* Glassy overlay tooltip portal - rendered outside sidebar */}
      {!isExpanded && hoveredItem && tooltipPosition && hoveredItemData && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap z-[10001] pointer-events-none"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.95) 0%, rgba(5, 19, 26, 0.95) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 230, 184, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            {hoveredItemData.label}
            {/* Arrow */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45"
              style={{
                background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.95) 0%, rgba(5, 19, 26, 0.95) 100%)',
                borderLeft: '1px solid rgba(0, 230, 184, 0.2)',
                borderBottom: '1px solid rgba(0, 230, 184, 0.2)',
              }}
            />
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
