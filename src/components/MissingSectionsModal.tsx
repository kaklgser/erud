import React, { useState } from 'react';
import {
  X,
  Plus,
  Briefcase,
  Code,
  Award,
  AlertCircle,
  CheckCircle,
  Mail,
  ArrowLeft,
  ArrowRight,
  Target,
  GraduationCap
} from 'lucide-react';

interface WorkExperience {
  role: string;
  company: string;
  year: string;
  bullets: string[];
}

interface Project {
  title: string;
  bullets: string[];
}

interface Skill {
  category: string;
  count: number;
  list: string[];
}

interface Education {
  degree: string;
  school: string;
  year: string;
  cgpa?: string;
  location?: string;
}

interface ContactDetails {
  phone: string;
  email: string;
  linkedin: string;
  github: string;
}

interface MissingSectionsData {
  workExperience?: WorkExperience[];
  projects?: Project[];
  skills?: Skill[];
  education?: Education[];
  certifications?: string[];
  contactDetails?: ContactDetails;
}

interface MissingSectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingSections: string[];
  onSectionsProvided: (data: MissingSectionsData) => void;
  suggestedCertifications?: string[]; // JD-relevant certifications to suggest
  analysisType?: 'jd_analysis' | 'general_analysis'; // Type of analysis performed
  currentResumeData?: any; // Current resume data for context
  pipelineMode?: boolean; // Whether running in pipeline mode
}

export const MissingSectionsModal: React.FC<MissingSectionsModalProps> = ({
  isOpen,
  onClose,
  missingSections,
  onSectionsProvided,
  suggestedCertifications = [],
  analysisType = 'general_analysis',
  currentResumeData,
  pipelineMode = false
}) => {
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([
    { role: '', company: '', year: '', bullets: [''] }
  ]);
  const [projects, setProjects] = useState<Project[]>([
    { title: '', bullets: [''] }
  ]);
  const [skills, setSkills] = useState<Skill[]>([
    { category: '', count: 0, list: [] }
  ]);
  const [skillInputs, setSkillInputs] = useState<string[]>(['']);
  const [education, setEducation] = useState<Education[]>([
    { degree: '', school: '', year: '', cgpa: '', location: '' }
  ]);
  const [certifications, setCertifications] = useState<string[]>(['']);
  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    phone: '',
    email: '',
    linkedin: '',
    github: ''
  });
  // NEW: State for work experience dates (when only dates are missing)
  const [workExperienceDates, setWorkExperienceDates] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  // Get score impact info for each section
  const getSectionScoreImpact = (section: string): { impact: string; tier: string; weight: string } => {
    const baseSection = section.includes(':') ? section.split(':')[0] : section;
    switch (baseSection) {
      case 'workExperience':
        return { impact: '+15-25%', tier: 'Tier 3: Experience', weight: '25% of total score' };
      case 'projects':
        return { impact: '+10-15%', tier: 'Tier 6: Projects', weight: '8% of total score' };
      case 'skills':
        return { impact: '+20-30%', tier: 'Tier 5: Skills & Keywords', weight: '25% of total score' };
      case 'education':
        return { impact: '+5-10%', tier: 'Tier 4: Education', weight: '8% of total score' };
      case 'certifications':
        return { impact: '+3-8%', tier: 'Tier 4: Certifications', weight: '8% of total score' };
      case 'contactDetails':
        return { impact: '+5-10%', tier: 'Tier 2: Content Structure', weight: '10% of total score' };
      default:
        return { impact: '+5%', tier: 'General', weight: 'Varies' };
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const addWorkExperience = () => {
    setWorkExperience([...workExperience, { role: '', company: '', year: '', bullets: [''] }]);
  };

  const removeWorkExperience = (index: number) => {
    if (workExperience.length > 1) {
      setWorkExperience(workExperience.filter((_, i) => i !== index));
    }
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const updated = [...workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperience(updated);
  };

  const addWorkBullet = (workIndex: number) => {
    const updated = [...workExperience];
    updated[workIndex].bullets.push('');
    setWorkExperience(updated);
  };

  const updateWorkBullet = (workIndex: number, bulletIndex: number, value: string) => {
    const updated = [...workExperience];
    updated[workIndex].bullets[bulletIndex] = value;
    setWorkExperience(updated);
  };

  const removeWorkBullet = (workIndex: number, bulletIndex: number) => {
    const updated = [...workExperience];
    if (updated[workIndex].bullets.length > 1) {
      updated[workIndex].bullets.splice(bulletIndex, 1);
      setWorkExperience(updated);
    }
  };

  const addProject = () => {
    setProjects([...projects, { title: '', bullets: [''] }]);
  };

  const removeProject = (index: number) => {
    if (projects.length > 1) {
      setProjects(projects.filter((_, i) => i !== index));
    }
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const addProjectBullet = (projectIndex: number) => {
    const updated = [...projects];
    updated[projectIndex].bullets.push('');
    setProjects(updated);
  };

  const updateProjectBullet = (projectIndex: number, bulletIndex: number, value: string) => {
    const updated = [...projects];
    updated[projectIndex].bullets[bulletIndex] = value;
    setProjects(updated);
  };

  const removeProjectBullet = (projectIndex: number, bulletIndex: number) => {
    const updated = [...projects];
    if (updated[projectIndex].bullets.length > 1) {
      updated[projectIndex].bullets.splice(bulletIndex, 1);
      setProjects(updated);
    }
  };

  const addSkillCategory = () => {
    setSkills([...skills, { category: '', count: 0, list: [] }]);
    setSkillInputs([...skillInputs, '']);
  };

  const updateSkillCategory = (index: number, field: keyof Skill, value: any) => {
    const updated = [...skills];
    if (field === 'list') {
      updated[index] = { ...updated[index], [field]: value, count: value.length };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSkills(updated);
  };

  const removeSkillCategory = (index: number) => {
    if (skills.length > 1) {
      setSkills(skills.filter((_, i) => i !== index));
      setSkillInputs(skillInputs.filter((_, i) => i !== index));
    }
  };

  const addSkillToCategory = (categoryIndex: number, skill: string) => {
    if (skill.trim()) {
      const updated = [...skills];
      updated[categoryIndex].list.push(skill.trim());
      updated[categoryIndex].count = updated[categoryIndex].list.length;
      setSkills(updated);
      setSkillInputs((prev) => {
        const next = [...prev];
        next[categoryIndex] = '';
        return next;
      });
    }
  };

  const removeSkillFromCategory = (categoryIndex: number, skillIndex: number) => {
    const updated = [...skills];
    updated[categoryIndex].list.splice(skillIndex, 1);
    updated[categoryIndex].count = updated[categoryIndex].list.length;
    setSkills(updated);
  };

  const addEducation = () => {
    setEducation([...education, { degree: '', school: '', year: '', cgpa: '', location: '' }]);
  };

  const removeEducation = (index: number) => {
    if (education.length > 1) {
      setEducation(education.filter((_, i) => i !== index));
    }
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const addCertification = () => {
    setCertifications([...certifications, '']);
  };

  const removeCertification = (index: number) => {
    if (certifications.length > 1) {
      setCertifications(certifications.filter((_, i) => i !== index));
    }
  };

  const updateCertification = (index: number, value: string) => {
    const updated = [...certifications];
    updated[index] = value;
    setCertifications(updated);
  };

  const updateContactDetails = (field: keyof ContactDetails, value: string) => {
    setContactDetails(prev => ({ ...prev, [field]: value }));
  };

  const validateCurrentSection = () => {
    const currentSection = missingSections[currentStep];

    if (currentSection === 'workExperience') {
      // At least one experience with role, company, and year
      return workExperience.some(we => 
        we.role.trim().length >= 2 && 
        we.company.trim().length >= 2 && 
        we.year.trim().length >= 4
      );
    }

    // Handle missing dates for work experience (workExperience:date:ExpName)
    if (currentSection.startsWith('workExperience:date:')) {
      const expName = currentSection.split(':')[2];
      const dateValue = workExperienceDates[expName] || '';
      // Must have at least 4 characters (year) and contain a digit
      return dateValue.trim().length >= 4 && /\d{4}/.test(dateValue);
    }

    if (currentSection === 'projects') {
      // At least one project with title and one bullet
      return projects.some(p => 
        p.title.trim().length >= 3 && 
        p.bullets.some(b => b.trim().length >= 10)
      );
    }

    if (currentSection === 'skills') {
      // At least one skill category with category name and at least one skill
      return skills.some(s => 
        s.category.trim().length >= 2 && 
        s.list.some(item => item.trim().length >= 2)
      );
    }

    if (currentSection === 'education' || currentSection.startsWith('education:')) {
      // For granular fields (education:Year, education:Degree, etc.), validate that specific field
      if (currentSection.startsWith('education:')) {
        const missingField = currentSection.split(':')[1].toLowerCase();
        if (missingField.includes('year')) {
          return education.some(edu => edu.year.trim().length >= 4);
        }
        if (missingField.includes('degree')) {
          return education.some(edu => edu.degree.trim().length >= 2);
        }
        if (missingField.includes('institution') || missingField.includes('school')) {
          return education.some(edu => edu.school.trim().length >= 2);
        }
      }
      // Full education section - require all fields
      return education.some(edu => 
        edu.degree.trim().length >= 2 && 
        edu.school.trim().length >= 2 && 
        edu.year.trim().length >= 4
      );
    }

    if (currentSection === 'certifications') {
      // At least one certification with at least 5 characters
      return certifications.some(c => c.trim().length >= 5);
    }

    if (currentSection === 'contactDetails' || currentSection.startsWith('contactDetails:')) {
      // For granular fields (contactDetails:Phone, contactDetails:Email), validate that specific field
      if (currentSection === 'contactDetails:Phone') {
        return contactDetails.phone.trim().length >= 10;
      }
      if (currentSection === 'contactDetails:Email') {
        return contactDetails.email.trim().includes('@') && 
               contactDetails.email.trim().includes('.');
      }
      // Full contact section - require email, phone optional
      const emailValid = contactDetails.email.trim().includes('@') && 
                        contactDetails.email.trim().includes('.');
      const phoneValid = contactDetails.phone.trim() === '' || 
                        contactDetails.phone.trim().length >= 10;
      return emailValid && phoneValid;
    }

    return false;
  };

  const handleNext = () => {
    if (currentStep < missingSections.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  // Skip is ONLY allowed for certifications section (per pipeline requirements)
  const canSkipCurrentSection = (): boolean => {
    // In pipeline mode, enforce strict rules: only certifications can be skipped
    if (pipelineMode) {
      return currentSection === 'certifications';
    }
    // In standalone mode, allow more flexibility
    return currentSection === 'certifications';
  };

  // Check if current section is required (cannot be skipped)
  const isRequiredSection = (): boolean => {
    const requiredSections = ['workExperience', 'projects', 'skills', 'education'];
    const baseSection = currentSection.includes(':') ? currentSection.split(':')[0] : currentSection;
    return requiredSections.includes(baseSection);
  };

  const handleSkipCertifications = () => {
    // Only certifications can be skipped - move to next step or submit
    if (currentSection !== 'certifications') return;
    
    if (currentStep < missingSections.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };



  const handleSubmit = () => {
    const data: MissingSectionsData = {};

    if (missingSections.includes('workExperience')) {
      data.workExperience = workExperience.filter(we =>
        we.role.trim() && we.company.trim() && we.year.trim()
      ).map(we => ({
        ...we,
        bullets: we.bullets.filter(b => b.trim())
      }));
    }

    // Handle work experience dates (when only dates are missing)
    const workExpDateSections = missingSections.filter(s => s.startsWith('workExperience:date:'));
    if (workExpDateSections.length > 0 && Object.keys(workExperienceDates).length > 0) {
      // Pass the dates as a special field that the parent can use to update existing work experience
      (data as any).workExperienceDates = workExperienceDates;
    }

    if (missingSections.includes('projects')) {
      data.projects = projects.filter(p =>
        p.title.trim() && p.bullets.some(b => b.trim())
      ).map(p => ({
        ...p,
        bullets: p.bullets.filter(b => b.trim())
      }));
    }

    if (missingSections.includes('skills')) {
      data.skills = skills.filter(s =>
        s.category.trim() && s.list.some(item => item.trim())
      ).map(s => ({
        ...s,
        list: s.list.filter(item => item.trim())
      }));
    }

    // Handle both full education section and granular education fields
    if (missingSections.includes('education') || missingSections.some(s => s.startsWith('education:'))) {
      data.education = education.filter(edu =>
        edu.degree.trim() || edu.school.trim() || edu.year.trim()
      );
    }

    if (missingSections.includes('certifications')) {
      data.certifications = certifications.filter(c => c.trim());
    }

    // Handle both full contact section and granular contact fields
    if (missingSections.includes('contactDetails') || missingSections.some(s => s.startsWith('contactDetails:'))) {
      data.contactDetails = {
        phone: contactDetails.phone.trim(),
        email: contactDetails.email.trim(),
        linkedin: contactDetails.linkedin.trim(),
        github: contactDetails.github.trim(),
      };
    }

    onSectionsProvided(data);
    onClose();
  };

  const currentSection = missingSections[currentStep];
  const isValid = validateCurrentSection();

  const renderWorkExperienceForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6 mt-0 sm:mt-0">
        <div className="bg-cyan-500/15 border border-cyan-400/40 w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-300" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-slate-100 mb-2">Add Work Experience</h3>
        <p className="text-sm sm:text-base text-slate-300">
          Please provide your work experience details. If you're a fresher and don't have any full-time experience,
          we recommend adding any internships, training, or freelance work you've done. These greatly help in showcasing your skills.
        </p>
      </div>

      {workExperience.map((work, workIndex) => (
        <div key={workIndex} className="border border-slate-700/50 bg-slate-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-100 text-sm sm:text-base">Experience #{workIndex + 1}</h4>
            {workExperience.length > 1 && (
              <button
                onClick={() => removeWorkExperience(workIndex)}
                className="text-red-600 hover:text-red-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={work.role}
                onChange={(e) => updateWorkExperience(workIndex, 'role', e.target.value)}
                placeholder="e.g., Software Engineer"
                className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company *
              </label>
              <input
                type="text"
                value={work.company}
                onChange={(e) => updateWorkExperience(workIndex, 'company', e.target.value)}
                placeholder="e.g., TechCorp Inc."
                className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration *
            </label>
            <input
              type="text"
              value={work.year}
              onChange={(e) => updateWorkExperience(workIndex, 'year', e.target.value)}
              placeholder="e.g., Jan 2023 - Present"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Key Responsibilities
            </label>
            {work.bullets.map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => updateWorkBullet(workIndex, bulletIndex, e.target.value)}
                  placeholder="Describe your responsibility/achievement"
                  className="w-full sm:flex-1 px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
                />
                {work.bullets.length > 1 && (
                  <button
                    onClick={() => removeWorkBullet(workIndex, bulletIndex)}
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 p-3 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border border-red-300 rounded-lg sm:border-none"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addWorkBullet(workIndex)}
              className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex items-center min-h-[44px] w-full sm:w-auto justify-center sm:justify-start p-2 border border-blue-300 rounded-lg sm:border-none sm:p-0"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Add Responsibility
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addWorkExperience}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Experience
      </button>
    </div>
  );

  // Render form for adding missing dates to work experience
  const renderWorkExperienceDateForm = () => {
    // Extract the experience name from the current section (workExperience:date:ExpName)
    const expName = currentSection.split(':')[2] || 'Experience';
    const dateValue = workExperienceDates[expName] || '';
    
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center mb-4 sm:mb-6 mt-0 sm:mt-0">
          <div className="bg-amber-500/15 border border-amber-400/40 w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-100 mb-2">Add Missing Date</h3>
          <p className="text-sm sm:text-base text-slate-300">
            Your work experience <strong className="text-amber-300">"{expName}"</strong> is missing the date/duration.
            Please provide the time period for this experience.
          </p>
        </div>

        <div className="border border-slate-700/50 bg-slate-800/30 rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-4">
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-200">
              📅 <strong>Why dates matter:</strong> ATS systems and recruiters use dates to understand your career timeline. 
              Missing dates can lower your ATS score and raise red flags.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration for: <span className="text-amber-300">{expName}</span> *
            </label>
            <input
              type="text"
              value={dateValue}
              onChange={(e) => setWorkExperienceDates(prev => ({
                ...prev,
                [expName]: e.target.value
              }))}
              placeholder="e.g., Jan 2023 - Present, or Jun 2022 - Dec 2023"
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-amber-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-base min-h-[48px]"
            />
            <p className="text-xs text-slate-400 mt-2">
              Format: "Month Year - Month Year" (e.g., "Jan 2023 - Present" or "Jun 2022 - Dec 2023")
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-slate-700/30 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Example 1</p>
              <p className="text-sm text-slate-200">Jan 2023 - Present</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Example 2</p>
              <p className="text-sm text-slate-200">Jun 2022 - Dec 2023</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectsForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-green-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Code className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Projects</h3>
        <p className="text-sm sm:text-base text-gray-600">Please provide your project details</p>
      </div>

      {projects.map((project, projectIndex) => (
        <div key={projectIndex} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Project #{projectIndex + 1}</h4>
            {projects.length > 1 && (
              <button
                onClick={() => removeProject(projectIndex)}
                className="text-red-600 hover:text-red-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={project.title}
              onChange={(e) => updateProject(projectIndex, 'title', e.target.value)}
              placeholder="e.g., E-commerce Website"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Details
            </label>
            {project.bullets.map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => updateProjectBullet(projectIndex, bulletIndex, e.target.value)}
                  placeholder="Describe what you built/achieved"
                  className="w-full sm:flex-1 px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
                />
                {project.bullets.length > 1 && (
                  <button
                    onClick={() => removeProjectBullet(projectIndex, bulletIndex)}
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 p-3 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border border-red-300 rounded-lg sm:border-none"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addProjectBullet(projectIndex)}
              className="text-green-600 hover:text-green-700 text-xs sm:text-sm font-medium flex items-center min-h-[44px] w-full sm:w-auto justify-center sm:justify-start p-2 border border-green-300 rounded-lg sm:border-none sm:p-0"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Add Detail
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addProject}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Project
      </button>
    </div>
  );

  const renderSkillsForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-purple-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Target className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Skills</h3>
        <p className="text-sm sm:text-base text-gray-600">Organize your technical skills by category.</p>
      </div>

      {skills.map((skillCategory, categoryIndex) => (
        <div key={categoryIndex} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Skill Category #{categoryIndex + 1}</h4>
            {skills.length > 1 && (
              <button
                onClick={() => removeSkillCategory(categoryIndex)}
                className="text-red-600 hover:text-red-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={skillCategory.category}
              onChange={(e) => updateSkillCategory(categoryIndex, 'category', e.target.value)}
              placeholder="e.g., Programming Languages, Frameworks, Tools"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Skills (comma-separated or add individually)
            </label>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="text"
                value={skillInputs[categoryIndex] || ''}
                onChange={(e) => {
                  const next = [...skillInputs];
                  next[categoryIndex] = e.target.value;
                  setSkillInputs(next);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkillToCategory(categoryIndex, skillInputs[categoryIndex] || '');
                  }
                }}
                placeholder="e.g., JavaScript, React, Node.js"
                className="w-full sm:flex-1 px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
              />
              <button
                onClick={() => {
                  addSkillToCategory(categoryIndex, skillInputs[categoryIndex] || '');
                }}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-3 py-3 rounded-lg transition-colors text-sm min-h-[44px]"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skillCategory.list.map((skill: string, skillIndex: number) => (
                <span
                  key={skillIndex}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                >
                  {skill}
                  <button
                    onClick={() => removeSkillFromCategory(categoryIndex, skillIndex)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addSkillCategory}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Skill Category
      </button>
    </div>
  );

  const renderEducationForm = () => {
    // Check if this is a granular field request (e.g., education:Year)
    const isGranularField = currentSection.startsWith('education:');
    const missingFieldName = isGranularField ? currentSection.split(':')[1] : null;
    
    return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-blue-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          {isGranularField ? `Add Missing Education ${missingFieldName}` : 'Add Education'}
        </h3>
        <p className="text-sm sm:text-base text-gray-600">
          {isGranularField 
            ? `Your education section is missing the ${missingFieldName}. Please fill it in below.`
            : 'Please provide your educational background.'}
        </p>
        {isGranularField && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Missing: {missingFieldName}
          </div>
        )}
      </div>

      {education.map((edu, eduIndex) => (
        <div key={eduIndex} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base">Education #{eduIndex + 1}</h4>
            {education.length > 1 && (
              <button
                onClick={() => removeEducation(eduIndex)}
                className="text-red-600 hover:text-red-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Degree *</label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateEducation(eduIndex, 'degree', e.target.value)}
                placeholder="e.g., Bachelor of Technology"
                className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Institution *</label>
              <input
                type="text"
                value={edu.school}
                onChange={(e) => updateEducation(eduIndex, 'school', e.target.value)}
                placeholder="e.g., University Name"
                className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year *</label>
            <input
              type="text"
              value={edu.year}
              onChange={(e) => updateEducation(eduIndex, 'year', e.target.value)}
              placeholder="e.g., 2020-2024"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CGPA/GPA</label>
            <input
              type="text"
              value={edu.cgpa || ''}
              onChange={(e) => updateEducation(eduIndex, 'cgpa', e.target.value)}
              placeholder="e.g., 8.5/10 or 3.8/4.0"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={edu.location || ''}
              onChange={(e) => updateEducation(eduIndex, 'location', e.target.value)}
              placeholder="e.g., City, State"
              className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-neon-cyan-500 focus:border-blue-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
            />
          </div>
        </div>
      ))}

      <button
        onClick={addEducation}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Education Entry
      </button>
    </div>
  );};

  const renderCertificationsForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-amber-500/15 border border-amber-400/40 w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-slate-100 mb-2">Add Certifications</h3>
        <p className="text-sm sm:text-base text-slate-300">
          Professional certifications can boost your ATS score by 3-8%. Add any relevant certifications you have.
        </p>
      </div>

      {/* JD-Relevant Certification Suggestions */}
      {suggestedCertifications && suggestedCertifications.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-lg p-4 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
          <div className="flex items-start gap-2 mb-3">
            <div className="bg-cyan-500/20 rounded-full p-1">
              <Target className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            </div>
            <div>
              <p className="text-sm font-medium text-cyan-300">🎯 Job-Relevant Certifications</p>
              <p className="text-xs text-slate-400">
                {analysisType === 'jd_analysis' 
                  ? 'These certifications align with the job description and can boost your ATS score:'
                  : 'Popular certifications that could enhance your profile:'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedCertifications.map((cert, idx) => (
              <button
                key={idx}
                onClick={() => {
                  // Add suggested cert if not already in list
                  if (!certifications.some(c => c.toLowerCase() === cert.toLowerCase())) {
                    const emptyIndex = certifications.findIndex(c => !c.trim());
                    if (emptyIndex >= 0) {
                      updateCertification(emptyIndex, cert);
                    } else {
                      setCertifications([...certifications, cert]);
                    }
                  }
                }}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-full text-xs text-cyan-200 transition-colors flex items-center gap-1 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
              >
                <Plus className="w-3 h-3" />
                {cert}
              </button>
            ))}
          </div>
          {analysisType === 'jd_analysis' && (
            <div className="mt-3 text-xs text-cyan-300/80 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Adding relevant certifications can improve your score by 3-8%
            </div>
          )}
        </div>
      )}

      {certifications.map((cert, index) => (
        <div key={index} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={cert}
            onChange={(e) => updateCertification(index, e.target.value)}
            placeholder="e.g., AWS Certified Solutions Architect"
            className="w-full sm:flex-1 px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
          />
          {certifications.length > 1 && (
            <button
              onClick={() => removeCertification(index)}
              className="w-full sm:w-auto text-red-600 hover:text-red-700 p-3 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border border-red-300 rounded-lg sm:border-none"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addCertification}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors flex items-center justify-center text-sm min-h-[44px]"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Add Another Certification
      </button>

      <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-4 mt-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">No certifications?</p>
            <p className="text-xs text-slate-400 mt-1">
              That's okay! Certifications are optional. Click "Skip" below to proceed without adding any.
              You can always add them later to improve your score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactDetailsForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6">
        <div className="bg-yellow-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Add Contact Details</h3>
        <p className="text-sm sm:text-base text-gray-600">Please provide your contact information</p>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          value={contactDetails.email}
          onChange={(e) => updateContactDetails('email', e.target.value)}
          placeholder="e.g., your.email@example.com"
          className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={contactDetails.phone}
          onChange={(e) => updateContactDetails('phone', e.target.value)}
          placeholder="e.g., +1 (555) 123-4567"
          className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          LinkedIn Profile URL
        </label>
        <input
          type="url"
          value={contactDetails.linkedin}
          onChange={(e) => updateContactDetails('linkedin', e.target.value)}
          placeholder="e.g., https://linkedin.com/in/yourprofile"
          className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          GitHub Profile URL
        </label>
        <input
          type="url"
          value={contactDetails.github}
          onChange={(e) => updateContactDetails('github', e.target.value)}
          placeholder="e.g., https://github.com/yourusername"
          className="w-full px-3 py-3 border border-gray-300 dark:border-dark-300 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-yellow-500 dark:bg-dark-200 dark:text-gray-100 dark:placeholder-gray-400 text-sm min-h-[44px]"
        />
      </div>
    </div>
  );

  const getSectionIcon = (section: string) => {
    // Handle granular field names - use base section icon
    const baseSection = section.includes(':') ? section.split(':')[0] : section;
    
    switch (baseSection) {
      case 'workExperience': return <Briefcase className="w-4 h-4" />;
      case 'projects': return <Code className="w-4 h-4" />;
      case 'skills': return <Target className="w-4 h-4" />;
      case 'education': return <GraduationCap className="w-4 h-4" />;
      case 'certifications': return <Award className="w-4 h-4" />;
      case 'contactDetails': return <Mail className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getSectionName = (section: string): string => {
    // Handle granular field names (e.g., education:Year, contactDetails:Phone, workExperience:date:ExpName)
    if (section.includes(':')) {
      const parts = section.split(':');
      const baseSection = parts[0];
      
      // Special handling for workExperience:date:ExpName format
      if (baseSection === 'workExperience' && parts[1] === 'date') {
        const expName = parts[2] || 'Experience';
        return `Add Date for: ${expName}`;
      }
      
      const field = parts[1];
      // Map base section names directly to avoid recursion
      const baseNames: Record<string, string> = {
        'workExperience': 'Work Experience',
        'projects': 'Projects',
        'skills': 'Skills',
        'education': 'Education',
        'certifications': 'Certifications',
        'contactDetails': 'Contact Details',
      };
      const baseName = baseNames[baseSection] || baseSection;
      return `${baseName} - ${field}`;
    }
    
    switch (section) {
      case 'workExperience': return 'Work Experience';
      case 'projects': return 'Projects';
      case 'skills': return 'Skills';
      case 'education': return 'Education';
      case 'certifications': return 'Certifications';
      case 'contactDetails': return 'Contact Details';
      default: return section;
    }
  };

  return (
    <div
      className="fixed inset-0 lg:left-16 z-50 bg-black/70 flex justify-center items-center p-2 sm:p-2 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-slate-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-[0_25px_80px_rgba(16,185,129,0.15)] border border-emerald-400/30 w-full max-w-[95vw] sm:max-w-4xl overflow-y-auto"
        style={{ maxHeight: '80vh', overscrollBehavior: 'contain' }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3 sm:p-6 sm:mb-6 border-b border-amber-400/20">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors rounded-full hover:bg-slate-800/50 min-w-[44px] min-h-[44px]"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="text-center">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-100 mb-2 px-4">
              {pipelineMode ? 'Complete Missing Sections' : 'Complete Your Resume'}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 px-4">
              {pipelineMode 
                ? 'The following sections are required to continue the optimization pipeline'
                : 'We found some missing sections that are important for optimization'}
            </p>
            <div className="mt-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg p-3 mx-4">
              <p className="text-xs text-cyan-200">
                {pipelineMode ? (
                  <>
                    🔒 <strong>Required:</strong> Work Experience, Projects, Skills, and Education cannot be skipped. 
                    Only Certifications are optional.
                  </>
                ) : (
                  <>
                    💡 <strong>Tip:</strong> Filling these sections will significantly improve your resume's ATS score and job match rate.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-3 sm:p-6 overflow-y-auto grow shrink basis-0 pb-[100px] bg-slate-900/50">
          <div className="flex justify-center sm:justify-between items-center flex-wrap gap-4 sm:gap-6 mb-2 sm:mb-6">
            {missingSections.map((section, index) => (
              <div key={section} className="flex items-center w-auto sm:w-auto">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index < currentStep
                      ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : index === currentStep
                      ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    getSectionIcon(section)
                  )}
                </div>

                <div className="ml-2 hidden sm:block">
                  <div className="text-sm font-medium text-slate-100">
                    {getSectionName(section)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {index < currentStep
                      ? 'Completed'
                      : index === currentStep
                      ? 'Current'
                      : 'Pending'}
                  </div>
                </div>

                {index < missingSections.length - 1 && (
                  <div className={`w-6 h-px mx-2 sm:w-16 sm:h-1 sm:mx-4 transition-all duration-300 ${
                    index < currentStep ? 'bg-emerald-500' : 'bg-slate-700/50'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 grow shrink basis-0 bg-slate-900/50">
          {currentSection === 'workExperience' && renderWorkExperienceForm()}
          {currentSection.startsWith('workExperience:date:') && renderWorkExperienceDateForm()}
          {currentSection === 'projects' && renderProjectsForm()}
          {currentSection === 'skills' && renderSkillsForm()}
          {(currentSection === 'education' || currentSection.startsWith('education:')) && renderEducationForm()}
          {currentSection === 'certifications' && renderCertificationsForm()}
          {(currentSection === 'contactDetails' || currentSection.startsWith('contactDetails:')) && renderContactDetailsForm()}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 backdrop-blur-xl p-3 sm:p-6 border-t border-emerald-400/20 flex flex-col gap-2">
          {/* Score Impact Info */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-400/30 rounded-lg p-3 mb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-300">
                    Adding this section can improve your score by {getSectionScoreImpact(currentSection).impact}
                  </p>
                  <p className="text-xs text-slate-400">
                    {getSectionScoreImpact(currentSection).tier} • {getSectionScoreImpact(currentSection).weight}
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="flex flex-row justify-between items-center gap-3">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex-1 sm:w-auto px-4 py-3 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:border-emerald-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px] flex justify-center items-center"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 order-first sm:order-none">
              Step {currentStep + 1} of {missingSections.length}
            </div>

            <div className="flex gap-2">
              {/* Skip button - ONLY for certifications */}
              {canSkipCurrentSection() && (
                <button
                  onClick={handleSkipCertifications}
                  className="px-4 py-3 border border-amber-500/50 rounded-lg text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 transition-colors text-sm min-h-[44px] flex justify-center items-center"
                  title="Certifications are optional and can be skipped"
                >
                  <span className="hidden sm:inline">Skip Optional</span>
                  <span className="sm:hidden">Skip</span>
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={!isValid && !canSkipCurrentSection()}
                className="flex-1 sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:shadow-none disabled:cursor-not-allowed text-sm min-h-[44px] flex justify-center items-center"
                title={!isValid && !canSkipCurrentSection() ? 
                  `This section is required and cannot be skipped` : 
                  'Continue to next step'}
              >
                <span className="hidden sm:inline">
                  {currentStep === missingSections.length - 1 ? 
                    (pipelineMode ? 'Continue Pipeline' : 'Complete') : 
                    'Next'}
                </span>
                <ArrowRight className="w-4 h-4 sm:ml-2" />
              </button>
            </div>

            {/* Validation message for required sections */}
            {!isValid && isRequiredSection() && (
              <div className="mt-2 text-xs text-red-400 flex items-center gap-1 justify-center">
                <AlertCircle className="w-3 h-3" />
                This section is required to continue the optimization pipeline
              </div>
            )}
          </div>


        </div>
      </div>
    </div>
  );
};
