export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  createdAt: Date;
}

export interface Question {
  id: string;
  company: string;
  role: string;
  category: 'coding' | 'aptitude' | 'interview' | 'technical';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  solutionText: string;
  codeExample?: string;
  explanation: string;
  tags: string[];
  imageUrl?: string;
  price?: number;
  isActive?: boolean;
  showOnHomepage?: boolean;
  homepageOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessLog {
  id: string;
  userId: string;
  questionId: string;
  accessStartTime: Date;
  accessExpiryTime: Date;
  paymentStatus: boolean;
  paymentId?: string;
  amountPaid: number;
}

export interface PaymentSettings {
  basePrice: number;
  currency: string;
  activeCoupons: CouponCode[];
}

export interface CouponCode {
  code: string;
  discount: number;
  description?: string;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  category: 'interview-tips' | 'coding-guide' | 'aptitude-tricks' | 'company-specific';
  company?: string;
  role?: string;
  content: string;
  imageUrl: string;
  uploadedAt: Date;
}

export interface CompanyRole {
  id: string;
  company: string;
  role: string;
  description: string;
  requirements: string[];
  examPattern: ExamSection[];
  totalQuestions: number;
  isActive: boolean;
}

export interface ExamSection {
  name: string;
  questions: number;
  duration: number;
  type: 'coding' | 'aptitude' | 'technical' | 'interview';
}