import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { exportToPDF, exportToWord } from '../utils/exportUtils';
import type { ResumeData, UserType } from '../types/resume';
import type { ExportOptions } from '../types/export';
import { defaultExportOptions } from '../types/export';

interface ExportButtonsProps {
  resumeData: ResumeData;
  userType?: UserType;
  targetRole?: string;
  onShowProfile?: (mode?: 'profile' | 'wallet') => void;
  walletRefreshKey?: number;
  exportOptions?: ExportOptions;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  resumeData,
  userType = 'experienced',
  targetRole,
  onShowProfile,
  walletRefreshKey,
  exportOptions = defaultExportOptions
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'pdf' | 'word' | null;
    status: 'success' | 'error' | null;
    message: string;
  }>({ type: null, status: null, message: '' });

  const handleExportPDF = async () => {
    if (isExportingPDF || isExportingWord) return;

    setIsExportingPDF(true);
    setExportStatus({ type: null, status: null, message: '' });

    try {
      await exportToPDF(resumeData, userType, exportOptions);
      setExportStatus({
        type: 'pdf',
        status: 'success',
        message: 'PDF exported successfully!'
      });
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 3000);
    } catch (error) {
      console.error('PDF export failed:', error);
      setExportStatus({
        type: 'pdf',
        status: 'error',
        message: 'PDF export failed. Please try again.'
      });
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 5000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportWord = async () => {
    if (isExportingWord || isExportingPDF) return;

    setIsExportingWord(true);
    setExportStatus({ type: null, status: null, message: '' });

    try {
      await exportToWord(resumeData, userType);
      setExportStatus({
        type: 'word',
        status: 'success',
        message: 'Word document exported successfully!'
      });
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 3000);
    } catch (error) {
      console.error('Word export failed:', error);
      setExportStatus({
        type: 'word',
        status: 'error',
        message: 'Word export failed. Please try again.'
      });
      setTimeout(() => {
        setExportStatus({ type: null, status: null, message: '' });
      }, 5000);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Export Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExportPDF}
          disabled={isExportingPDF || isExportingWord}
          className={`flex-1 py-3 px-5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            isExportingPDF || isExportingWord
              ? 'bg-slate-700 cursor-not-allowed text-slate-400'
              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-glow'
          }`}
        >
          {isExportingPDF ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Exporting PDF...</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              <span>Download PDF</span>
            </>
          )}
        </button>

        <button
          onClick={handleExportWord}
          disabled={isExportingWord || isExportingPDF}
          className={`flex-1 py-3 px-5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            isExportingWord || isExportingPDF
              ? 'bg-slate-700 cursor-not-allowed text-slate-400'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg hover:shadow-emerald-glow'
          }`}
        >
          {isExportingWord ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Exporting Word...</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              <span>Download Word</span>
            </>
          )}
        </button>
      </div>

      {/* Export Status Message */}
      {exportStatus.status && (
        <div
          className={`p-4 rounded-xl border transition-all ${
            exportStatus.status === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {exportStatus.status === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{exportStatus.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
