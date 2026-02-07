import { supabase } from '../lib/supabase';
import { Question, AccessLog, PaymentSettings, Material } from '../types';

export const supabaseStorage = {
  // Questions
  async getQuestions(): Promise<Question[]> {
    try {
      // Add timeout wrapper for all database operations
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database timeout')), 3000);
      });
      
      const dataPromise = supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await Promise.race([dataPromise, timeoutPromise]);

      if (error) {
        throw error;
      }

      return (data || []).map(q => ({
        id: q.id,
        company: q.company,
        role: q.role,
        category: q.category as 'coding' | 'aptitude' | 'interview' | 'technical',
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        questionText: q.question_text,
        solutionText: q.solution_text,
        codeExample: q.code_example,
        explanation: q.explanation,
        tags: q.tags || [],
        imageUrl: q.image_url,
        price: q.price || 0,
        createdAt: new Date(q.created_at || ''),
        updatedAt: new Date(q.updated_at || '')
      }));
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  },

  async saveQuestion(question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question | null> {
    try {
      console.log('Saving question to database:', question);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Save timeout')), 3000);
      });
      
      const savePromise = supabase
        .from('questions')
        .insert({
          company: question.company,
          role: question.role,
          category: question.category,
          difficulty: question.difficulty,
          question_text: question.questionText,
          solution_text: question.solutionText,
          code_example: question.codeExample,
          explanation: question.explanation,
          tags: question.tags,
          image_url: question.imageUrl,
          price: question.price || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      const { data, error } = await Promise.race([savePromise, timeoutPromise]);
      
      console.log('Database response:', { data, error });

      if (error) throw error;
      
      if (!data) {
        throw new Error('No data returned from database');
      }

      return {
        id: data.id,
        company: data.company,
        role: data.role,
        category: data.category as 'coding' | 'aptitude' | 'interview' | 'technical',
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
        questionText: data.question_text,
        solutionText: data.solution_text,
        codeExample: data.code_example,
        explanation: data.explanation,
        tags: data.tags || [],
        imageUrl: data.image_url,
        price: data.price || 0,
        createdAt: new Date(data.created_at || ''),
        updatedAt: new Date(data.updated_at || '')
      };
    } catch (error) {
      console.error('Error saving question:', error);
      return null;
    }
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question | null> {
    try {
      console.log('Updating question in database:', id, updates);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Update timeout')), 3000);
      });
      
      const updatePromise = supabase
        .from('questions')
        .update({
          company: updates.company,
          role: updates.role,
          category: updates.category,
          difficulty: updates.difficulty,
          question_text: updates.questionText,
          solution_text: updates.solutionText,
          code_example: updates.codeExample,
          explanation: updates.explanation,
          tags: updates.tags,
          image_url: updates.imageUrl,
          price: updates.price,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      const { data, error } = await Promise.race([updatePromise, timeoutPromise]);
      
      console.log('Update response:', { data, error });

      if (error) throw error;
      
      if (!data) {
        throw new Error('No data returned from database');
      }

      return {
        id: data.id,
        company: data.company,
        role: data.role,
        category: data.category as 'coding' | 'aptitude' | 'interview' | 'technical',
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
        questionText: data.question_text,
        solutionText: data.solution_text,
        codeExample: data.code_example,
        explanation: data.explanation,
        tags: data.tags || [],
        imageUrl: data.image_url,
        price: data.price || 0,
        createdAt: new Date(data.created_at || ''),
        updatedAt: new Date(data.updated_at || '')
      };
    } catch (error) {
      console.error('Error updating question:', error);
      return null;
    }
  },

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      console.log('Deleting question from database:', id);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Delete timeout')), 3000);
      });
      
      const deletePromise = supabase
        .from('questions')
        .delete()
        .eq('id', id);

      const { error } = await Promise.race([deletePromise, timeoutPromise]);
      
      console.log('Delete response:', { error });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  },

  // Access Logs
  async getAccessLogs(userId?: string): Promise<AccessLog[]> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Access logs timeout')), 3000);
      });
      
      let query = supabase
        .from('access_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await Promise.race([query, timeoutPromise]);

      if (error) throw error;

      return (data || []).map(log => ({
        id: log.id,
        userId: log.user_id,
        questionId: log.question_id,
        accessStartTime: new Date(log.access_start_time),
        accessExpiryTime: new Date(log.access_expiry_time),
        paymentStatus: log.payment_status,
        paymentId: log.payment_id,
        amountPaid: log.amount_paid
      }));
    } catch (error) {
      console.error('Error fetching access logs:', error);
      return [];
    }
  },

  async saveAccessLog(accessLog: Omit<AccessLog, 'id'>): Promise<AccessLog | null> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Save access log timeout')), 3000);
      });
      
      const savePromise = supabase
        .from('access_logs')
        .insert({
          user_id: accessLog.userId,
          question_id: accessLog.questionId,
          access_start_time: accessLog.accessStartTime.toISOString(),
          access_expiry_time: accessLog.accessExpiryTime.toISOString(),
          payment_status: accessLog.paymentStatus,
          payment_id: accessLog.paymentId,
          amount_paid: accessLog.amountPaid,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      const { data, error } = await Promise.race([savePromise, timeoutPromise]);

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        questionId: data.question_id,
        accessStartTime: new Date(data.access_start_time),
        accessExpiryTime: new Date(data.access_expiry_time),
        paymentStatus: data.payment_status,
        paymentId: data.payment_id,
        amountPaid: data.amount_paid
      };
    } catch (error) {
      console.error('Error saving access log:', error);
      return null;
    }
  },

  // Materials
  async getMaterials(): Promise<Material[]> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Materials timeout')), 3000);
      });
      
      const materialsPromise = supabase
        .from('materials')
        .select('*')
        .order('uploaded_at', { ascending: false });

      const { data, error } = await Promise.race([materialsPromise, timeoutPromise]);

      if (error) {
        throw error;
      }

      return (data || []).map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        category: m.category as 'interview-tips' | 'coding-guide' | 'aptitude-tricks' | 'company-specific',
        company: m.company,
        role: m.role,
        content: m.content,
        imageUrl: m.image_url,
        uploadedAt: new Date(m.uploaded_at || '')
      }));
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  },

  async saveMaterial(material: Omit<Material, 'id' | 'uploadedAt'>): Promise<Material | null> {
    try {
      console.log('Saving material to database:', material);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Save material timeout')), 3000);
      });
      
      const savePromise = supabase
        .from('materials')
        .insert({
          title: material.title,
          description: material.description,
          category: material.category,
          company: material.company,
          role: material.role,
          content: material.content,
          image_url: material.imageUrl,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      const { data, error } = await Promise.race([savePromise, timeoutPromise]);
      
      console.log('Material save response:', { data, error });

      if (error) throw error;
      
      if (!data) {
        throw new Error('No data returned from database');
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category as 'interview-tips' | 'coding-guide' | 'aptitude-tricks' | 'company-specific',
        company: data.company,
        role: data.role,
        content: data.content,
        imageUrl: data.image_url,
        uploadedAt: new Date(data.uploaded_at || '')
      };
    } catch (error) {
      console.error('Error saving material:', error);
      return null;
    }
  },

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material | null> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Update material timeout')), 3000);
      });
      
      const updatePromise = supabase
        .from('materials')
        .update({
          title: updates.title,
          description: updates.description,
          category: updates.category,
          company: updates.company,
          role: updates.role,
          content: updates.content,
          image_url: updates.imageUrl
        })
        .eq('id', id)
        .select()
        .single();

      const { data, error } = await Promise.race([updatePromise, timeoutPromise]);

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category as 'interview-tips' | 'coding-guide' | 'aptitude-tricks' | 'company-specific',
        company: data.company,
        role: data.role,
        content: data.content,
        imageUrl: data.image_url,
        uploadedAt: new Date(data.uploaded_at || '')
      };
    } catch (error) {
      console.error('Error updating material:', error);
      return null;
    }
  },

  async deleteMaterial(id: string): Promise<boolean> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Delete material timeout')), 3000);
      });
      
      const deletePromise = supabase
        .from('materials')
        .delete()
        .eq('id', id);

      const { error } = await Promise.race([deletePromise, timeoutPromise]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting material:', error);
      return false;
    }
  },

  // Payment Settings
  async getPaymentSettings(): Promise<PaymentSettings> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Payment settings timeout')), 3000);
      });
      
      const settingsPromise = supabase
        .from('payment_settings')
        .select('*')
        .limit(1)
        .single();

      const { data, error } = await Promise.race([settingsPromise, timeoutPromise]);

      if (error) {
        // If no settings exist, return default
        return {
          basePrice: 49,
          currency: 'INR',
          activeCoupons: [
            { code: 'FREE100', discount: 100, description: 'Free access' },
            { code: 'HALF50', discount: 50, description: '50% off' },
            { code: 'SAVE20', discount: 20, description: '20% discount' }
          ]
        };
      }

      return {
        basePrice: data.base_price,
        currency: data.currency,
        activeCoupons: data.active_coupons || []
      };
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      return {
        basePrice: 49,
        currency: 'INR',
        activeCoupons: []
      };
    }
  },

  async savePaymentSettings(settings: PaymentSettings): Promise<boolean> {
    try {
      console.log('Saving payment settings to database:', settings);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Save payment settings timeout')), 3000);
      });
      
      const savePromise = supabase
        .from('payment_settings')
        .upsert({
          id: '1', // Use a fixed ID for singleton
          base_price: settings.basePrice,
          currency: settings.currency,
          active_coupons: settings.activeCoupons,
          updated_at: new Date().toISOString()
        });

      const { error } = await Promise.race([savePromise, timeoutPromise]);
      
      console.log('Payment settings save response:', { error });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving payment settings:', error);
      return false;
    }
  },

  // User Profile
  async getUserProfile(userId: string): Promise<any> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('User profile timeout')), 3000);
      });
      
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  async updateUserProfile(userId: string, updates: { name?: string; email?: string }): Promise<boolean> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Update profile timeout')), 3000);
      });
      
      const updatePromise = supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      const { error } = await Promise.race([updatePromise, timeoutPromise]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }
};