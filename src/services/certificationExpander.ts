export interface CertificationExpansionResult {
  original: string;
  expanded: string;
  provider: string;
  level?: string;
  confidence: 'high' | 'medium' | 'low';
  wasExpanded: boolean;
}

export class CertificationExpander {
  private static readonly CERTIFICATION_DATABASE: { [key: string]: string } = {
    'aws certified developer': 'AWS Certified Developer - Associate',
    'aws developer': 'AWS Certified Developer - Associate',
    'aws certified solutions architect': 'AWS Certified Solutions Architect - Associate',
    'aws solutions architect': 'AWS Certified Solutions Architect - Associate',
    'aws certified solutions architect professional': 'AWS Certified Solutions Architect - Professional',
    'aws sysops': 'AWS Certified SysOps Administrator - Associate',
    'aws devops': 'AWS Certified DevOps Engineer - Professional',
    'aws certified cloud practitioner': 'AWS Certified Cloud Practitioner',
    'aws cloud practitioner': 'AWS Certified Cloud Practitioner',
    'aws certified security': 'AWS Certified Security - Specialty',
    'aws machine learning': 'AWS Certified Machine Learning - Specialty',
    'aws data analytics': 'AWS Certified Data Analytics - Specialty',

    'azure fundamentals': 'Microsoft Certified: Azure Fundamentals',
    'az-900': 'Microsoft Certified: Azure Fundamentals',
    'azure administrator': 'Microsoft Certified: Azure Administrator Associate',
    'az-104': 'Microsoft Certified: Azure Administrator Associate',
    'azure developer': 'Microsoft Certified: Azure Developer Associate',
    'az-204': 'Microsoft Certified: Azure Developer Associate',
    'azure solutions architect': 'Microsoft Certified: Azure Solutions Architect Expert',
    'az-305': 'Microsoft Certified: Azure Solutions Architect Expert',
    'azure devops': 'Microsoft Certified: DevOps Engineer Expert',
    'az-400': 'Microsoft Certified: DevOps Engineer Expert',
    'azure data engineer': 'Microsoft Certified: Azure Data Engineer Associate',
    'az-700': 'Microsoft Certified: Azure Network Engineer Associate',
    'azure ai engineer': 'Microsoft Certified: Azure AI Engineer Associate',
    'ai-102': 'Microsoft Certified: Azure AI Engineer Associate',

    'google cloud certified': 'Google Cloud Certified Professional Cloud Architect',
    'gcp architect': 'Google Cloud Certified Professional Cloud Architect',
    'google cloud associate': 'Google Cloud Certified Associate Cloud Engineer',
    'gcp associate': 'Google Cloud Certified Associate Cloud Engineer',
    'google cloud developer': 'Google Cloud Certified Professional Cloud Developer',
    'google cloud data engineer': 'Google Cloud Certified Professional Data Engineer',
    'gcp data engineer': 'Google Cloud Certified Professional Data Engineer',
    'google cloud security': 'Google Cloud Certified Professional Cloud Security Engineer',
    'google cloud network': 'Google Cloud Certified Professional Cloud Network Engineer',

    'certified kubernetes administrator': 'Certified Kubernetes Administrator (CKA)',
    'cka': 'Certified Kubernetes Administrator (CKA)',
    'certified kubernetes application developer': 'Certified Kubernetes Application Developer (CKAD)',
    'ckad': 'Certified Kubernetes Application Developer (CKAD)',
    'certified kubernetes security': 'Certified Kubernetes Security Specialist (CKS)',
    'cks': 'Certified Kubernetes Security Specialist (CKS)',

    'oracle certified associate': 'Oracle Certified Associate, Java SE 11 Developer',
    'oca java': 'Oracle Certified Associate, Java SE 11 Developer',
    'oracle certified professional': 'Oracle Certified Professional, Java SE 11 Developer',
    'ocp java': 'Oracle Certified Professional, Java SE 11 Developer',
    'java se 11': 'Oracle Certified Professional, Java SE 11 Developer',
    'java se 17': 'Oracle Certified Professional, Java SE 17 Developer',

    'cissp': 'Certified Information Systems Security Professional (CISSP)',
    'certified information systems security professional': 'Certified Information Systems Security Professional (CISSP)',
    'ceh': 'Certified Ethical Hacker (CEH)',
    'certified ethical hacker': 'Certified Ethical Hacker (CEH)',
    'comptia security+': 'CompTIA Security+',
    'security+': 'CompTIA Security+',
    'comptia network+': 'CompTIA Network+',
    'network+': 'CompTIA Network+',
    'comptia a+': 'CompTIA A+',
    'a+': 'CompTIA A+',

    'pmp': 'Project Management Professional (PMP)',
    'project management professional': 'Project Management Professional (PMP)',
    'capm': 'Certified Associate in Project Management (CAPM)',
    'prince2': 'PRINCE2 Foundation Certification',
    'prince2 practitioner': 'PRINCE2 Practitioner Certification',

    'csm': 'Certified ScrumMaster (CSM)',
    'certified scrummaster': 'Certified ScrumMaster (CSM)',
    'psm': 'Professional Scrum Master (PSM)',
    'professional scrum master': 'Professional Scrum Master (PSM)',
    'psm i': 'Professional Scrum Master I (PSM I)',
    'psm ii': 'Professional Scrum Master II (PSM II)',
    'safe agilist': 'SAFe 5 Agilist Certification',

    'tensorflow developer': 'TensorFlow Developer Certificate',
    'tensorflow certificate': 'TensorFlow Developer Certificate',
    'google tensorflow': 'TensorFlow Developer Certificate',
    'deep learning specialization': 'Deep Learning Specialization (Coursera)',
    'machine learning': 'Machine Learning Specialization (Stanford/Coursera)',

    'ccna': 'Cisco Certified Network Associate (CCNA)',
    'cisco certified network associate': 'Cisco Certified Network Associate (CCNA)',
    'ccnp': 'Cisco Certified Network Professional (CCNP)',
    'cisco certified network professional': 'Cisco Certified Network Professional (CCNP)',
    'ccie': 'Cisco Certified Internetwork Expert (CCIE)',

    'rhcsa': 'Red Hat Certified System Administrator (RHCSA)',
    'red hat certified system administrator': 'Red Hat Certified System Administrator (RHCSA)',
    'rhce': 'Red Hat Certified Engineer (RHCE)',
    'red hat certified engineer': 'Red Hat Certified Engineer (RHCE)',

    'salesforce administrator': 'Salesforce Certified Administrator',
    'salesforce developer': 'Salesforce Certified Platform Developer I',
    'salesforce app builder': 'Salesforce Certified Platform App Builder',
    'salesforce architect': 'Salesforce Certified Technical Architect',

    'tableau desktop specialist': 'Tableau Desktop Specialist Certification',
    'tableau certified': 'Tableau Desktop Specialist Certification',
    'power bi': 'Microsoft Certified: Power BI Data Analyst Associate',
    'data analyst associate': 'Microsoft Certified: Data Analyst Associate',

    'itil foundation': 'ITIL 4 Foundation Certification',
    'itil': 'ITIL 4 Foundation Certification',
    'itil v4': 'ITIL 4 Foundation Certification',

    'certified data professional': 'Certified Data Management Professional (CDMP)',
    'cdmp': 'Certified Data Management Professional (CDMP)',

    'togaf': 'The Open Group Architecture Framework (TOGAF) 9 Certified',
    'togaf 9': 'The Open Group Architecture Framework (TOGAF) 9 Certified',

    'certified blockchain': 'Certified Blockchain Professional',
    'blockchain certification': 'Certified Blockchain Professional',

    'docker certified associate': 'Docker Certified Associate (DCA)',
    'dca': 'Docker Certified Associate (DCA)',

    'hashicorp terraform': 'HashiCorp Certified: Terraform Associate',
    'terraform associate': 'HashiCorp Certified: Terraform Associate',
    'vault associate': 'HashiCorp Certified: Vault Associate'
  };

  private static readonly PROVIDER_PATTERNS = [
    { pattern: /\baws\b/i, provider: 'AWS' },
    { pattern: /\bazure\b/i, provider: 'Microsoft' },
    { pattern: /\bgcp\b|google cloud/i, provider: 'Google Cloud' },
    { pattern: /\boracle\b/i, provider: 'Oracle' },
    { pattern: /\bcisco\b/i, provider: 'Cisco' },
    { pattern: /\bred hat\b/i, provider: 'Red Hat' },
    { pattern: /\bcompti[a]?\b/i, provider: 'CompTIA' },
    { pattern: /\bkubernetes\b/i, provider: 'CNCF' },
    { pattern: /\bsalesforce\b/i, provider: 'Salesforce' },
    { pattern: /\btableau\b/i, provider: 'Tableau' },
    { pattern: /\bpower bi\b/i, provider: 'Microsoft' },
    { pattern: /\bscrum\b|scrummaster/i, provider: 'Scrum Alliance' },
    { pattern: /\bpmp\b|project management/i, provider: 'PMI' },
    { pattern: /\bcissp\b|ceh\b/i, provider: 'Security' },
    { pattern: /\bterraform\b|vault\b/i, provider: 'HashiCorp' },
    { pattern: /\bdocker\b/i, provider: 'Docker' }
  ];

  static expandCertification(certificationName: string): CertificationExpansionResult {
    const normalized = certificationName.toLowerCase().trim();

    const exactMatch = this.CERTIFICATION_DATABASE[normalized];
    if (exactMatch) {
      const provider = this.extractProvider(exactMatch);
      return {
        original: certificationName,
        expanded: exactMatch,
        provider,
        confidence: 'high',
        wasExpanded: true
      };
    }

    const partialMatch = this.findPartialMatch(normalized);
    if (partialMatch) {
      const provider = this.extractProvider(partialMatch);
      return {
        original: certificationName,
        expanded: partialMatch,
        provider,
        confidence: 'medium',
        wasExpanded: true
      };
    }

    const inferred = this.inferCertificationName(certificationName);
    if (inferred !== certificationName) {
      const provider = this.extractProvider(inferred);
      return {
        original: certificationName,
        expanded: inferred,
        provider,
        confidence: 'low',
        wasExpanded: true
      };
    }

    return {
      original: certificationName,
      expanded: certificationName,
      provider: this.extractProvider(certificationName),
      confidence: 'low',
      wasExpanded: false
    };
  }

  static expandMultipleCertifications(certifications: string[]): CertificationExpansionResult[] {
    return certifications.map(cert => this.expandCertification(cert));
  }

  static validateCertificationFormat(certificationName: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (certificationName.length < 5) {
      issues.push('Certification name is too short');
      suggestions.push('Provide the full official certification name');
    }

    if (!/[A-Z]/.test(certificationName)) {
      issues.push('Certification name should include proper capitalization');
      suggestions.push('Use official capitalization (e.g., AWS, Azure, Kubernetes)');
    }

    const hasProviderOrOrg = this.PROVIDER_PATTERNS.some(p => p.pattern.test(certificationName));
    if (!hasProviderOrOrg) {
      issues.push('Missing certification provider or organization');
      suggestions.push('Include the provider name (e.g., AWS, Microsoft, Google Cloud)');
    }

    const commonAbbreviations = ['cert', 'certified', 'assoc', 'prof', 'dev'];
    const hasAbbreviation = commonAbbreviations.some(abbr =>
      new RegExp(`\\b${abbr}\\b`, 'i').test(certificationName)
    );

    if (hasAbbreviation && certificationName.length < 30) {
      issues.push('Certification name may contain abbreviations');
      suggestions.push('Expand abbreviations to full official names');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  static getCertificationsByProvider(provider: string): string[] {
    return Object.values(this.CERTIFICATION_DATABASE)
      .filter(cert => cert.toLowerCase().includes(provider.toLowerCase()))
      .sort();
  }

  static suggestCertifications(skillset: string[]): string[] {
    const suggestions: string[] = [];
    const skillsetLower = skillset.map(s => s.toLowerCase());

    const certificationMapping: { [key: string]: string[] } = {
      'aws': ['AWS Certified Solutions Architect - Associate', 'AWS Certified Developer - Associate'],
      'azure': ['Microsoft Certified: Azure Fundamentals', 'Microsoft Certified: Azure Developer Associate'],
      'gcp': ['Google Cloud Certified Associate Cloud Engineer'],
      'kubernetes': ['Certified Kubernetes Administrator (CKA)', 'Certified Kubernetes Application Developer (CKAD)'],
      'java': ['Oracle Certified Professional, Java SE 11 Developer'],
      'python': ['Python Institute PCAP - Certified Associate'],
      'security': ['CompTIA Security+', 'Certified Ethical Hacker (CEH)'],
      'project management': ['Project Management Professional (PMP)', 'Certified ScrumMaster (CSM)'],
      'data': ['Microsoft Certified: Data Analyst Associate', 'Certified Data Management Professional (CDMP)'],
      'terraform': ['HashiCorp Certified: Terraform Associate'],
      'docker': ['Docker Certified Associate (DCA)']
    };

    for (const [skill, certs] of Object.entries(certificationMapping)) {
      if (skillsetLower.some(s => s.includes(skill))) {
        suggestions.push(...certs);
      }
    }

    return [...new Set(suggestions)];
  }

  private static findPartialMatch(normalized: string): string | null {
    const words = normalized.split(/\s+/);

    for (const [key, value] of Object.entries(this.CERTIFICATION_DATABASE)) {
      const keyWords = key.split(/\s+/);
      const matchedWords = words.filter(word => keyWords.includes(word));

      if (matchedWords.length >= Math.min(3, keyWords.length)) {
        return value;
      }
    }

    return null;
  }

  private static inferCertificationName(certificationName: string): string {
    let inferred = certificationName;

    if (/\bcertified\b/i.test(inferred) && !/associate|professional|specialist|expert/i.test(inferred)) {
      if (/\baws\b/i.test(inferred)) {
        inferred = inferred.replace(/\bcertified\b/i, 'Certified') + ' - Associate';
      } else if (/\bazure\b/i.test(inferred)) {
        inferred = 'Microsoft Certified: ' + inferred.replace(/\bazure\b|\bcertified\b/gi, '').trim();
      }
    }

    if (/^[A-Z]{2,5}$/i.test(inferred.trim())) {
      const acronymExpansion: { [key: string]: string } = {
        'CKA': 'Certified Kubernetes Administrator (CKA)',
        'CKAD': 'Certified Kubernetes Application Developer (CKAD)',
        'CISSP': 'Certified Information Systems Security Professional (CISSP)',
        'CEH': 'Certified Ethical Hacker (CEH)',
        'PMP': 'Project Management Professional (PMP)',
        'CSM': 'Certified ScrumMaster (CSM)',
        'CCNA': 'Cisco Certified Network Associate (CCNA)'
      };

      const upper = inferred.trim().toUpperCase();
      if (acronymExpansion[upper]) {
        return acronymExpansion[upper];
      }
    }

    if (!/certified|professional|associate|specialist|expert|foundation/i.test(inferred)) {
      const provider = this.extractProvider(inferred);
      if (provider && provider !== 'Unknown') {
        inferred = `${provider} Certified ${inferred}`;
      }
    }

    return inferred;
  }

  private static extractProvider(certificationName: string): string {
    for (const { pattern, provider } of this.PROVIDER_PATTERNS) {
      if (pattern.test(certificationName)) {
        return provider;
      }
    }

    return 'Unknown';
  }
}

export const certificationExpander = CertificationExpander;
