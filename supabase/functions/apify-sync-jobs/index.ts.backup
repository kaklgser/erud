import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ApifyJobData {
  id?: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  salary?: string;
  jobType?: string;
  experienceLevel?: string;
  skills?: string[];
  postedDate?: string;
  applyUrl: string;
  [key: string]: any;
}

interface SyncStats {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { configId } = await req.json();

    let configs;
    if (configId) {
      const { data, error } = await supabase
        .from('job_fetch_configs')
        .select('*')
        .eq('id', configId)
        .eq('is_active', true)
        .single();

      if (error) throw new Error(`Config not found: ${error.message}`);
      configs = [data];
    } else {
      const { data, error } = await supabase
        .from('job_fetch_configs')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      configs = data || [];
    }

    if (configs.length === 0) {
      throw new Error('No active configurations found');
    }

    const results = [];

    for (const config of configs) {
      const syncResult = await syncJobsForConfig(supabase, config);
      results.push(syncResult);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in apify-sync-jobs:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function syncJobsForConfig(supabase: any, config: any) {
  const logId = crypto.randomUUID();
  const startTime = new Date().toISOString();

  await supabase.from('job_sync_logs').insert({
    id: logId,
    config_id: config.id,
    platform_name: config.platform_name,
    sync_started_at: startTime,
    status: 'running',
  });

  try {
    const apifyToken = config.apify_api_token;
    const actorId = config.actor_id;
    const searchConfig = config.search_config;

    console.log(`Starting sync for ${config.platform_name} (${actorId})`);

    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchConfig),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Apify API error: ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    const datasetId = runData.data.defaultDatasetId;

    console.log(`Apify run started: ${runId}, waiting for completion...`);

    await waitForRunCompletion(apifyToken, runId);

    console.log(`Fetching results from dataset: ${datasetId}`);

    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items`,
      {
        headers: {
          'Authorization': `Bearer ${apifyToken}`,
        },
      }
    );

    if (!datasetResponse.ok) {
      throw new Error('Failed to fetch dataset');
    }

    const jobs: ApifyJobData[] = await datasetResponse.json();

    console.log(`Fetched ${jobs.length} jobs from Apify`);

    const stats: SyncStats = {
      fetched: jobs.length,
      created: 0,
      updated: 0,
      skipped: 0,
    };

    for (const job of jobs) {
      const result = await processJob(supabase, job, config.platform_name);
      if (result === 'created') stats.created++;
      else if (result === 'updated') stats.updated++;
      else stats.skipped++;
    }

    const endTime = new Date().toISOString();

    await supabase
      .from('job_sync_logs')
      .update({
        sync_completed_at: endTime,
        status: 'success',
        jobs_fetched: stats.fetched,
        jobs_created: stats.created,
        jobs_updated: stats.updated,
        jobs_skipped: stats.skipped,
        sync_metadata: {
          apify_run_id: runId,
          dataset_id: datasetId,
        },
      })
      .eq('id', logId);

    await supabase
      .from('job_fetch_configs')
      .update({ last_sync_at: endTime })
      .eq('id', config.id);

    return {
      configId: config.id,
      platform: config.platform_name,
      success: true,
      stats,
    };
  } catch (error) {
    console.error(`Error syncing ${config.platform_name}:`, error);

    await supabase
      .from('job_sync_logs')
      .update({
        sync_completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', logId);

    return {
      configId: config.id,
      platform: config.platform_name,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function waitForRunCompletion(
  apifyToken: string,
  runId: string,
  maxWaitTime = 300000
): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 5000;

  while (Date.now() - startTime < maxWaitTime) {
    const response = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}`,
      {
        headers: {
          'Authorization': `Bearer ${apifyToken}`,
        },
      }
    );

    const data = await response.json();
    const status = data.data.status;

    if (status === 'SUCCEEDED') {
      return;
    } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify run ${status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Apify run timed out');
}

async function processJob(
  supabase: any,
  job: ApifyJobData,
  platform: string
): Promise<'created' | 'updated' | 'skipped'> {
  try {
    const apifyJobId = job.id || `${platform}-${job.title}-${job.company}`.replace(/[^a-zA-Z0-9-]/g, '-');

    const { data: existing } = await supabase
      .from('job_listings')
      .select('id')
      .eq('apify_job_id', apifyJobId)
      .maybeSingle();

    const jobData = mapApifyJobToListing(job, platform, apifyJobId);

    if (existing) {
      const { error } = await supabase
        .from('job_listings')
        .update(jobData)
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating job:', error);
        return 'skipped';
      }
      return 'updated';
    } else {
      const { error } = await supabase
        .from('job_listings')
        .insert(jobData);

      if (error) {
        console.error('Error inserting job:', error);
        return 'skipped';
      }
      return 'created';
    }
  } catch (error) {
    console.error('Error processing job:', error);
    return 'skipped';
  }
}

function mapApifyJobToListing(
  job: ApifyJobData,
  platform: string,
  apifyJobId: string
): any {
  const extractSalary = (salaryStr?: string): number | null => {
    if (!salaryStr) return null;
    const match = salaryStr.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  };

  const extractLocation = (location?: string): { type: string; city?: string } => {
    if (!location) return { type: 'Onsite' };
    const lower = location.toLowerCase();
    if (lower.includes('remote')) return { type: 'Remote' };
    if (lower.includes('hybrid')) return { type: 'Hybrid', city: location };
    return { type: 'Onsite', city: location };
  };

  const location = extractLocation(job.location);
  const salary = extractSalary(job.salary);

  return {
    apify_job_id: apifyJobId,
    source_platform: platform,
    last_synced_at: new Date().toISOString(),
    company_name: job.company || 'Unknown Company',
    role_title: job.title,
    package_amount: salary,
    package_type: salary ? 'CTC' : null,
    domain: 'Technology',
    location_type: location.type,
    location_city: location.city,
    experience_required: job.experienceLevel || 'Not specified',
    qualification: 'Bachelor\'s Degree',
    short_description: job.description?.substring(0, 200) || job.title,
    description: job.description || '',
    full_description: job.description || '',
    application_link: job.applyUrl,
    posted_date: job.postedDate || new Date().toISOString(),
    source_api: `apify-${platform}`,
    is_active: true,
    skills: job.skills || [],
  };
}
