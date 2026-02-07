import { supabase } from '../lib/supabase';
import type { JobUpdate, JobUpdateCategory, JobUpdateMetadata } from '../types/jobs';

export class JobUpdatesService {
  async getAllUpdates(activeOnly: boolean = false): Promise<JobUpdate[]> {
    let query = supabase
      .from('job_updates')
      .select('*')
      .order('published_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getLatestUpdates(limit: number = 10): Promise<JobUpdate[]> {
    const { data, error } = await supabase
      .from('job_updates')
      .select('*')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getFeaturedUpdates(): Promise<JobUpdate[]> {
    const { data, error } = await supabase
      .from('job_updates')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  }

  async getUpdatesByCategory(category: JobUpdateCategory): Promise<JobUpdate[]> {
    const { data, error } = await supabase
      .from('job_updates')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getUpdateById(id: string): Promise<JobUpdate | null> {
    const { data, error } = await supabase
      .from('job_updates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createUpdate(update: Omit<JobUpdate, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<JobUpdate> {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('job_updates')
      .insert({
        ...update,
        created_by: userData?.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUpdate(id: string, updates: Partial<JobUpdate>): Promise<JobUpdate> {
    const { data, error } = await supabase
      .from('job_updates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteUpdate(id: string): Promise<void> {
    const { error } = await supabase
      .from('job_updates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleActive(id: string, isActive: boolean): Promise<JobUpdate> {
    return this.updateUpdate(id, { is_active: isActive });
  }

  async toggleFeatured(id: string, isFeatured: boolean): Promise<JobUpdate> {
    return this.updateUpdate(id, { is_featured: isFeatured });
  }

  getCategoryLabel(category: JobUpdateCategory): string {
    const labels: Record<JobUpdateCategory, string> = {
      market_trend: 'Market Trend',
      hiring_news: 'Hiring News',
      industry_update: 'Industry Update',
      platform_update: 'Platform Update',
      salary_insights: 'Salary Insights',
      skill_demand: 'Skill Demand'
    };
    return labels[category];
  }

  getCategoryColor(category: JobUpdateCategory): string {
    const colors: Record<JobUpdateCategory, string> = {
      market_trend: 'bg-blue-100 text-blue-800 border-blue-200',
      hiring_news: 'bg-green-100 text-green-800 border-green-200',
      industry_update: 'bg-purple-100 text-purple-800 border-purple-200',
      platform_update: 'bg-orange-100 text-orange-800 border-orange-200',
      salary_insights: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      skill_demand: 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[category];
  }

  validateMetadata(metadata: JobUpdateMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      JSON.stringify(metadata);
    } catch (error) {
      errors.push('Invalid JSON format');
    }

    if (metadata.tags && !Array.isArray(metadata.tags)) {
      errors.push('Tags must be an array');
    }

    if (metadata.links && !Array.isArray(metadata.links)) {
      errors.push('Links must be an array');
    }

    if (metadata.links) {
      metadata.links.forEach((link, index) => {
        if (!link.title || !link.url) {
          errors.push(`Link ${index + 1} must have both title and url`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  generateDefaultMetadata(category: JobUpdateCategory): JobUpdateMetadata {
    const defaults: Record<JobUpdateCategory, JobUpdateMetadata> = {
      market_trend: {
        tags: ['trending', 'analysis'],
        stats: {}
      },
      hiring_news: {
        tags: ['hiring', 'opportunities'],
        companies: []
      },
      industry_update: {
        tags: ['industry', 'news']
      },
      platform_update: {
        tags: ['update', 'feature']
      },
      salary_insights: {
        tags: ['salary', 'compensation'],
        stats: {}
      },
      skill_demand: {
        tags: ['skills', 'demand'],
        stats: {}
      }
    };

    return defaults[category];
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    featured: number;
    byCategory: Record<JobUpdateCategory, number>;
  }> {
    const { data: updates, error } = await supabase
      .from('job_updates')
      .select('*');

    if (error) throw error;

    const stats = {
      total: updates?.length || 0,
      active: updates?.filter(u => u.is_active).length || 0,
      featured: updates?.filter(u => u.is_featured).length || 0,
      byCategory: {
        market_trend: 0,
        hiring_news: 0,
        industry_update: 0,
        platform_update: 0,
        salary_insights: 0,
        skill_demand: 0
      } as Record<JobUpdateCategory, number>
    };

    updates?.forEach(update => {
      if (update.category in stats.byCategory) {
        stats.byCategory[update.category as JobUpdateCategory]++;
      }
    });

    return stats;
  }
}

export const jobUpdatesService = new JobUpdatesService();
