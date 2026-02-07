import React, { useMemo } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react';
import { ResumeData } from '../types/resume';
import { ExportOptions } from '../types/export';

interface ATSExportValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  resumeData: ResumeData;
  exportOptions: ExportOptions;
  format: 'pdf' | 'word';
}

interface ValidationItem {
  category: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'success';
}

export const ATSExportValidationModal: React.FC<ATSExportValidationModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  resumeData,
  exportOptions,
  format
}) => {
  const validation = useMemo(() => {
    const items: ValidationItem[] = [];

    if (exportOptions.bodyTextSize >= 11) {
      items.push({
        category: 'Font Size',
        passed: true,
        message: 'Body text is 11pt or larger (ATS-friendly)',
        severity: 'success'
      });
    } else {
      items.push({
        category: 'Font Size',
        passed: false,
        message: `Body text is ${exportOptions.bodyTextSize}pt (recommended: 11pt+)`,
        severity: 'warning'
      });
    }

    if (exportOptions.sectionHeaderSize >= 13) {
      items.push({
        category: 'Header Size',
        passed: true,
        message: 'Section headers are 13pt or larger (ATS-friendly)',
        severity: 'success'
      });
    } else {
      items.push({
        category: 'Header Size',
        passed: false,
        message: `Headers are ${exportOptions.sectionHeaderSize}pt (recommended: 13-14pt)`,
        severity: 'warning'
      });
    }

    const atsFriendlyFonts = ['Calibri', 'Arial', 'Times New Roman', 'Verdana'];
    if (atsFriendlyFonts.includes(exportOptions.fontFamily)) {
      items.push({
        category: 'Font Family',
        passed: true,
        message: `Using ${exportOptions.fontFamily} (ATS-friendly)`,
        severity: 'success'
      });
    } else {
      items.push({
        category: 'Font Family',
        passed: false,
        message: `Using ${exportOptions.fontFamily} (may not be ATS-friendly)`,
        severity: 'warning'
      });
    }

    if (exportOptions.layoutType === 'ats-optimized') {
      items.push({
        category: 'Layout',
        passed: true,
        message: 'Using ATS-Optimized layout with proper margins',
        severity: 'success'
      });
    } else {
      items.push({
        category: 'Layout',
        passed: true,
        message: `Using ${exportOptions.layoutType} layout`,
        severity: 'success'
      });
    }

    if (resumeData.name && resumeData.email && resumeData.phone) {
      items.push({
        category: 'Contact Info',
        passed: true,
        message: 'All essential contact details present',
        severity: 'success'
      });
    } else {
      items.push({
        category: 'Contact Info',
        passed: false,
        message: 'Missing essential contact information',
        severity: 'error'
      });
    }

    let longBulletCount = 0;
    resumeData.workExperience?.forEach(job => {
      job.bullets?.forEach(bullet => {
        if (typeof bullet === 'string' && bullet.length > 120) {
          longBulletCount++;
        }
      });
    });
    resumeData.projects?.forEach(project => {
      project.bullets?.forEach(bullet => {
        if (typeof bullet === 'string' && bullet.length > 120) {
          longBulletCount++;
        }
      });
    });

    if (longBulletCount === 0) {
      items.push({
        category: 'Bullet Points',
        passed: true,
        message: 'All bullet points under 120 characters',
        severity: 'success'
      });
    } else {
      items.push({
        category: 'Bullet Points',
        passed: false,
        message: `${longBulletCount} bullet point(s) exceed 120 characters`,
        severity: 'warning'
      });
    }

    const allText = JSON.stringify(resumeData).toLowerCase();
    const hasCloudKeywords = ['aws', 'azure', 'gcp', 'cloud'].some(k => allText.includes(k));
    const hasMethodology = ['agile', 'scrum', 'sdlc', 'ci/cd'].some(k => allText.includes(k));

    if (hasCloudKeywords && hasMethodology) {
      items.push({
        category: 'Keywords',
        passed: true,
        message: 'Contains cloud and methodology keywords',
        severity: 'success'
      });
    } else {
      const missing: string[] = [];
      if (!hasCloudKeywords) missing.push('cloud platforms');
      if (!hasMethodology) missing.push('methodologies');
      items.push({
        category: 'Keywords',
        passed: false,
        message: `Missing: ${missing.join(', ')}`,
        severity: 'warning'
      });
    }

    const passedCount = items.filter(i => i.passed).length;
    const hasErrors = items.some(i => i.severity === 'error');
    const hasWarnings = items.some(i => !i.passed && i.severity === 'warning');

    return {
      items,
      passedCount,
      totalCount: items.length,
      percentage: Math.round((passedCount / items.length) * 100),
      hasErrors,
      hasWarnings,
      canProceed: !hasErrors
    };
  }, [resumeData, exportOptions]);

  if (!isOpen) return null;

  const getIcon = (severity: string, passed: boolean) => {
    if (severity === 'error') return <XCircle className="w-5 h-5 text-red-500" />;
    if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return passed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-100 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-dark-300">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              ATS Export Validation
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Validation Score
              </span>
              <span className={`text-2xl font-bold ${
                validation.percentage >= 85 ? 'text-green-600' :
                validation.percentage >= 70 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {validation.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-dark-300">
              <div
                className={`h-3 rounded-full transition-all ${
                  validation.percentage >= 85 ? 'bg-green-500' :
                  validation.percentage >= 70 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${validation.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {validation.passedCount} of {validation.totalCount} checks passed
            </p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-3">
            {validation.items.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  item.severity === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500/50' :
                  item.severity === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-500/50' :
                  'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-500/50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {getIcon(item.severity, item.passed)}
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${
                      item.severity === 'error' ? 'text-red-900 dark:text-red-300' :
                      item.severity === 'warning' ? 'text-yellow-900 dark:text-yellow-300' :
                      'text-green-900 dark:text-green-300'
                    }`}>
                      {item.category}
                    </p>
                    <p className={`text-xs mt-1 ${
                      item.severity === 'error' ? 'text-red-700 dark:text-red-400' :
                      item.severity === 'warning' ? 'text-yellow-700 dark:text-yellow-400' :
                      'text-green-700 dark:text-green-400'
                    }`}>
                      {item.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {validation.hasErrors && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 rounded-lg">
              <p className="text-sm font-medium text-red-900 dark:text-red-300">
                Critical Issues Found
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                Please fix the errors above before exporting. These issues may prevent your resume from being parsed correctly by ATS systems.
              </p>
            </div>
          )}

          {validation.hasWarnings && !validation.hasErrors && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/50 rounded-lg">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                Warnings Detected
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                Your resume can be exported, but addressing these warnings will improve ATS compatibility.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-dark-300 bg-gray-50 dark:bg-dark-200">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors font-medium"
            >
              Go Back
            </button>
            <button
              onClick={onProceed}
              disabled={!validation.canProceed}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                validation.canProceed
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 dark:bg-dark-300 text-gray-500 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              <Download className="w-5 h-5" />
              <span>Export {format.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
