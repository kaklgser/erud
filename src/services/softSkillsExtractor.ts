export type SoftSkillCategory =
  | 'leadership'
  | 'communication'
  | 'problem-solving'
  | 'collaboration'
  | 'adaptability'
  | 'time-management'
  | 'critical-thinking'
  | 'creativity';

export interface SoftSkillEvidence {
  skill: string;
  category: SoftSkillCategory;
  evidence: string[];
  strength: 'strong' | 'moderate' | 'weak';
  actionVerbs: string[];
  quantifiable: boolean;
}

export interface SoftSkillsAnalysis {
  detectedSkills: SoftSkillEvidence[];
  missingFromJD: string[];
  recommendations: string[];
  overallScore: number;
}

export class SoftSkillsExtractor {
  private static readonly SOFT_SKILL_PATTERNS = {
    leadership: {
      actionVerbs: ['led', 'managed', 'directed', 'supervised', 'mentored', 'coached', 'guided', 'oversaw', 'coordinated', 'delegated', 'motivated', 'inspired', 'trained', 'developed team', 'established'],
      nouns: ['team lead', 'project lead', 'manager', 'mentor', 'coach', 'supervisor', 'leader'],
      contextPatterns: [
        /led\s+(?:a\s+)?team\s+of\s+(\d+)/gi,
        /managed\s+(\d+)\s+(?:engineers|developers|members)/gi,
        /mentored\s+(\d+)/gi,
        /supervised\s+team/gi,
        /led\s+\w+\s+initiative/gi
      ],
      jdKeywords: ['leadership', 'lead', 'manage', 'mentor', 'team management', 'people skills']
    },
    communication: {
      actionVerbs: ['presented', 'communicated', 'documented', 'explained', 'articulated', 'collaborated', 'discussed', 'negotiated', 'conveyed', 'reported', 'briefed', 'evangelized'],
      nouns: ['presentation', 'documentation', 'communication', 'stakeholder', 'client', 'meeting'],
      contextPatterns: [
        /presented\s+to\s+\w+/gi,
        /documented\s+\w+/gi,
        /communicated\s+with\s+\w+/gi,
        /stakeholder\s+(?:communication|engagement)/gi,
        /client\s+interaction/gi
      ],
      jdKeywords: ['communication', 'presentation', 'written', 'verbal', 'stakeholder', 'documentation']
    },
    'problem-solving': {
      actionVerbs: ['solved', 'debugged', 'troubleshot', 'resolved', 'analyzed', 'investigated', 'diagnosed', 'identified', 'addressed', 'fixed', 'optimized', 'improved'],
      nouns: ['problem', 'issue', 'bug', 'challenge', 'solution', 'optimization'],
      contextPatterns: [
        /solved\s+\w+\s+(?:problem|issue)/gi,
        /debugged\s+\w+/gi,
        /reduced\s+\w+\s+by\s+\d+%/gi,
        /improved\s+\w+\s+by\s+\d+%/gi,
        /identified\s+and\s+(?:fixed|resolved)/gi
      ],
      jdKeywords: ['problem-solving', 'troubleshooting', 'analytical', 'debugging', 'optimize']
    },
    collaboration: {
      actionVerbs: ['collaborated', 'partnered', 'worked with', 'coordinated', 'contributed', 'participated', 'engaged', 'interfaced', 'liaised', 'cooperated'],
      nouns: ['cross-functional', 'team', 'stakeholder', 'partner', 'collaboration'],
      contextPatterns: [
        /collaborated\s+with\s+\w+/gi,
        /cross-functional\s+team/gi,
        /partnered\s+with\s+\w+/gi,
        /worked\s+(?:closely\s+)?with\s+\w+/gi,
        /team\s+of\s+\d+/gi
      ],
      jdKeywords: ['collaboration', 'teamwork', 'cross-functional', 'team player', 'work with']
    },
    adaptability: {
      actionVerbs: ['adapted', 'learned', 'transitioned', 'pivoted', 'adjusted', 'embraced', 'evolved', 'migrated', 'upgraded', 'modernized'],
      nouns: ['learning', 'transition', 'change', 'new technology', 'migration'],
      contextPatterns: [
        /learned\s+\w+/gi,
        /transitioned\s+from\s+\w+\s+to\s+\w+/gi,
        /adapted\s+to\s+\w+/gi,
        /migrated\s+from\s+\w+/gi,
        /quickly\s+learned/gi
      ],
      jdKeywords: ['adaptability', 'flexibility', 'learning agility', 'fast learner', 'change management']
    },
    'time-management': {
      actionVerbs: ['prioritized', 'scheduled', 'organized', 'planned', 'managed deadlines', 'delivered on time', 'met deadlines'],
      nouns: ['deadline', 'schedule', 'timeline', 'milestone', 'sprint', 'on-time delivery'],
      contextPatterns: [
        /delivered\s+\w+\s+on\s+time/gi,
        /met\s+(?:tight\s+)?deadline/gi,
        /prioritized\s+\w+/gi,
        /managed\s+multiple\s+\w+/gi,
        /within\s+\d+\s+(?:weeks?|months?)/gi
      ],
      jdKeywords: ['time management', 'deadline', 'prioritization', 'multitask', 'organize']
    },
    'critical-thinking': {
      actionVerbs: ['analyzed', 'evaluated', 'assessed', 'researched', 'examined', 'reviewed', 'investigated', 'studied', 'determined'],
      nouns: ['analysis', 'evaluation', 'assessment', 'research', 'insight', 'strategy'],
      contextPatterns: [
        /analyzed\s+\w+\s+(?:to|and)/gi,
        /evaluated\s+\w+/gi,
        /conducted\s+(?:research|analysis)/gi,
        /data-driven\s+\w+/gi
      ],
      jdKeywords: ['analytical', 'critical thinking', 'analysis', 'evaluate', 'strategic thinking']
    },
    creativity: {
      actionVerbs: ['designed', 'created', 'innovated', 'conceived', 'developed', 'invented', 'pioneered', 'reimagined'],
      nouns: ['design', 'innovation', 'creative', 'novel', 'unique', 'original'],
      contextPatterns: [
        /designed\s+\w+\s+(?:system|solution|architecture)/gi,
        /created\s+(?:innovative|novel|new)\s+\w+/gi,
        /pioneered\s+\w+/gi,
        /first\s+to\s+\w+/gi
      ],
      jdKeywords: ['creativity', 'innovative', 'design thinking', 'creative solutions', 'innovation']
    }
  };

  static extractSoftSkills(resumeText: string, jobDescription?: string): SoftSkillsAnalysis {
    const detectedSkills: SoftSkillEvidence[] = [];
    const resumeLower = resumeText.toLowerCase();

    Object.entries(this.SOFT_SKILL_PATTERNS).forEach(([category, patterns]) => {
      const evidence: string[] = [];
      const actionVerbs: string[] = [];
      let verbCount = 0;
      let contextMatches = 0;

      patterns.actionVerbs.forEach(verb => {
        const regex = new RegExp(`\\b${verb}\\b`, 'gi');
        const matches = resumeText.match(regex);
        if (matches) {
          verbCount += matches.length;
          actionVerbs.push(verb);

          const sentences = resumeText.split(/[.!?]+/);
          sentences.forEach(sentence => {
            if (new RegExp(`\\b${verb}\\b`, 'i').test(sentence)) {
              evidence.push(sentence.trim());
            }
          });
        }
      });

      patterns.contextPatterns.forEach(pattern => {
        const matches = resumeText.matchAll(pattern);
        for (const match of matches) {
          contextMatches++;
          if (!evidence.includes(match[0])) {
            const sentenceMatch = resumeText.match(new RegExp(`[^.!?]*${match[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.!?]*`, 'i'));
            if (sentenceMatch) {
              evidence.push(sentenceMatch[0].trim());
            }
          }
        }
      });

      if (verbCount > 0 || contextMatches > 0) {
        let strength: 'strong' | 'moderate' | 'weak';
        const totalEvidence = verbCount + contextMatches * 2;

        if (totalEvidence >= 5) {
          strength = 'strong';
        } else if (totalEvidence >= 2) {
          strength = 'moderate';
        } else {
          strength = 'weak';
        }

        const quantifiable = evidence.some(e => /\d+/.test(e));

        detectedSkills.push({
          skill: this.formatSkillName(category),
          category: category as SoftSkillCategory,
          evidence: evidence.slice(0, 3),
          strength,
          actionVerbs: actionVerbs.slice(0, 5),
          quantifiable
        });
      }
    });

    let missingFromJD: string[] = [];
    let recommendations: string[] = [];

    if (jobDescription) {
      const jdLower = jobDescription.toLowerCase();
      const requiredSkills = this.extractRequiredSoftSkills(jdLower);

      const detectedCategories = new Set(detectedSkills.map(s => s.category));

      requiredSkills.forEach(skill => {
        if (!detectedCategories.has(skill)) {
          missingFromJD.push(this.formatSkillName(skill));
          recommendations.push(
            `Add ${this.formatSkillName(skill)} evidence using verbs like: ${this.SOFT_SKILL_PATTERNS[skill].actionVerbs.slice(0, 3).join(', ')}`
          );
        }
      });

      detectedSkills.forEach(skill => {
        if (skill.strength === 'weak') {
          recommendations.push(
            `Strengthen ${skill.skill} by adding quantifiable examples (e.g., "Led team of X", "Mentored Y engineers")`
          );
        }

        if (!skill.quantifiable && ['leadership', 'communication', 'collaboration'].includes(skill.category)) {
          recommendations.push(
            `Add metrics to ${skill.skill} examples (e.g., team size, number of stakeholders, presentation audience)`
          );
        }
      });
    }

    const overallScore = this.calculateSoftSkillScore(detectedSkills, missingFromJD.length);

    return {
      detectedSkills,
      missingFromJD,
      recommendations,
      overallScore
    };
  }

  private static extractRequiredSoftSkills(jdLower: string): SoftSkillCategory[] {
    const required: SoftSkillCategory[] = [];

    Object.entries(this.SOFT_SKILL_PATTERNS).forEach(([category, patterns]) => {
      const hasKeyword = patterns.jdKeywords.some(keyword =>
        jdLower.includes(keyword.toLowerCase())
      );

      if (hasKeyword) {
        required.push(category as SoftSkillCategory);
      }
    });

    return required;
  }

  private static formatSkillName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private static calculateSoftSkillScore(
    skills: SoftSkillEvidence[],
    missingCount: number
  ): number {
    let score = 0;

    skills.forEach(skill => {
      if (skill.strength === 'strong') {
        score += 15;
      } else if (skill.strength === 'moderate') {
        score += 10;
      } else {
        score += 5;
      }

      if (skill.quantifiable) {
        score += 5;
      }
    });

    score -= missingCount * 10;

    return Math.max(0, Math.min(100, score));
  }

  static enhanceBulletWithSoftSkills(
    bullet: string,
    targetSkills: SoftSkillCategory[]
  ): string {
    let enhanced = bullet;

    targetSkills.forEach(skill => {
      const patterns = this.SOFT_SKILL_PATTERNS[skill];
      if (!patterns) return;

      const hasVerb = patterns.actionVerbs.some(verb =>
        new RegExp(`\\b${verb}\\b`, 'i').test(bullet)
      );

      if (!hasVerb && patterns.actionVerbs.length > 0) {
        const suggestedVerb = patterns.actionVerbs[0];
        const firstWord = bullet.split(' ')[0];

        if (/^(built|created|developed|implemented)/i.test(firstWord)) {
          enhanced = bullet;
        }
      }
    });

    return enhanced;
  }

  static generateSoftSkillBullets(
    category: SoftSkillCategory,
    context: { role?: string; company?: string; metrics?: string }
  ): string[] {
    const patterns = this.SOFT_SKILL_PATTERNS[category];
    if (!patterns) return [];

    const bullets: string[] = [];

    if (category === 'leadership') {
      bullets.push(
        `Led team of ${context.metrics || '5'} engineers to deliver ${context.role || 'project'} ${context.metrics ? `achieving ${context.metrics}` : 'on schedule'}`,
        `Mentored ${context.metrics || '3'} junior developers improving code quality and delivery speed`,
        `Established best practices and coding standards adopted across ${context.company || 'organization'}`
      );
    } else if (category === 'communication') {
      bullets.push(
        `Presented technical solutions to ${context.metrics || '50+'} stakeholders including executives and clients`,
        `Documented architecture and API specifications used by ${context.metrics || '10+'} development teams`,
        `Facilitated cross-functional meetings between engineering, product, and design teams`
      );
    } else if (category === 'problem-solving') {
      bullets.push(
        `Debugged critical production issues reducing downtime by ${context.metrics || '40%'}`,
        `Identified and resolved performance bottlenecks improving response time by ${context.metrics || '60%'}`,
        `Analyzed system failures and implemented preventive measures reducing incidents by ${context.metrics || '50%'}`
      );
    } else if (category === 'collaboration') {
      bullets.push(
        `Collaborated with cross-functional team of ${context.metrics || '15'} members across engineering, product, and design`,
        `Partnered with ${context.metrics || '5'} external teams to integrate third-party services and APIs`,
        `Coordinated with QA and DevOps teams ensuring smooth deployment and testing cycles`
      );
    }

    return bullets;
  }

  static getSoftSkillRecommendations(
    analysis: SoftSkillsAnalysis,
    roleType: string
  ): string[] {
    const recommendations: string[] = [];

    const strongSkills = analysis.detectedSkills.filter(s => s.strength === 'strong');
    const weakSkills = analysis.detectedSkills.filter(s => s.strength === 'weak');

    if (strongSkills.length < 3) {
      recommendations.push('Add more quantifiable soft skill examples to demonstrate well-rounded capabilities');
    }

    if (roleType.includes('senior') || roleType.includes('lead')) {
      const hasLeadership = analysis.detectedSkills.some(s => s.category === 'leadership');
      if (!hasLeadership) {
        recommendations.push('Add leadership examples (mentoring, team management, decision-making)');
      }
    }

    if (weakSkills.length > 0) {
      recommendations.push(
        `Strengthen weak skills: ${weakSkills.map(s => s.skill).join(', ')} by adding specific examples and metrics`
      );
    }

    analysis.missingFromJD.forEach(skill => {
      recommendations.push(`JD requires ${skill} - add relevant examples using appropriate action verbs`);
    });

    return recommendations;
  }

  static validateSoftSkillIntegration(
    originalBullet: string,
    rewrittenBullet: string,
    targetSkill: SoftSkillCategory
  ): { integrated: boolean; naturalness: number } {
    const patterns = this.SOFT_SKILL_PATTERNS[targetSkill];
    if (!patterns) return { integrated: false, naturalness: 0 };

    const hasVerb = patterns.actionVerbs.some(verb =>
      new RegExp(`\\b${verb}\\b`, 'i').test(rewrittenBullet)
    );

    const hasContext = patterns.contextPatterns.some(pattern =>
      pattern.test(rewrittenBullet)
    );

    const integrated = hasVerb || hasContext;

    const originalWords = new Set(originalBullet.toLowerCase().split(/\s+/));
    const rewrittenWords = new Set(rewrittenBullet.toLowerCase().split(/\s+/));
    const overlap = [...originalWords].filter(w => rewrittenWords.has(w)).length;
    const naturalness = overlap / Math.max(originalWords.size, rewrittenWords.size);

    return { integrated, naturalness };
  }
}

export const softSkillsExtractor = SoftSkillsExtractor;
