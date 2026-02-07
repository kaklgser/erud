import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const HARDCODED_CONFIG = {
  apifyToken: 'apify_api_eF2gvPqJlLnUWFQVgYLZLN2WXMYRiO2JKrPD',
  actorId: 'curious_coder/linkedin-jobs-search-scraper',
  platformName: 'LinkedIn',
  searchConfig: {
    searchQueries: ['fresher software engineer india', 'entry level developer india', 'graduate trainee IT india'],
    location: 'India',
    maxResults: 50,
    proxy: { useApifyProxy: true }
  }
};

interface ApifyJobData {
  id?: string;
  title: string;
  company: string;
  companyName?: string;
  location?: string;
  companyLogo?: string;
  companyLogoUrl?: string;
  logo?: string;
  logoUrl?: string;
  description: string;
  salary?: string;
  jobType?: string;
  experienceLevel?: string;
  skills?: string[];
  postedDate?: string;
  postedAt?: string;
  applyUrl?: string;
  link?: string;
  jobUrl?: string;
  [key: string]: unknown;
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const logId = crypto.randomUUID();
  const startTime = new Date().toISOString();

  try {
    await supabase.from('job_sync_logs').insert({
      id: logId,
      platform_name: HARDCODED_CONFIG.platformName,
      sync_started_at: startTime,
      status: 'running',
    });

    console.log(`Starting sync for ${HARDCODED_CONFIG.platformName}`);

    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${HARDCODED_CONFIG.actorId}/runs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HARDCODED_CONFIG.apifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(HARDCODED_CONFIG.searchConfig),
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

    await waitForRunCompletion(HARDCODED_CONFIG.apifyToken, runId);

    console.log(`Fetching results from dataset: ${datasetId}`);

    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items`,
      {
        headers: {
          'Authorization': `Bearer ${HARDCODED_CONFIG.apifyToken}`,
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
      const result = await processJob(supabase, job, HARDCODED_CONFIG.platformName);
      if (result === 'created') stats.created++;
      else if (result === 'updated') stats.updated++;
      else stats.skipped++;
    }

    const endTime = new Date().toISOString();
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const durationSeconds = Math.round(durationMs / 1000);

    await supabase
      .from('job_sync_logs')
      .update({
        sync_completed_at: endTime,
        status: 'success',
        jobs_fetched: stats.fetched,
        jobs_created: stats.created,
        jobs_updated: stats.updated,
        jobs_skipped: stats.skipped,
        duration_seconds: durationSeconds,
        sync_metadata: {
          apify_run_id: runId,
          dataset_id: datasetId,
        },
      })
      .eq('id', logId);

    return new Response(
      JSON.stringify({
        success: true,
        platform: HARDCODED_CONFIG.platformName,
        stats,
        durationSeconds,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in sync-jobs:', error);

    await supabase
      .from('job_sync_logs')
      .update({
        sync_completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', logId);

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
  supabase: ReturnType<typeof createClient>,
  job: ApifyJobData,
  platform: string
): Promise<'created' | 'updated' | 'skipped'> {
  try {
    const companyName = job.company || job.companyName || 'Unknown Company';
    const title = job.title || 'Untitled Position';
    const apifyJobId = job.id || `${platform}-${title}-${companyName}`.replace(/[^a-zA-Z0-9-]/g, '-').substring(0, 100);

    const { data: existing } = await supabase
      .from('job_listings')
      .select('id')
      .eq('apify_job_id', apifyJobId)
      .maybeSingle();

    const jobData = mapApifyJobToListing(job, platform, apifyJobId);

    if (existing) {
      const { error } = await supabase
        .from('job_listings')
        .update({
          ...jobData,
          last_synced_at: new Date().toISOString(),
        })
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
): Record<string, unknown> {
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
  const companyLogo = job.companyLogo || job.companyLogoUrl || job.logo || job.logoUrl || null;
  const salary = extractSalary(job.salary);
  const applyUrl = job.applyUrl || job.link || job.jobUrl || '';
  const description = job.description || '';

  return {
    apify_job_id: apifyJobId,
    source_platform: platform,
    last_synced_at: new Date().toISOString(),
    company_logo_url: companyLogo,
    company_name: job.company || job.companyName || 'Unknown Company',
    role_title: job.title || 'Untitled Position',
    package_amount: salary,
    package_type: salary ? 'CTC' : null,
    domain: 'Technology',
    location_type: location.type,
    location_city: location.city,
    experience_required: job.experienceLevel || 'Entry Level',
    qualification: "Bachelor's Degree",
    short_description: description.substring(0, 200) || job.title,
    description: description,
    full_description: description,
    application_link: applyUrl,
    posted_date: job.postedDate || job.postedAt || new Date().toISOString(),
    source_api: `apify-${platform.toLowerCase()}`,
    is_active: true,
  };
}