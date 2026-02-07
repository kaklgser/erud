import React, { useRef, useState, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, X, Sparkles, Quote, CreditCard } from 'lucide-react';
import { ExtractionResult } from '../types/resume';
import { parseResumeFromFile, ParsedResume } from '../services/edenResumeParserService';
import { paymentService } from '../services/paymentService';

// ATS Tips/Quotes for resume parsing
const ATS_PARSING_QUOTES = [
  "ATS scans your resume in seconds — make every keyword count!",
  "75% of resumes are rejected by ATS before a human sees them.",
  "Simple formatting = Higher ATS compatibility.",
  "Keywords from the job description boost your ATS score significantly.",
  "Avoid tables and graphics — ATS can't read them properly.",
  "Use standard section headings like 'Experience' and 'Education'.",
  "PDF and DOCX are the safest formats for ATS systems.",
  "Quantify your achievements — numbers catch both ATS and recruiters' attention.",
  "Tailor your resume for each job to maximize ATS match.",
  "Action verbs like 'Developed', 'Led', 'Optimized' improve ATS scoring.",
  "Your resume's first 6 seconds determine if you get shortlisted.",
  "Include both acronyms and full forms (e.g., 'SEO' and 'Search Engine Optimization').",
  "ATS ranks resumes by keyword density and relevance.",
  "A clean, single-column layout is ATS-friendly.",
  "Skills section should mirror the job description's requirements."
];

interface FileUploadProps {
  onFileUpload: (result: ExtractionResult, file?: File) => void;
  onParsedResume?: (parsedResume: ParsedResume | null) => void;
  isAuthenticated?: boolean;
  onShowAuth?: () => void;
  requireAuth?: boolean;
  // NEW: Payment check on upload
  userId?: string;
  creditType?: 'optimization' | 'score_check'; // Which credit type to check
  onShowSubscriptionPlans?: (featureId?: string) => void;
  onShowSubscriptionPlansDirectly?: () => void; // Direct subscription plans (skip plan selection modal)
  onCreditCheckPassed?: () => void; // Callback when credits are available - auto-trigger optimization
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onParsedResume,
  isAuthenticated = true,
  onShowAuth,
  requireAuth = false,
  userId,
  creditType = 'optimization',
  onShowSubscriptionPlans,
  onCreditCheckPassed,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [creditCheckPending, setCreditCheckPending] = useState(false);

  // Rotate ATS quotes every 3 seconds during upload
  useEffect(() => {
    if (!isUploading) return;
    
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % ATS_PARSING_QUOTES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isUploading]);

  // Check if user has credits available
  const checkCreditsAvailable = async (): Promise<boolean> => {
    if (!userId) {
      return true; // Skip credit check if no userId provided
    }
    
    try {
      const subscription = await paymentService.getUserSubscription(userId);
      
      if (creditType === 'optimization') {
        const subscriptionCredits = subscription 
          ? subscription.optimizationsTotal - subscription.optimizationsUsed 
          : 0;
        const addOnCredits = await paymentService.getAddOnCreditsByType(userId, 'optimization');
        const totalCredits = Math.max(0, subscriptionCredits) + addOnCredits;
        return totalCredits > 0;
      } else if (creditType === 'score_check') {
        const subscriptionCredits = subscription 
          ? subscription.scoreChecksTotal - subscription.scoreChecksUsed 
          : 0;
        const addOnCredits = await paymentService.getAddOnCreditsByType(userId, 'score_check');
        const totalCredits = Math.max(0, subscriptionCredits) + addOnCredits;
        return totalCredits > 0;
      }
      
      return true;
    } catch (error) {
      console.error('[FileUpload] Error checking credits:', error);
      return false;
    }
  };

  // Check credits BEFORE allowing upload
  const checkCreditsBeforeUpload = async (): Promise<boolean> => {
    // If userId is not provided, check if we should require it
    if (!userId) {
      // If requireAuth is true and user is not authenticated, show auth modal
      if (requireAuth && !isAuthenticated) {
        if (onShowAuth) onShowAuth();
        return false;
      }
      // If onShowSubscriptionPlans is provided, we need userId for credit check
      if (onShowSubscriptionPlans) {
        if (onShowAuth) onShowAuth();
        return false;
      }
      // No credit check needed - allow upload
      return true;
    }
    
    if (!onShowSubscriptionPlans) {
      return true; // Allow if no plans callback (credit check not configured)
    }
    
    setCreditCheckPending(true);
    const hasCredits = await checkCreditsAvailable();
    setCreditCheckPending(false);
    
    if (!hasCredits) {
      setShowCreditPopup(true);
      return false;
    }
    
    return true;
  };

  // Check authentication and credits before processing
  const checkAuthAndProcess = async (file: File) => {
    if (requireAuth && !isAuthenticated) {
      if (onShowAuth) {
        onShowAuth();
      }
      return false;
    }
    await processFile(file);
    return true;
  };

  // Handle click on upload area - check credits first
  const handleUploadClick = async () => {
    if (isUploading || uploadedFile) {
      return;
    }
    
    // Check authentication first
    if (requireAuth && !isAuthenticated) {
      if (onShowAuth) onShowAuth();
      return;
    }
    
    // Check credits BEFORE allowing file selection
    const hasCredits = await checkCreditsBeforeUpload();
    if (!hasCredits) {
      return; // Block upload if no credits
    }
    
    // Credits available - allow file selection
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    await checkAuthAndProcess(file);
  };

  // Process file using EdenAI parser ONLY
  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setParseSuccess(false);

    try {
      // Use EdenAI parser directly
      const parsedResume = await parseResumeFromFile(file);

      // Create ExtractionResult from parsed text
      const extractionResult: ExtractionResult = {
        text: parsedResume.parsedText,
        extraction_mode: 'TEXT',
        trimmed: false,
        filename: file.name,
      };

      onFileUpload(extractionResult, file);
      if (onParsedResume) {
        onParsedResume(parsedResume);
      }

      setUploadedFile(file.name);
      setParseSuccess(true);

      // Credits were already checked before upload - trigger callback if provided
      if (onCreditCheckPassed) {
        onCreditCheckPassed();
      }
    } catch (error: any) {
      console.error('❌ EdenAI parsing failed:', error);
      setUploadError(
        error.message || 'Failed to parse resume. Please try again or use a different file.'
      );
      setUploadedFile(null);
      onFileUpload({ text: '', extraction_mode: 'TEXT', trimmed: false });
      if (onParsedResume) onParsedResume(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;
    
    // Check authentication first
    if (requireAuth && !isAuthenticated) {
      if (onShowAuth) onShowAuth();
      return;
    }
    
    // Check credits BEFORE processing dropped file
    const hasCredits = await checkCreditsBeforeUpload();
    if (!hasCredits) {
      return; // Block upload if no credits
    }
    
    setUploadError(null);
    await checkAuthAndProcess(file);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setUploadError(null);
    setParseSuccess(false);
    onFileUpload({ text: '', extraction_mode: 'TEXT', trimmed: false });
    if (onParsedResume) onParsedResume(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTryAgain = () => {
    clearFile();
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isUploading
            ? 'border-emerald-400 bg-emerald-500/5 cursor-wait'
            : uploadError
              ? 'border-red-400 bg-red-500/5 cursor-pointer'
              : uploadedFile
                ? 'border-emerald-400 bg-emerald-500/5'
                : isDragging
                  ? 'border-cyan-400 bg-cyan-500/5 cursor-pointer'
                  : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50 hover:bg-slate-800/50 cursor-pointer'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        {isUploading ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-base font-medium text-slate-200 mb-1">AI parsing your resume...</p>
            <p className="text-sm text-slate-400 mb-4">Extracting structured data from your resume</p>
            
            {/* ATS Quote */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 max-w-sm transition-all duration-300">
              <Quote className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-amber-300 text-xs italic text-center">
                "{ATS_PARSING_QUOTES[currentQuoteIndex]}"
              </p>
            </div>
          </div>
        ) : uploadError ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-base font-medium text-red-300 mb-1">Parsing Failed</p>
            <p className="text-sm text-red-400/80 mb-4 max-w-sm">{uploadError}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTryAgain();
              }}
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors px-4 py-2 rounded-lg hover:bg-emerald-500/10"
            >
              <span>Try again</span>
            </button>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 shadow-emerald-glow">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-base font-medium text-emerald-300 mb-1">
              Resume parsed successfully!
            </p>
           <p className="text-sm text-slate-400 mb-2 truncate max-w-[200px] sm:max-w-xs text-center px-2">{uploadedFile}</p>


            {parseSuccess && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs mb-3">
                <Sparkles className="w-3 h-3" />
                <span>AI-powered structured extraction complete</span>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 font-medium text-sm transition-colors px-4 py-2 rounded-lg hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
              <span>Remove</span>
            </button>
          </div>
        ) : creditCheckPending ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-base font-medium text-slate-200 mb-1">Checking credits...</p>
            <p className="text-sm text-slate-400">Please wait</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
                isDragging ? 'bg-cyan-500/20' : 'bg-slate-700/50'
              }`}
            >
              <Upload
                className={`w-7 h-7 transition-colors ${
                  isDragging ? 'text-cyan-400' : 'text-slate-400'
                }`}
              />
            </div>
            <p className="text-base font-medium text-slate-200 mb-1">
              {isDragging ? 'Drop your file here' : 'Upload your resume'}
            </p>
            <p className="text-sm text-slate-400">
              Drag and drop your file here, or click to browse
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Supported File Formats Info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-slate-200 mb-2">AI-Powered Resume Parsing</p>
            <p className="text-slate-400 text-xs mb-3">
              Our AI parser extracts structured data including contact info, experience,
              education, skills, and projects.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>PDF files (.pdf)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Word documents (.docx)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span>Text files (.txt)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Check Popup */}
      {showCreditPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-100 text-center mb-2">
              {creditType === 'optimization' ? 'Optimization Credits Required' : 'Score Check Credits Required'}
            </h3>
            <p className="text-slate-400 text-center mb-6">
              {creditType === 'optimization' 
                ? 'You need credits to optimize your resume against the job description. Get credits to unlock AI-powered optimization.'
                : 'You need credits to check your resume score. Get credits to see your ATS compatibility score.'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowCreditPopup(false);
                  if (onShowSubscriptionPlans) {
                    onShowSubscriptionPlans(creditType === 'optimization' ? 'jd-optimizer' : 'score-checker');
                  }
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Get Credits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
