// src/components/ResumePreview.tsx

import React, { useRef, useEffect, useState } from 'react';
import { ResumeData, UserType } from '../types/resume';
import { ExportOptions, defaultExportOptions, layoutConfigs } from '../types/export';
import { LiveResumePreviewControls } from './LiveResumePreviewControls';


// ---------- Helper Functions (replicated from exportUtils.ts for consistency) ----------
const mmToPx = (mm: number) => mm * 3.779528; // 1mm = 3.779528px at 96 DPI
const ptToPx = (pt: number) => pt * 1.333; // 1pt = 1.333px at 96 DPI

// Replicate PDF_CONFIG creation logic from exportUtils.ts
const createPDFConfigForPreview = (options: ExportOptions) => {
  // Use layout configs from export types
  const layoutConfig = layoutConfigs[options.layoutType] || layoutConfigs.standard;

  const paperConfig = options.paperSize === 'letter' ?
    { pageWidth: 216, pageHeight: 279 } :
    { pageWidth: 210, pageHeight: 297 };

  return {
    pageWidth: paperConfig.pageWidth,
    pageHeight: paperConfig.pageHeight,
    margins: layoutConfig.margins,
    get contentWidth() {
      return this.pageWidth - this.margins.left - this.margins.right;
    },
    get contentHeight() {
      return this.pageHeight - this.margins.top - this.margins.bottom;
    },
    fonts: {
      name: { size: options.nameSize, weight: 'bold' as const },
      contact: { size: options.bodyTextSize - 0.5, weight: 'normal' as const },
      sectionTitle: { size: options.sectionHeaderSize, weight: 'bold' as const },
      jobTitle: { size: options.subHeaderSize, weight: 'bold' as const },
      company: { size: options.subHeaderSize, weight: 'normal' as const }, // Changed to normal
      year: { size: options.subHeaderSize, weight: 'normal' as const }, // Changed to normal
      body: { size: options.bodyTextSize, weight: 'normal' as const },
    },
    spacing: {
      nameFromTop: 10, // Changed from 13 to 10
      afterName: 0,
      afterContact: 2, // Changed from 1 to 2
      sectionSpacingBefore: options.sectionSpacing,
      sectionSpacingAfter: 2,
      bulletListSpacing: 0.5, // Changed from options.entrySpacing * 0.3 to 0.5
      afterSubsection: 3,
      lineHeight: 1.2,
      bulletIndent: 5, // Changed from 4 to 5
      entrySpacing: options.entrySpacing,
    },
    colors: {
      primary: [0, 0, 0] as [number, number, number],
      secondary: [80, 80, 80] as [number, number, number],
      accent: [37, 99, 235] as [number, number, number],
    },
    fontFamily: options.fontFamily,
  };
};

interface ResumePreviewProps {
  resumeData: ResumeData;
  userType?: UserType;
  exportOptions?: ExportOptions;
  showControls?: boolean;
  onScaleChange?: (scale: number) => void;
  defaultZoom?: number;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resumeData,
  userType = 'experienced',
  exportOptions,
  showControls = false,
  onScaleChange,
  defaultZoom = 0.98
}) => {
  // Use defaultExportOptions if exportOptions is not provided
  const currentExportOptions = exportOptions || defaultExportOptions;
  const PDF_CONFIG = createPDFConfigForPreview(currentExportOptions);

  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const resumeContentRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(defaultZoom);
  const [autoScaleFactor, setAutoScaleFactor] = useState(defaultZoom);
  const [isScaling, setIsScaling] = useState(true);
  const [manualZoom, setManualZoom] = useState(false);

  useEffect(() => {
    const calculateScale = () => {
      if (contentWrapperRef.current && !manualZoom) {
        const containerWidth = contentWrapperRef.current.offsetWidth;
        const containerHeight = contentWrapperRef.current.offsetHeight;
        const resumeNaturalWidthPx = mmToPx(PDF_CONFIG.pageWidth);
        const resumeNaturalHeightPx = mmToPx(PDF_CONFIG.pageHeight);

        // Calculate available space with minimal padding
        const availableWidth = containerWidth - 40;
        const availableHeight = containerHeight - 40;

        // Calculate scale factors for both width and height
        const scaleX = availableWidth / resumeNaturalWidthPx;
        const scaleY = availableHeight / resumeNaturalHeightPx;

        // Use the smaller scale factor with defaultZoom multiplier for optimal fit
        const optimalScale = Math.min(scaleX, scaleY) * defaultZoom;

        // Allow scaling down but prevent scaling up beyond original size
        const finalScale = Math.min(optimalScale, 1);

        setAutoScaleFactor(finalScale);
        setScaleFactor(finalScale);
        setIsScaling(false);

        if (onScaleChange) {
          onScaleChange(finalScale);
        }
      }
    };

    setIsScaling(true);
    calculateScale();

    const timeoutId = setTimeout(calculateScale, 150);

    window.addEventListener('resize', calculateScale);
    return () => {
      window.removeEventListener('resize', calculateScale);
      clearTimeout(timeoutId);
    };
  }, [PDF_CONFIG.pageWidth, PDF_CONFIG.pageHeight, resumeData, manualZoom, onScaleChange]);

  // Zoom control handlers
  const handleZoomIn = () => {
    setManualZoom(true);
    const newScale = Math.min(scaleFactor + 0.1, 1.5);
    setScaleFactor(newScale);
    if (onScaleChange) {
      onScaleChange(newScale);
    }
  };

  const handleZoomOut = () => {
    setManualZoom(true);
    const newScale = Math.max(scaleFactor - 0.1, 0.3);
    setScaleFactor(newScale);
    if (onScaleChange) {
      onScaleChange(newScale);
    }
  };

  const handleResetZoom = () => {
    setManualZoom(false);
    setScaleFactor(autoScaleFactor);
    if (onScaleChange) {
      onScaleChange(autoScaleFactor);
    }
  };


  // Debug logging to check what data we're receiving
  console.log('ResumePreview received data:', resumeData);

  // Add validation to ensure we have valid resume data
  if (!resumeData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-gray-500 mb-4">No resume data available</div>
          <div className="text-sm text-gray-400">Please ensure your resume has been properly optimized</div>
        </div>
      </div>
    );
  }

  // Ensure we have at least a name to display
  if (!resumeData.name || resumeData.name.trim() === '') {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-gray-500 mb-4">Start building your resume!</div>
          <div className="text-sm text-gray-400">Fill in your details on the left to generate a live preview here</div>
        </div>
      </div>
    );
  }

  // --- Style constants ---
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: ptToPx(PDF_CONFIG.fonts.sectionTitle.size),
    fontWeight: 'bold',
    marginTop: mmToPx(PDF_CONFIG.spacing.sectionSpacingBefore),
    marginBottom: mmToPx(PDF_CONFIG.spacing.sectionSpacingAfter),
    fontFamily: `${PDF_CONFIG.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif`,
    letterSpacing: '0.5pt',
    textTransform: 'none',
    color: '#000000',
  } as const;

  const sectionUnderlineStyle: React.CSSProperties = {
    borderBottomWidth: '0.5pt',
    borderColor: '#404040',
    height: '1px',
    marginBottom: mmToPx(PDF_CONFIG.spacing.sectionSpacingAfter),
    width: '100%',
    maxWidth: `${mmToPx(PDF_CONFIG.contentWidth)}px`,
    margin: '0 auto',
    boxSizing: 'border-box',
  };

  const bodyTextStyle: React.CSSProperties = {
    fontSize: ptToPx(PDF_CONFIG.fonts.body.size),
    fontFamily: `${PDF_CONFIG.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif`,
    lineHeight: PDF_CONFIG.spacing.lineHeight,
    color: '#000000',
  };

  const listItemStyle: React.CSSProperties = {
    ...bodyTextStyle,
    marginBottom: mmToPx(PDF_CONFIG.spacing.entrySpacing * 0.25),
    display: 'flex',
    alignItems: 'flex-start',
  };

  // Helper to get short display text from URLs
  const getShortLinkText = (url: string, type: 'linkedin' | 'github'): string => {
    if (!url) return '';
    const cleanUrl = url.trim().toLowerCase();
    
    if (type === 'linkedin') {
      const linkedinMatch = cleanUrl.match(/linkedin\.com\/in\/([^\/\?]+)/i);
      if (linkedinMatch) {
        return `linkedin.com/in/${linkedinMatch[1]}`;
      }
      return 'LinkedIn';
    }
    
    if (type === 'github') {
      const githubMatch = cleanUrl.match(/github\.com\/([^\/\?]+)/i);
      if (githubMatch) {
        return `github.com/${githubMatch[1]}`;
      }
      return 'GitHub';
    }
    
    return url;
  };

  // Build contact information - two lines for better structure
  const buildContactInfo = () => {
    const isValidField = (field?: string | null, fieldType: 'phone' | 'email' | 'url' | 'text' = 'text'): boolean => {
      if (!field || field.trim() === '') return false;
      const lower = field.trim().toLowerCase();
      const invalidValues = ['n/a', 'not specified', 'none'];
      if (invalidValues.includes(lower)) return false;
      
      switch (fieldType) {
        case 'phone': {
          const digitCount = (field.match(/\d/g) || []).length;
          return digitCount >= 7 && digitCount <= 15;
        }
        case 'email':
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field);
        case 'url':
          return /^https?:\/\//.test(field) ||
                 /^(www\.)?linkedin\.com\/in\//.test(field) ||
                 /^(www\.)?github\.com\//.test(field) ||
                 /linkedin\.com\/in\//.test(field) ||
                 /github\.com\//.test(field);
        case 'text':
        default:
          return true;
      }
    };

    // Contact style - bold
    const contactStyle: React.CSSProperties = {
      fontSize: ptToPx(PDF_CONFIG.fonts.contact.size),
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };

    // Link style - bold
    const linkStyle: React.CSSProperties = {
      ...contactStyle,
      color: '#1a365d',
      textDecoration: 'none',
      cursor: 'pointer',
    };

    // Line 1: Phone, Email, Location
    const line1Parts: React.ReactNode[] = [];
    // Line 2: LinkedIn, GitHub
    const line2Parts: React.ReactNode[] = [];

    if (isValidField(resumeData.phone, 'phone')) {
      line1Parts.push(
        <a key="phone" href={`tel:${resumeData.phone}`} style={linkStyle} target="_blank" rel="noopener noreferrer">
          {resumeData.phone}
        </a>
      );
    }
    if (isValidField(resumeData.email, 'email')) {
      line1Parts.push(
        <a key="email" href={`mailto:${resumeData.email}`} style={{...linkStyle, maxWidth: '200px'}} target="_blank" rel="noopener noreferrer">
          {resumeData.email}
        </a>
      );
    }
    if (isValidField(resumeData.location, 'text')) {
      line1Parts.push(
        <span key="location" style={contactStyle}>
          {resumeData.location}
        </span>
      );
    }
    if (isValidField(resumeData.linkedin, 'url')) {
      let linkedinUrl = resumeData.linkedin!;
      if (!linkedinUrl.startsWith('http')) {
        linkedinUrl = `https://${linkedinUrl}`;
      }
      const shortText = getShortLinkText(resumeData.linkedin!, 'linkedin');
      line2Parts.push(
        <a key="linkedin" href={linkedinUrl} style={{...linkStyle, maxWidth: '200px'}} target="_blank" rel="noopener noreferrer">
          {shortText}
        </a>
      );
    }
    if (isValidField(resumeData.github, 'url')) {
      let githubUrl = resumeData.github!;
      if (!githubUrl.startsWith('http')) {
        githubUrl = `https://${githubUrl}`;
      }
      const shortText = getShortLinkText(resumeData.github!, 'github');
      line2Parts.push(
        <a key="github" href={githubUrl} style={{...linkStyle, maxWidth: '200px'}} target="_blank" rel="noopener noreferrer">
          {shortText}
        </a>
      );
    }

    const renderLine = (parts: React.ReactNode[]) => parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && (
          <span style={{
            fontSize: ptToPx(PDF_CONFIG.fonts.contact.size),
            fontWeight: 'bold',
            margin: '0 4px',
            flexShrink: 0,
          }}>
            |
          </span>
        )}
      </React.Fragment>
    ));

    return { line1: renderLine(line1Parts), line2: renderLine(line2Parts), hasLine2: line2Parts.length > 0 };
  };

  const contactInfo = buildContactInfo();


  const isPlaceholderText = (s?: string): boolean => {
    if (!s) return true;
    const v = s.trim().toLowerCase();
    return v === '' || v === 'n/a' || v === 'none' || v === 'not specified' || v === 'not provided' || v === 'available upon request';
  };
  // Helper to safely extract text from possibly nested objects
  const toPlainText = (value: any): string => {
    if (typeof value === 'string') return value.trim();
    if (value == null) return '';
    if (typeof value === 'object') {
      const candidates = ['text', 'name', 'title', 'value'];
      for (const key of candidates) {
        const v = (value as any)[key];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return '';
    }
    return String(value);
  };

  const getSectionOrder = () => {
    if (userType === 'experienced') {
      return ['summary', 'skills', 'workExperience', 'projects', 'education', 'certifications', 'additionalSections'];
    } else if (userType === 'student') {
      return ['careerObjective', 'education', 'skills', 'projects', 'workExperience', 'certifications', 'achievementsAndExtras', 'additionalSections'];
    } else { // 'fresher'
      return ['careerObjective', 'skills', 'workExperience', 'projects', 'education', 'certifications', 'achievementsAndExtras', 'additionalSections'];
    }
  };

  const sectionOrder = getSectionOrder();
  const getEffectiveCerts = (data: any): any[] => {
    const primary = Array.isArray(data?.certifications) ? data.certifications : [];
    if (primary && primary.length > 0) return primary;
    const fromAdditional = (data?.additionalSections || [])
      .filter((sec: any) => typeof sec?.title === 'string' && /cert|licen/i.test(sec.title))
      .flatMap((sec: any) => Array.isArray(sec?.bullets) ? sec.bullets : [])
      .filter((b: any) => typeof b === 'string' && b.trim().length > 0);
    if (fromAdditional.length > 0) return fromAdditional;
    const fromSkills = (data?.skills || [])
      .filter((cat: any) => typeof cat?.category === 'string' && /cert|licen/i.test(cat.category))
      .flatMap((cat: any) => Array.isArray(cat?.list) ? cat.list : [])
      .filter((b: any) => typeof b === 'string' && b.trim().length > 0);
    if (fromSkills.length > 0) return fromSkills;
    return [];
  };

  const renderSection = (sectionName: string) => {
    switch (sectionName) {
      case 'careerObjective':
        if (!String(resumeData.careerObjective || '').trim()) return null;
        return (
          <div style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.sectionSpacingAfter) }}>
            <h2 style={sectionTitleStyle}>Career Objective</h2>
            <div style={sectionUnderlineStyle}></div>
            <p style={{ ...bodyTextStyle, marginBottom: mmToPx(PDF_CONFIG.spacing.entrySpacing) }}>
              {resumeData.careerObjective || ''}
            </p>
          </div>
        );

      case 'summary':
        if (!String(resumeData.summary || '').trim()) return null;
        return (
          <div style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.sectionSpacingAfter) }}>
            <h2 style={sectionTitleStyle}>Professional Summary</h2>
            <div style={sectionUnderlineStyle}></div>
            <p style={{ ...bodyTextStyle, marginBottom: mmToPx(PDF_CONFIG.spacing.entrySpacing) }}>
              {resumeData.summary || ''}
            </p>
          </div>
        );

      case 'workExperience':
        if (!resumeData.workExperience || resumeData.workExperience.length === 0) return null;
        return (
          <div style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.sectionSpacingAfter) }}>
            <h2 style={sectionTitleStyle}>
              {userType === 'fresher' || userType === 'student' ? 'Work Experience' : 'Professional Experience'}
            </h2>
            <div style={sectionUnderlineStyle}></div>
            {resumeData.workExperience.map((job, index) => (
              <div key={index} style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.entrySpacing * 2) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: mmToPx(PDF_CONFIG.spacing.entrySpacing * 0.5) }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: ptToPx(PDF_CONFIG.fonts.jobTitle.size), fontWeight: 'bold', fontFamily: `${PDF_CONFIG.fontFamily}, sans-serif` }}>
                      {job.role} | {job.company}{job.location ? `, ${job.location}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: ptToPx(PDF_CONFIG.fonts.year.size), fontFamily: `${PDF_CONFIG.fontFamily}, sans-serif`, fontWeight: 'normal', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                    {job.year}
                  </div>
                </div>
                {job.bullets && job.bullets.length > 0 && (
                  <ul style={{ marginLeft: mmToPx(PDF_CONFIG.spacing.bulletIndent), listStyleType: 'disc', paddingLeft: '0' }}>
                    {job.bullets.map((bullet, bulletIndex) => {
                      // Ensure bullets are always rendered as strings and handle various shapes
                      const bulletObj = (bullet && typeof bullet === 'object') ? (bullet as any) : null;
                      const bulletText = typeof bullet === 'string'
                        ? bullet
                        : bulletObj && (bulletObj.description || bulletObj.title || bulletObj.text)
                          ? (bulletObj.description || bulletObj.title || bulletObj.text)
                          : JSON.stringify(bullet);
                      return (
                        <li key={bulletIndex} style={listItemStyle}>
                          <span>{bulletText}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );

      case 'education':
        if (!resumeData.education || resumeData.education.length === 0) return null;
        return (
          <div style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.sectionSpacingAfter) }}>
            <h2 style={sectionTitleStyle}>Education</h2>
            <div style={sectionUnderlineStyle}></div>
            {resumeData.education.map((edu, index) => (
              <div key={index} style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.entrySpacing * 2) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: ptToPx(PDF_CONFIG.fonts.jobTitle.size), fontWeight: 'bold', fontFamily: `${PDF_CONFIG.fontFamily}, sans-serif` }}>
                      {edu.degree}
                    </div>
                    <div style={{ fontSize: ptToPx(PDF_CONFIG.fonts.company.size), fontWeight: 'normal', fontFamily: `${PDF_CONFIG.fontFamily}, sans-serif` }}>
                      {edu.school}{edu.location ? `, ${edu.location}` : ''}
                    </div>
                    {edu.cgpa && (
                      <div style={{ fontSize: ptToPx(PDF_CONFIG.fonts.body.size), fontFamily: `${PDF_CONFIG.fontFamily}, sans-serif`, color: '#4B5563' }}>
                        CGPA: {edu.cgpa}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: ptToPx(PDF_CONFIG.fonts.year.size), fontFamily: `${PDF_CONFIG.fontFamily}, sans-serif`, fontWeight: 'normal', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                    {edu.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'projects':
        if (!resumeData.projects || resumeData.projects.length === 0) return null;
        return (
          <div style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.sectionSpacingAfter) }}>
            <h2 style={sectionTitleStyle}>
              Projects
            </h2>
            <div style={sectionUnderlineStyle}></div>
            {resumeData.projects.map((project, index) => (
              <div key={index} style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.entrySpacing * 2) }}>
                <div style={{ fontSize: ptToPx(PDF_CONFIG.fonts.jobTitle.size), fontWeight: 'bold', fontFamily: `${PDF_CONFIG.fontFamily}, sans-serif`, marginBottom: mmToPx(PDF_CONFIG.spacing.entrySpacing * 0.5) }}> {/* Already bold */}
                  {project.title}
                </div>
                {project.bullets && project.bullets.length > 0 && (
                  <ul style={{ marginLeft: mmToPx(PDF_CONFIG.spacing.bulletIndent), listStyleType: 'disc' }}> {/* Changed to disc */}
                    {project.bullets.map((bullet, bulletIndex) => {
                      // Ensure bullets are always rendered as strings and handle various shapes
                      const bulletObj = (bullet && typeof bullet === 'object') ? (bullet as any) : null;
                      const bulletText = typeof bullet === 'string'
                        ? bullet
                        : bulletObj && (bulletObj.description || bulletObj.title || bulletObj.text)
                          ? (bulletObj.description || bulletObj.title || bulletObj.text)
                          : JSON.stringify(bullet);
                      return (
                        <li key={bulletIndex} style={listItemStyle}>
                          <span>{bulletText}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );

      case 'skills':
        if (!resumeData.skills || resumeData.skills.length === 0) return null;
        return (
          <div style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.sectionSpacingAfter) }}>
            <h2 style={sectionTitleStyle}>Skills</h2>
            <div style={sectionUnderlineStyle}></div>
            {resumeData.skills.map((skillCategory, index) => (
              <div key={index} style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.entrySpacing * 0.5) }}>
                <span style={{ fontSize: ptToPx(PDF_CONFIG.fonts.body.size), fontFamily: `${PDF_CONFIG.fontFamily}, sans-serif` }}>
                  <strong style={{ fontWeight: 'bold' }}>{skillCategory.category}:</strong>{' '} {/* Already bold */}
                  {skillCategory.list && skillCategory.list.join(', ')}
                </span>
              </div>
            ))}
          </div>
        );

     case 'certifications':
  // ✅ Show this section only if certifications exist
  {
    const certs = getEffectiveCerts(resumeData).filter((c: any) => {
      if (typeof c === 'string') return c.trim().length > 0 && !isPlaceholderText(c);
      const p = toPlainText(c);
      const d = toPlainText(c?.description);
      return (!isPlaceholderText(p) || !isPlaceholderText(d));
    });
    if (certs.length === 0) return null;
    return (
      <div style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.sectionSpacingAfter) }}>
        <h2 style={sectionTitleStyle}>Certifications</h2>
        <div style={sectionUnderlineStyle}></div>
        <ul style={{ marginLeft: mmToPx(PDF_CONFIG.spacing.bulletIndent), listStyleType: 'disc' }}>
          {certs.map((cert, index) => {
            if (!cert) return null;

            // Handle string and object formats gracefully
            if (typeof cert === 'string') {
              return (
                <li key={index} style={listItemStyle}>
                  <span>{cert}</span>
                </li>
              );
            } else if (typeof cert === 'object' && 'title' in cert) {
              const certObj = cert as any;
              const title = toPlainText(certObj.title);
              const description = toPlainText(certObj.description);
              const titleEff = isPlaceholderText(title) ? '' : title;
              const descEff = isPlaceholderText(description) ? '' : description;
              const primary = titleEff || descEff;
              return (
                <li key={index} style={listItemStyle}>
                  <div>
                    {titleEff && (
                      <div style={{ fontWeight: 'bold', marginBottom: mmToPx(1) }}>
                        {titleEff}
                      </div>
                    )}
                    {descEff && descEff !== titleEff && (
                      <div style={{ 
                        fontSize: '10px', 
                        lineHeight: '1.4',
                        color: '#4a5568',
                        marginLeft: mmToPx(2)
                      }}>
                        {descEff}
                      </div>
                    )}
                    {!titleEff && primary && (
                      <div>{primary}</div>
                    )}
                  </div>
                </li>
              );
            } else if (typeof cert === 'object') {
              const primary = toPlainText(cert);
              const desc = toPlainText((cert as any)?.description);
              const text = primary || desc || String(cert);
              return (
                <li key={index} style={listItemStyle}>
                  <span>{text}</span>
                </li>
              );
            } else {
              return (
                <li key={index} style={listItemStyle}>
                  <span>{String(cert)}</span>
                </li>
              );
            }
          })}
        </ul>
      </div>
    );
  }

  // ❌ If no certifications, hide section completely
  

      case 'achievementsAndExtras':
        const hasAchievements = resumeData.achievements && resumeData.achievements.length > 0;

        if (!hasAchievements) return null;

        return (
          <div style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.sectionSpacingAfter) }}>
            <h2 style={sectionTitleStyle}>Achievements</h2>
            <div style={sectionUnderlineStyle}></div>
            {hasAchievements && (
              <div style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.entrySpacing) }}>
                <ul style={{ marginLeft: mmToPx(PDF_CONFIG.spacing.bulletIndent), listStyleType: 'disc' }}>
                  {resumeData.achievements!.map((item, index) => {
                    const itemObj = (item && typeof item === 'object') ? (item as any) : null;
                    const text = typeof item === 'string'
                      ? item
                      : itemObj && (itemObj.title || itemObj.text || itemObj.description)
                        ? (itemObj.title || itemObj.text || itemObj.description)
                        : JSON.stringify(item);
                    return (
                      <li key={index} style={listItemStyle}>
                        <span>{text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );

      case 'additionalSections':
        if (!resumeData.additionalSections || !Array.isArray(resumeData.additionalSections) || resumeData.additionalSections.length === 0) return null;
        return (
          <>
            {resumeData.additionalSections.map((section, sectionIndex) => (
              <div key={sectionIndex} style={{ marginBottom: mmToPx(PDF_CONFIG.spacing.sectionSpacingAfter) }}>
                <h2 style={sectionTitleStyle}>{section.title}</h2>
                <div style={sectionUnderlineStyle}></div>
              {section.bullets && section.bullets.length > 0 && (
  <ul style={{ marginLeft: mmToPx(PDF_CONFIG.spacing.bulletIndent), listStyleType: 'disc' }}>
    {section.bullets.map((bullet: any, bulletIndex: number) => {
      // Handle cases where bullet is a string, object, or other format
      const bulletText =
        typeof bullet === 'string'
          ? bullet
          : bullet && typeof bullet === 'object'
          ? (bullet as any).title || (bullet as any).text || JSON.stringify(bullet)
          : String(bullet);

      return (
        <li key={bulletIndex} style={listItemStyle}>
          <span>{bulletText}</span>
        </li>
      );
    })}
  </ul>
)}

              </div>
            ))}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {showControls && (
        <LiveResumePreviewControls
          scaleFactor={scaleFactor}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetZoom}
          minZoom={0.3}
          maxZoom={1.5}
        />
      )}
      <div
        ref={contentWrapperRef}
        className="flex-1 overflow-auto flex items-start justify-center p-5"
        style={{
          position: 'relative',
          backgroundColor: 'transparent'
        }}
      >
      <div
        ref={resumeContentRef}
        className={`resume-one-column ${currentExportOptions.layoutType === 'compact' ? 'resume-compact' : 'resume-standard'} ${currentExportOptions.paperSize === 'letter' ? 'resume-letter' : 'resume-a4'}`}
        style={{
          fontFamily: `${PDF_CONFIG.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif`,
          fontSize: ptToPx(PDF_CONFIG.fonts.body.size),
          lineHeight: PDF_CONFIG.spacing.lineHeight,
          color: '#000000',
          paddingTop: mmToPx(PDF_CONFIG.margins.top),
          paddingBottom: mmToPx(PDF_CONFIG.margins.bottom),
          paddingLeft: mmToPx(PDF_CONFIG.margins.left),
          paddingRight: mmToPx(PDF_CONFIG.margins.right),
          width: mmToPx(PDF_CONFIG.pageWidth),
          minHeight: mmToPx(PDF_CONFIG.pageHeight),
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'top center',
          boxSizing: 'border-box',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          backgroundColor: 'white',
          overflow: 'hidden',
          transition: isScaling ? 'none' : 'transform 0.3s ease',
          marginBottom: `${mmToPx(PDF_CONFIG.pageHeight) * (1 - scaleFactor)}px`,
        }}
      >
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: mmToPx(PDF_CONFIG.spacing.afterContact),
            maxWidth: `${mmToPx(PDF_CONFIG.contentWidth)}px`,
            margin: '0 auto',
          }}>
            <h1 style={{
              fontSize: ptToPx(PDF_CONFIG.fonts.name.size),
              fontWeight: 'bold',
              letterSpacing: '1pt',
              marginBottom: mmToPx(PDF_CONFIG.spacing.afterName),
              fontFamily: `${PDF_CONFIG.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif`,
              textTransform: 'uppercase',
              wordWrap: 'break-word',
              overflow: 'hidden',
              color: '#000000',
            }}>
              {resumeData.name}
            </h1>

            {/* Contact Info - Two Lines */}
            {(contactInfo.line1.length > 0 || contactInfo.line2.length > 0) && (
              <div style={{
                fontFamily: `${PDF_CONFIG.fontFamily}, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif`,
                marginBottom: mmToPx(PDF_CONFIG.spacing.afterContact),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                maxWidth: '100%',
                color: '#000000',
              }}>
                {/* Line 1: Phone, Email, Location */}
                {contactInfo.line1.length > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '4px',
                  }}>
                    {contactInfo.line1}
                  </div>
                )}
                {/* Line 2: LinkedIn, GitHub */}
                {contactInfo.hasLine2 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '4px',
                  }}>
                    {contactInfo.line2}
                  </div>
                )}
              </div>
            )}

            <div style={{
              borderBottomWidth: '0.5pt',
              borderColor: '#404040',
              height: '1px',
              margin: '0 auto',
              width: '100%',
              maxWidth: `${mmToPx(PDF_CONFIG.contentWidth)}px`,
            }}></div>
          </div>

          {/* Dynamic sections */}
          <div style={{
            maxWidth: `${mmToPx(PDF_CONFIG.contentWidth)}px`,
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {(Array.isArray(sectionOrder) ? sectionOrder : []).map((sectionName) => (   <React.Fragment key={sectionName}>     {renderSection(sectionName)}   </React.Fragment> ))}
          </div>
        </div>
      </div>
    </div>
  );
};
