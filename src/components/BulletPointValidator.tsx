import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface BulletPointValidatorProps {
  text: string;
  maxLength?: number;
  onChange?: (newText: string) => void;
}

export const BulletPointValidator: React.FC<BulletPointValidatorProps> = ({
  text,
  maxLength = 120,
  onChange
}) => {
  const textLength = text.length;
  const isValid = textLength <= maxLength;
  const percentage = (textLength / maxLength) * 100;

  const getColorClass = () => {
    if (percentage <= 80) return 'text-green-600 dark:text-green-400';
    if (percentage <= 100) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBarColorClass = () => {
    if (percentage <= 80) return 'bg-green-500';
    if (percentage <= 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const suggestShorterVersion = (text: string): string | null => {
    if (text.length <= maxLength) return null;

    const commonReplacements = [
      { long: 'implemented', short: 'built' },
      { long: 'developed', short: 'created' },
      { long: 'responsible for', short: 'managed' },
      { long: 'in order to', short: 'to' },
      { long: 'as well as', short: 'and' },
      { long: 'in addition to', short: 'plus' },
      { long: 'a number of', short: 'several' },
      { long: 'due to the fact that', short: 'because' },
      { long: 'for the purpose of', short: 'to' },
      { long: 'in the event that', short: 'if' },
      { long: 'with the exception of', short: 'except' }
    ];

    let shortened = text;
    for (const { long, short } of commonReplacements) {
      const regex = new RegExp(long, 'gi');
      shortened = shortened.replace(regex, short);
    }

    shortened = shortened
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*\.\s*/g, '. ')
      .trim();

    if (shortened.length < text.length && shortened.length <= maxLength) {
      return shortened;
    }

    return null;
  };

  const suggestion = !isValid ? suggestShorterVersion(text) : null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          {isValid ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-xs font-medium ${getColorClass()}`}>
            {textLength}/{maxLength} characters
          </span>
        </div>
        {!isValid && (
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
            Exceeds ATS limit by {textLength - maxLength}
          </span>
        )}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-dark-300">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${getBarColorClass()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {!isValid && (
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/50 rounded text-xs">
          <p className="text-yellow-800 dark:text-yellow-300 font-medium mb-1">
            ATS Warning: This bullet point may be truncated
          </p>
          <p className="text-yellow-700 dark:text-yellow-400 mb-2">
            Most ATS systems cut off text after 120 characters. Consider shortening to ensure full visibility.
          </p>
          {suggestion && onChange && (
            <div>
              <p className="text-yellow-800 dark:text-yellow-300 font-medium mb-1">Suggested shorter version:</p>
              <div className="bg-white dark:bg-dark-200 p-2 rounded mb-2 border border-yellow-300 dark:border-yellow-500/30">
                <p className="text-gray-900 dark:text-gray-100">{suggestion}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {suggestion.length} characters
                </p>
              </div>
              <button
                onClick={() => onChange(suggestion)}
                className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition-colors"
              >
                Apply Suggestion
              </button>
            </div>
          )}
        </div>
      )}

      {isValid && percentage > 80 && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          Close to limit. Consider shortening for safety.
        </p>
      )}
    </div>
  );
};

export const validateBulletPoints = (resumeData: any): { total: number; invalid: number; issues: string[] } => {
  let total = 0;
  let invalid = 0;
  const issues: string[] = [];

  const checkBullets = (bullets: any[], context: string) => {
    bullets?.forEach((bullet, index) => {
      total++;
      const text = typeof bullet === 'string' ? bullet : bullet?.description || bullet?.text || '';
      if (text.length > 120) {
        invalid++;
        issues.push(`${context} - Bullet ${index + 1}: ${text.length} characters (exceeds 120)`);
      }
    });
  };

  resumeData.workExperience?.forEach((job: any, jobIndex: number) => {
    checkBullets(job.bullets, `Work Experience - ${job.role || `Job ${jobIndex + 1}`}`);
  });

  resumeData.projects?.forEach((project: any, projectIndex: number) => {
    checkBullets(project.bullets, `Project - ${project.title || `Project ${projectIndex + 1}`}`);
  });

  return { total, invalid, issues };
};
