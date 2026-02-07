// src/components/AlertModal.tsx
import React from 'react';
import { X, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionText?: string;
  onAction?: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  actionText,
  onAction,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-400" />;
      case 'error':
        return <AlertTriangle className="w-8 h-8 text-red-400" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-cyan-400" />;
    }
  };

  const getIconBgClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10';
      case 'warning':
        return 'bg-amber-500/10';
      case 'error':
        return 'bg-red-500/10';
      case 'info':
      default:
        return 'bg-cyan-500/10';
    }
  };

  const getButtonClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500 hover:bg-emerald-600';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      case 'info':
      default:
        return 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" 
      onClick={handleBackdropClick}
    >
      <div className="card-surface w-full max-w-md max-h-[95vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="relative p-6 border-b border-slate-700/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors rounded-full hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${getIconBgClasses()}`}>
              {getIcon()}
            </div>
            <h1 className="text-xl font-bold text-slate-100">{title}</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-slate-300 mb-6">{message}</p>
          {actionText && onAction ? (
            <button
              onClick={() => {
                if (onAction) onAction();
                onClose();
              }}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-emerald-glow ${getButtonClasses()}`}
            >
              {actionText}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-xl font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 transition-colors duration-300"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
