import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

    console.log('Starting Apify cron scheduler check...');

    const { data: configs, error } = await supabase
      .from('job_fetch_configs')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch configs: ${error.message}`);
    }

    if (!configs || configs.length === 0) {
      console.log('No active configurations found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active configurations to sync',
          triggered: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const now = new Date();
    const configsToSync = [];

    for (const config of configs) {
      const shouldSync = checkIfSyncNeeded(config, now);
      if (shouldSync) {
        configsToSync.push(config);
      }
    }

    console.log(`Found ${configsToSync.length} configs that need syncing`);

    if (configsToSync.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All configurations are up to date',
          triggered: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const results = [];

    for (const config of configsToSync) {
      console.log(`Triggering sync for ${config.platform_name} (${config.id})`);
      
      try {
        const syncResponse = await fetch(
          `${supabaseUrl}/functions/v1/apify-sync-jobs`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ configId: config.id }),
          }
        );

        const syncResult = await syncResponse.json();
        results.push({
          configId: config.id,
          platform: config.platform_name,
          success: syncResult.success,
          result: syncResult,
        });
      } catch (error) {
        console.error(`Error triggering sync for ${config.platform_name}:`, error);
        results.push({
          configId: config.id,
          platform: config.platform_name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Triggered ${configsToSync.length} syncs`,
        triggered: configsToSync.length,
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
    console.error('Error in apify-cron-scheduler:', error);
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

function checkIfSyncNeeded(config: any, now: Date): boolean {
  if (!config.last_sync_at) {
    console.log(`${config.platform_name}: Never synced, triggering sync`);
    return true;
  }

  const lastSync = new Date(config.last_sync_at);
  const syncFrequencyMs = (config.sync_frequency_hours || 8) * 60 * 60 * 1000;
  const timeSinceLastSync = now.getTime() - lastSync.getTime();

  const shouldSync = timeSinceLastSync >= syncFrequencyMs;

  if (shouldSync) {
    console.log(
      `${config.platform_name}: Last sync was ${Math.round(timeSinceLastSync / 1000 / 60)} minutes ago, triggering sync`
    );
  } else {
    const nextSyncIn = Math.round((syncFrequencyMs - timeSinceLastSync) / 1000 / 60);
    console.log(
      `${config.platform_name}: Next sync in ${nextSyncIn} minutes`
    );
  }

  return shouldSync;
}
