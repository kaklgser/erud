// src/components/ResumeExportSettings.tsx
import React, { useState, useEffect } from 'react';
import { Type, LayoutGrid as Layout, Ruler, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { ExportOptions, defaultExportOptions, LayoutType, PaperSize, layoutConfigs, paperSizeConfigs } from '../types/export';
import { ResumePreview } from './ResumePreview';
import { ResumeData, UserType } from '../types/resume';
import { ATSExportValidationModal } from './ATSExportValidationModal';

interface ResumeExportSettingsProps {
  resumeData: ResumeData;
  userType?: UserType;
  onExport: (options: ExportOptions, format: 'pdf' | 'word') => void;
  // When true, shows the inline Live Preview panel inside this component.
  // Set to false when a parent provides its own preview to avoid duplication.
  showInlinePreview?: boolean;
  // Callback to notify parent when options change (for live preview sync)
  onOptionsChange?: (options: ExportOptions) => void;
  // Initial options from parent
  initialOptions?: ExportOptions;
}

export const ResumeExportSettings: React.FC<ResumeExportSettingsProps> = ({
  resumeData,
  userType = 'experienced',
  onExport,
  showInlinePreview = true,
  onOptionsChange,
  initialOptions
}) => {
  const [options, setOptions] = useState<ExportOptions>(initialOptions || defaultExportOptions);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<'pdf' | 'word' | null>(null);

  // Sync with parent's initialOptions if they change
  useEffect(() => {
    if (initialOptions) {
      setOptions(initialOptions);
    }
  }, [initialOptions]);

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => {
      const newOptions = { ...prev, [key]: value };

      if (key === 'layoutType') {
        const selectedLayoutConfig = layoutConfigs[value as LayoutType];
        newOptions.sectionSpacing = selectedLayoutConfig.spacing.section;
        newOptions.entrySpacing = selectedLayoutConfig.spacing.entry;
        // Margins are derived from layoutConfigs at render time, not stored in ExportOptions
      }
      
      // Notify parent of changes for live preview sync
      if (onOptionsChange) {
        onOptionsChange(newOptions);
      }
      
      return newOptions;
    });
  };

  const handleExportClick = (format: 'pdf' | 'word') => {
    setPendingFormat(format);
    setShowValidationModal(true);
  };

  const handleProceedWithExport = () => {
    if (!pendingFormat) return;

    // Log the options being used for export
    console.log('🟢 EXPORT SETTINGS - OPTIONS TO USE:', {
      fontFamily: options.fontFamily,
      nameSize: options.nameSize,
      bodyTextSize: options.bodyTextSize,
      sectionHeaderSize: options.sectionHeaderSize,
      paperSize: options.paperSize
    });

    try {
      // Pass the current options directly to onExport
      onExport(options, pendingFormat);
      setStatusMessage(`${pendingFormat.toUpperCase()} export initiated successfully!`);
      setShowValidationModal(false);
      setPendingFormat(null);
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error during export:', error);
      setStatusMessage(`Error initiating ${pendingFormat.toUpperCase()} export. Please try again.`);
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    }
  };

  const fontFamilies = [ 'Times New Roman', 'Arial', 'Verdana', 'Georgia','Calibri'];

  const containerGrid = showInlinePreview ? 'grid grid-cols-1 lg:grid-cols-2' : 'grid grid-cols-1';

  return (
    <div className={`${containerGrid} gap-6 h-full`}>
      {/* Left Side - Controls */}
      <div className="space-y-6 overflow-y-auto">
        {/* Resume Template Selection */}
        <div className="card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
            <Layout className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-400" />
            Resume Template
          </h3>
          
          {/* Layout Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">Layout Type</label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(layoutConfigs)
                .filter(([key]) => key === 'standard')
                .map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleOptionChange('layoutType', key as LayoutType)}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all bg-slate-800/50 ${
                    options.layoutType === key
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700/50 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="w-20 h-28 bg-slate-700/50 rounded mb-2 flex items-center justify-center text-xs text-slate-400">
                    {config.name}
                  </div>
                  <span className="font-medium text-sm text-white">{config.name}</span>
                  <span className="text-xs text-slate-400 text-center">{config.description}</span>
                  {config.recommended && (
                    <div className="mt-2 flex items-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                      <span className="text-xs text-emerald-400 font-medium">★ ATS Optimized</span>
                    </div>
                  )}
                </button>
              ))}

            </div>
          </div>

          {/* Paper Size Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Paper Size</label>
            <div className="space-y-2">
              {Object.entries(paperSizeConfigs).map(([key, config]) => (
                <label key={key} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paperSize"
                    value={key}
                    checked={options.paperSize === key}
                    onChange={(e) => handleOptionChange('paperSize', e.target.value as PaperSize)}
                    className="form-radio h-4 w-4 text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-600"
                  />
                  <span className="ml-3 text-sm text-slate-300">{config.name}</span>
                  {key === 'a4' && (
                    <div className="ml-2 flex items-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                      <span className="text-xs text-emerald-400 font-medium">★ Recommended</span>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Font Settings */}
        <div className="card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
            <Type className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-violet-400" />
            Font
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Font Family</label>
              <select
                value={options.fontFamily}
                onChange={(e) => handleOptionChange('fontFamily', e.target.value)}
                className="input-base"
              >
                {fontFamilies.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input
                  type="number"
                  value={options.nameSize}
                  onChange={(e) => handleOptionChange('nameSize', parseFloat(e.target.value))}
                  className="input-base"
                  min="16" max="30" step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Section Headers</label>
                <input
                  type="number"
                  value={options.sectionHeaderSize}
                  onChange={(e) => handleOptionChange('sectionHeaderSize', parseFloat(e.target.value))}
                  className="input-base"
                  min="8" max="14" step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sub-Headers</label>
                <input
                  type="number"
                  value={options.subHeaderSize}
                  onChange={(e) => handleOptionChange('subHeaderSize', parseFloat(e.target.value))}
                  className="input-base"
                  min="8" max="12" step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Body Text</label>
                <input
                  type="number"
                  value={options.bodyTextSize}
                  onChange={(e) => handleOptionChange('bodyTextSize', parseFloat(e.target.value))}
                  className="input-base"
                  min="8" max="12" step="0.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Spacing & Margin Settings */}
        <div className="card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
            <Ruler className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-cyan-400" />
            Spacing & Margins
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Section Spacing</label>
              <input
                type="range"
                value={options.sectionSpacing}
                onChange={(e) => handleOptionChange('sectionSpacing', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                min="0" max="10" step="0.5"
              />
              <div className="text-right text-sm text-slate-400">{options.sectionSpacing} mm</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Entry Spacing</label>
              <input
                type="range"
                value={options.entrySpacing}
                onChange={(e) => handleOptionChange('entrySpacing', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                min="0" max="5" step="0.25"
              />
              <div className="text-right text-sm text-slate-400">{options.entrySpacing} mm</div>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="card-surface p-4">
          <div className="space-y-4">
            <button
              onClick={() => handleExportClick('pdf')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <FileText className="w-5 h-5" />
              <span>Download by PDF</span>
            </button>

            <button
              onClick={() => handleExportClick('word')}
              className="w-full btn-primary py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-neon-cyan"
            >
              <FileText className="w-5 h-5" />
              <span>Download by Word(.docx)</span>
            </button>
          </div>

          {/* Export Status Message */}
          {statusMessage && (
            <div className={`mt-4 p-3 rounded-lg border transition-all ${
              statusMessage.includes('Error') 
                ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300' 
                : 'bg-green-50 border-green-200 text-green-800 dark:bg-neon-cyan-500/10 dark:border-neon-cyan-400/50 dark:text-neon-cyan-300'
            }`}>
              <div className="flex items-center">
                {statusMessage.includes('Error') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                <span className="text-sm font-medium">{statusMessage}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Live Preview (optional) */}
      {showInlinePreview && (
        <div className="bg-slate-800/50 rounded-xl p-4 h-full flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Layout className="w-5 h-5 mr-2 text-emerald-400" />
            Live Preview
          </h3>
          <div className="flex-1 bg-slate-800/20 rounded-lg border border-slate-700/50 flex items-center justify-center p-4" style={{ minHeight: '500px' }}>
            <div className="transform-gpu" style={{ transform: 'scale(0.5)', transformOrigin: 'top center' }}>
              <ResumePreview
                resumeData={resumeData}
                userType={userType}
                exportOptions={options}
                showControls={false}
                defaultZoom={0.98}
              />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 text-center">
            Preview updates as you change settings
          </div>
        </div>
      )}

      <ATSExportValidationModal
        isOpen={showValidationModal}
        onClose={() => {
          setShowValidationModal(false);
          setPendingFormat(null);
        }}
        onProceed={handleProceedWithExport}
        resumeData={resumeData}
        exportOptions={options}
        format={pendingFormat || 'pdf'}
      />
    </div>
  );
};
