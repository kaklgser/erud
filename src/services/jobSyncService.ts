import { supabase } from '../lib/supabase';

export interface SyncLog {
  id: string;
  platform_name: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  status: 'running' | 'success' | 'failed' | 'partial';
  jobs_fetched: number | null;
  jobs_created: number | null;
  jobs_updated: number | null;
  jobs_skipped: number | null;
  error_message: string | null;
  duration_seconds: number | null;
  sync_metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SyncStats {
  totalActiveJobs: number;
  lastSync: SyncLog | null;
  recentSyncs: SyncLog[];
  totalJobsCreatedLast24h: number;
  totalJobsUpdatedLast24h: number;
}

class JobSyncService {
  async getActiveJobsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('job_listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching active jobs count:', error);
      return 0;
    }

    return count || 0;
  }

  async getSyncLogs(limit = 10): Promise<SyncLog[]> {
    const { data, error } = await supabase
      .from('job_sync_logs')
      .select('*')
      .order('sync_started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sync logs:', error);
      return [];
    }

    return data || [];
  }

  async getLastSync(): Promise<SyncLog | null> {
    const { data, error } = await supabase
      .from('job_sync_logs')
      .select('*')
      .order('sync_started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching last sync:', error);
      return null;
    }

    return data;
  }

  async getSyncStats(): Promise<SyncStats> {
    const [activeJobsCount, recentSyncs, last24hStats] = await Promise.all([
      this.getActiveJobsCount(),
      this.getSyncLogs(10),
      this.getLast24hStats(),
    ]);

    return {
      totalActiveJobs: activeJobsCount,
      lastSync: recentSyncs[0] || null,
      recentSyncs,
      totalJobsCreatedLast24h: last24hStats.created,
      totalJobsUpdatedLast24h: last24hStats.updated,
    };
  }

  async getLast24hStats(): Promise<{ created: number; updated: number }> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data, error } = await supabase
      .from('job_sync_logs')
      .select('jobs_created, jobs_updated')
      .gte('sync_started_at', yesterday.toISOString())
      .eq('status', 'success');

    if (error) {
      console.error('Error fetching 24h stats:', error);
      return { created: 0, updated: 0 };
    }

    const totals = (data || []).reduce(
      (acc, log) => ({
        created: acc.created + (log.jobs_created || 0),
        updated: acc.updated + (log.jobs_updated || 0),
      }),
      { created: 0, updated: 0 }
    );

    return totals;
  }

  async triggerSync(): Promise<{ success: boolean; error?: string; stats?: Record<string, unknown> }> {
    try {
      const response = await supabase.functions.invoke('sync-jobs', {
        body: {},
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        success: true,
        stats: response.data,
      };
    } catch (error) {
      console.error('Error triggering sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async isCurrentlyRunning(): Promise<boolean> {
    const { data, error } = await supabase
      .from('job_sync_logs')
      .select('id')
      .eq('status', 'running')
      .limit(1);

    if (error) {
      console.error('Error checking running status:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  }
}

export const jobSyncService = new JobSyncService();
