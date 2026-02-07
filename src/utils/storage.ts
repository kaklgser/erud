import { User, Question, AccessLog, PaymentSettings, Material, CompanyRole } from '../types';

const STORAGE_KEYS = {
  USERS: 'primojobs_users',
  QUESTIONS: 'primojobs_questions',
  ACCESS_LOGS: 'primojobs_access_logs',
  PAYMENT_SETTINGS: 'primojobs_payment_settings',
  MATERIALS: 'primojobs_materials',
  COMPANY_ROLES: 'primojobs_company_roles',
  PROMOTIONAL_DATA: 'primojobs_promotional_data',
  CURRENT_USER: 'primojobs_current_user'
};

// Initialize default data
const initializeDefaultData = () => {
  // Default payment settings
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS)) {
    const defaultSettings: PaymentSettings = {
      basePrice: 49,
      currency: 'INR',
      activeCoupons: [
        { code: 'FREE100', discount: 100, description: 'Free access' },
        { code: 'HALF50', discount: 50, description: '50% off' },
        { code: 'SAVE20', discount: 20, description: '20% discount' }
      ]
    };
    localStorage.setItem(STORAGE_KEYS.PAYMENT_SETTINGS, JSON.stringify(defaultSettings));
  }

  // Default admin user
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: User[] = [
      {
        id: 'admin',
        name: 'Admin User',
        email: 'admin@primojobs.com',
        password: 'admin123',
        isAdmin: true,
        createdAt: new Date()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  // Default company roles
  if (!localStorage.getItem(STORAGE_KEYS.COMPANY_ROLES)) {
    const defaultCompanyRoles: CompanyRole[] = [
      {
        id: '1',
        company: 'TCS',
        role: 'Assistant System Engineer',
        description: 'Entry-level software development role',
        requirements: ['B.Tech/B.E in CS/IT', 'Good programming skills', 'Problem-solving abilities'],
        examPattern: [
          { name: 'Verbal Ability', questions: 24, duration: 30, type: 'aptitude' },
          { name: 'Numerical Ability', questions: 26, duration: 40, type: 'aptitude' },
          { name: 'Reasoning Ability', questions: 30, duration: 50, type: 'aptitude' },
          { name: 'Programming Logic', questions: 10, duration: 20, type: 'coding' }
        ],
        totalQuestions: 90,
        isActive: true
      },
      {
        id: '2',
        company: 'Wipro',
        role: 'Project Engineer',
        description: 'Software development and project management role',
        requirements: ['B.Tech/B.E/MCA', 'Programming knowledge', 'Communication skills'],
        examPattern: [
          { name: 'English Language', questions: 20, duration: 20, type: 'aptitude' },
          { name: 'Quantitative Aptitude', questions: 20, duration: 30, type: 'aptitude' },
          { name: 'Logical Reasoning', questions: 20, duration: 25, type: 'aptitude' },
          { name: 'Technical Assessment', questions: 40, duration: 45, type: 'technical' }
        ],
        totalQuestions: 100,
        isActive: true
      }
    ];
    localStorage.setItem(STORAGE_KEYS.COMPANY_ROLES, JSON.stringify(defaultCompanyRoles));
  }

  // Default questions
  if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
    const defaultQuestions: Question[] = [
      {
        id: '1',
        company: 'TCS',
        role: 'Assistant System Engineer',
        category: 'coding',
        difficulty: 'medium',
        questionText: 'Write a function to find the maximum element in an array and return its index.',
        solutionText: 'To find the maximum element and its index, iterate through the array while keeping track of the maximum value and its position.',
        codeExample: `function findMaxIndex(arr) {
    if (arr.length === 0) return -1;
    
    let maxIndex = 0;
    let maxValue = arr[0];
    
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > maxValue) {
            maxValue = arr[i];
            maxIndex = i;
        }
    }
    
    return maxIndex;
}

// Example usage:
const numbers = [3, 7, 2, 9, 1];
console.log(findMaxIndex(numbers)); // Output: 3`,
        explanation: 'This solution has O(n) time complexity and O(1) space complexity. We iterate through the array once, comparing each element with the current maximum.',
        tags: ['array', 'iteration', 'maximum', 'index'],
        imageUrl: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
        price: 49,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        company: 'Wipro',
        role: 'Project Engineer',
        category: 'aptitude',
        difficulty: 'easy',
        questionText: 'If a train travels 120 km in 2 hours, what is its average speed? If it continues at the same speed, how far will it travel in 5 hours?',
        solutionText: 'Speed = Distance / Time = 120 km / 2 hours = 60 km/h. Distance in 5 hours = Speed × Time = 60 × 5 = 300 km',
        explanation: 'This is a basic speed-distance-time problem. The formula Speed = Distance/Time is fundamental. Once we know the speed, we can calculate distance for any given time using Distance = Speed × Time.',
        tags: ['speed', 'distance', 'time', 'basic-math'],
        imageUrl: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800',
        price: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        company: 'Infosys',
        role: 'Systems Engineer',
        category: 'interview',
        difficulty: 'medium',
        questionText: 'Explain the difference between SQL and NoSQL databases. When would you choose one over the other?',
        solutionText: 'SQL databases are relational with structured data and ACID properties. NoSQL databases are non-relational with flexible schema and eventual consistency.',
        explanation: 'SQL databases (like MySQL, PostgreSQL) use structured query language and are best for complex queries and transactions. NoSQL databases (like MongoDB, Cassandra) are better for large-scale, distributed applications with varying data structures.',
        tags: ['database', 'sql', 'nosql', 'system-design'],
        imageUrl: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800',
        price: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        company: 'TCS',
        role: 'Assistant System Engineer',
        category: 'coding',
        difficulty: 'hard',
        questionText: 'Implement a function to reverse a linked list iteratively and recursively.',
        solutionText: 'Both iterative and recursive approaches involve changing the direction of pointers.',
        codeExample: `// Iterative approach
function reverseListIterative(head) {
    let prev = null;
    let current = head;
    
    while (current !== null) {
        let next = current.next;
        current.next = prev;
        prev = current;
        current = next;
    }
    
    return prev;
}

// Recursive approach
function reverseListRecursive(head) {
    if (head === null || head.next === null) {
        return head;
    }
    
    let newHead = reverseListRecursive(head.next);
    head.next.next = head;
    head.next = null;
    
    return newHead;
}`,
        explanation: 'The iterative solution uses three pointers to reverse the links. The recursive solution reverses the rest of the list first, then fixes the current connection.',
        tags: ['linked-list', 'recursion', 'iteration', 'pointers'],
        price: 79,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '5',
        company: 'Wipro',
        role: 'Project Engineer',
        category: 'aptitude',
        difficulty: 'medium',
        questionText: 'A shopkeeper marks his goods 40% above cost price and gives a discount of 25%. Find his profit percentage.',
        solutionText: 'Let cost price = 100. Marked price = 140. Selling price after 25% discount = 140 × 0.75 = 105. Profit = 5%. Profit percentage = 5%',
        explanation: 'When dealing with successive percentage changes, calculate step by step. Mark up increases the price, discount decreases it from the marked price.',
        tags: ['percentage', 'profit-loss', 'discount', 'markup'],
        price: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(defaultQuestions));
  }

  // Default materials
  if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
    const defaultMaterials: Material[] = [
      {
        id: '1',
        title: 'Complete Data Structures & Algorithms Guide',
        description: 'Master DSA concepts with detailed explanations and practice problems',
        category: 'coding-guide',
        content: 'Comprehensive guide covering arrays, linked lists, trees, graphs, sorting, and searching algorithms with time complexity analysis.',
        imageUrl: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
        uploadedAt: new Date()
      },
      {
        id: '2',
        title: 'Aptitude Shortcuts & Tricks',
        description: 'Quick methods to solve quantitative aptitude problems',
        category: 'aptitude-tricks',
        content: 'Learn time-saving techniques for percentage, profit-loss, time-speed-distance, and other quantitative topics.',
        imageUrl: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800',
        uploadedAt: new Date()
      },
      {
        id: '3',
        title: 'TCS Interview Preparation Guide',
        description: 'Complete preparation guide for TCS technical interviews',
        category: 'company-specific',
        company: 'TCS',
        content: 'Detailed guide covering TCS interview process, commonly asked questions, and preparation strategies.',
        imageUrl: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800',
        uploadedAt: new Date()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(defaultMaterials));
  }

  // Default promotional data
  if (!localStorage.getItem(STORAGE_KEYS.PROMOTIONAL_DATA)) {
    const defaultPromotionalData = {
      techMahindra: {
        image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200',
        text: 'Limited Time: Free Mock Tests Available!',
        isActive: true,
        updatedDate: new Date().toISOString()
      },
      tcs: {
        image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1200',
        text: 'New Pattern Questions Added Today!',
        isActive: true,
        updatedDate: new Date().toISOString()
      },
      wipro: {
        image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200',
        text: 'Special Weekend Practice Sessions!',
        isActive: true,
        updatedDate: new Date().toISOString()
      },
      infosys: {
        image: 'https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg?auto=compress&cs=tinysrgb&w=1200',
        text: 'Interview Tips & Tricks Workshop!',
        isActive: true,
        updatedDate: new Date().toISOString()
      }
    };
    localStorage.setItem(STORAGE_KEYS.PROMOTIONAL_DATA, JSON.stringify(defaultPromotionalData));
  }
};

// Storage utility functions
export const storage = {
  // Users
  getUsers: (): User[] => {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  },
  
  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  
  // Questions
  getQuestions: (): Question[] => {
    const questions = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    const parsedQuestions = questions ? JSON.parse(questions) : [];
    
    // Sanitize questions to ensure all string properties are properly handled
    return parsedQuestions.map((question: any) => ({
      ...question,
      company: question.company && typeof question.company === 'string' ? question.company : '',
      role: question.role && typeof question.role === 'string' ? question.role : '',
      questionText: question.questionText && typeof question.questionText === 'string' ? question.questionText : '',
      solutionText: question.solutionText && typeof question.solutionText === 'string' ? question.solutionText : '',
      explanation: question.explanation && typeof question.explanation === 'string' ? question.explanation : '',
      category: question.category && typeof question.category === 'string' 
        ? question.category.toLowerCase() 
        : 'coding',
      difficulty: question.difficulty && typeof question.difficulty === 'string'
        ? question.difficulty.toLowerCase()
        : 'medium',
      tags: Array.isArray(question.tags) ? question.tags : [],
      codeExample: question.codeExample && typeof question.codeExample === 'string' ? question.codeExample : undefined,
      imageUrl: question.imageUrl && typeof question.imageUrl === 'string' ? question.imageUrl : undefined,
      price: typeof question.price === 'number' ? question.price : (question.category === 'coding' ? 49 : 0)
    }));
  },
  
  saveQuestions: (questions: Question[]) => {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  },

  // Company Roles
  getCompanyRoles: (): CompanyRole[] => {
    const roles = localStorage.getItem(STORAGE_KEYS.COMPANY_ROLES);
    return roles ? JSON.parse(roles) : [];
  },
  
  saveCompanyRoles: (roles: CompanyRole[]) => {
    localStorage.setItem(STORAGE_KEYS.COMPANY_ROLES, JSON.stringify(roles));
  },
  
  // Access Logs
  getAccessLogs: (): AccessLog[] => {
    const logs = localStorage.getItem(STORAGE_KEYS.ACCESS_LOGS);
    return logs ? JSON.parse(logs) : [];
  },
  
  saveAccessLogs: (logs: AccessLog[]) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_LOGS, JSON.stringify(logs));
  },
  
  // Payment Settings
  getPaymentSettings: (): PaymentSettings => {
    const settings = localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS);
    return settings ? JSON.parse(settings) : { basePrice: 49, currency: 'INR', activeCoupons: [] };
  },
  
  savePaymentSettings: (settings: PaymentSettings) => {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_SETTINGS, JSON.stringify(settings));
  },
  
  // Materials
  getMaterials: (): Material[] => {
    const materials = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    return materials ? JSON.parse(materials) : [];
  },
  
  saveMaterials: (materials: Material[]) => {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  },
  
  // Current User
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },
  
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // Promotional Data
  getPromotionalData: () => {
    const data = localStorage.getItem(STORAGE_KEYS.PROMOTIONAL_DATA);
    return data ? JSON.parse(data) : {};
  },
  
  savePromotionalData: (data: any) => {
    localStorage.setItem(STORAGE_KEYS.PROMOTIONAL_DATA, JSON.stringify(data));
  }
};

// Initialize default data on load
initializeDefaultData();