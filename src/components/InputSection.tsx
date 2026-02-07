import React from 'react';
import { FileText, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';

interface InputSectionProps {
  resumeText: string;
  jobDescription: string;
  onResumeChange: (value: string) => void;
  onJobDescriptionChange: (value: string) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  resumeText,
  jobDescription,
  onResumeChange,
  onJobDescriptionChange,
}) => {
  const isJobDescriptionValid = jobDescription.length >= 250;

  return (
    <div className="space-y-6">
      {/* Resume Text Section */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-semibold text-slate-200">Resume Content</h3>
          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs rounded-full font-medium">
            Required
          </span>
        </div>
        <textarea
          value={resumeText}
          onChange={(e) => onResumeChange(e.target.value)}
          placeholder="Your resume content will appear here after uploading a file, or you can type/paste it directly..."
          className="input-base h-40 resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-slate-500">
            {resumeText.length.toLocaleString()} characters
          </div>
          {resumeText.length > 0 && (
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <CheckCircle className="w-3 h-3" />
              Content loaded
            </div>
          )}
        </div>
      </div>

      {/* Job Description Section */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-slate-200">Target Job Description</h3>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full font-medium">
            Required
          </span>
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="Paste the complete job description here. Enter a minimum of 250 characters for best optimization results..."
          className="input-base h-40 resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <div className={`text-xs ${isJobDescriptionValid ? 'text-slate-500' : 'text-amber-400'}`}>
            {jobDescription.length.toLocaleString()} / 250 characters minimum
          </div>
          {isJobDescriptionValid && (
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <CheckCircle className="w-3 h-3" />
              Job details added
            </div>
          )}
        </div>
      </div>

      {/* Help Tips */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-slate-200 mb-2">💡 Tips for better optimization:</p>
            <ul className="text-slate-400 space-y-1 list-disc list-inside">
              <li>Include the complete job posting with requirements and responsibilities</li>
              <li>Make sure your resume content is comprehensive and up-to-date</li>
              <li>The more detailed the job description, the better the optimization</li>
              <li>Include specific skills, technologies, and qualifications mentioned in the job</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
