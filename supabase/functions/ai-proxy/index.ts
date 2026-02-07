// supabase/functions/ai-proxy/index.ts
// Unified proxy for all AI API calls - keeps all API keys secure on server side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const jsonResponse = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { service, action, ...params } = await req.json();

    switch (service) {
      case 'edenai':
        return await handleEdenAI(action, params);
      case 'openrouter':
        return await handleOpenRouter(action, params);
      case 'gemini':
        return await handleGemini(action, params);
      case 'github':
        return await handleGitHub(action, params);
      default:
        return jsonResponse({ error: `Unknown service: ${service}` }, 400);
    }
  } catch (error: any) {
    console.error('AI Proxy Error:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
});

// ======================
// EDENAI
// ======================
async function handleEdenAI(action: string, params: any) {
  const API_KEY = Deno.env.get('EDENAI_API_KEY');
  if (!API_KEY) return jsonResponse({ error: 'EDENAI_API_KEY not configured' }, 500);

  switch (action) {
    case 'ocr_async': {
      const { fileBase64, fileName, fileType } = params;
      const bytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: fileType });
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('providers', 'mistral'); // Cheapest OCR option ($1/1K pages)
      formData.append('language', 'en');

      const res = await fetch('https://api.edenai.run/v2/ocr/ocr_async', {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}` },
        body: formData,
      });
      return jsonResponse(await res.json(), res.status);
    }

    case 'ocr_status': {
      console.log('Checking OCR status for job:', params.jobId);
      const res = await fetch(`https://api.edenai.run/v2/ocr/ocr_async/${params.jobId}`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      const data = await res.json();
      console.log('OCR status response:', JSON.stringify(data).slice(0, 500));
      return jsonResponse(data, res.status);
    }

    case 'chat': {
      const { prompt, provider = 'openai', temperature = 0.1, maxTokens = 4000 } = params;
      const res = await fetch('https://api.edenai.run/v2/text/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providers: provider,
          text: prompt,
          chatbot_global_action: 'You are an expert assistant.',
          previous_history: [],
          temperature,
          max_tokens: maxTokens,
        }),
      });
      return jsonResponse(await res.json(), res.status);
    }

    case 'summarize': {
      const { text, outputLength = 'medium' } = params;
      const res = await fetch('https://api.edenai.run/v2/text/summarize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providers: 'openai',
          text,
          output_sentences: outputLength === 'short' ? 3 : outputLength === 'long' ? 10 : 5,
          language: 'en',
        }),
      });
      return jsonResponse(await res.json(), res.status);
    }

    case 'moderation': {
      const { text } = params;
      const res = await fetch('https://api.edenai.run/v2/text/moderation', {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providers: 'openai',
          text: text.slice(0, 10000),
          language: 'en',
        }),
      });
      return jsonResponse(await res.json(), res.status);
    }

    case 'spell_check': {
      const { text } = params;
      const res = await fetch('https://api.edenai.run/v2/text/spell_check', {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providers: 'openai',
          text: text.slice(0, 10000),
          language: 'en',
        }),
      });
      return jsonResponse(await res.json(), res.status);
    }

    default:
      return jsonResponse({ error: `Unknown EdenAI action: ${action}` }, 400);
  }
}


// ======================
// OPENROUTER
// ======================
async function handleOpenRouter(action: string, params: any) {
  const API_KEY = Deno.env.get('OPENROUTER_API_KEY');
  if (!API_KEY) return jsonResponse({ error: 'OPENROUTER_API_KEY not configured' }, 500);

  switch (action) {
    case 'chat': {
      const { prompt, model = 'google/gemini-2.5-flash', temperature = 0.3, maxTokens = 4000 } = params;
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      });
      return jsonResponse(await res.json(), res.status);
    }

    case 'chat_with_system': {
      const { systemPrompt, userPrompt, model = 'google/gemini-2.5-flash', temperature = 0.3 } = params;
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
        }),
      });
      return jsonResponse(await res.json(), res.status);
    }

    default:
      return jsonResponse({ error: `Unknown OpenRouter action: ${action}` }, 400);
  }
}

// ======================
// GEMINI
// ======================
async function handleGemini(action: string, params: any) {
  const API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!API_KEY) return jsonResponse({ error: 'GEMINI_API_KEY not configured' }, 500);

  switch (action) {
    case 'generate': {
      const { prompt, model = 'gemini-pro' } = params;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      return jsonResponse(await res.json(), res.status);
    }

    default:
      return jsonResponse({ error: `Unknown Gemini action: ${action}` }, 400);
  }
}

// ======================
// GITHUB
// ======================
async function handleGitHub(action: string, params: any) {
  const API_TOKEN = Deno.env.get('GITHUB_API_TOKEN');
  if (!API_TOKEN) return jsonResponse({ error: 'GITHUB_API_TOKEN not configured' }, 500);

  const headers = {
    Authorization: `Bearer ${API_TOKEN}`,
    'User-Agent': 'PrimoBoostAI',
    Accept: 'application/vnd.github.v3+json',
  };

  switch (action) {
    case 'user': {
      const res = await fetch(`https://api.github.com/users/${params.username}`, { headers });
      return jsonResponse(await res.json(), res.status);
    }

    case 'repo': {
      const res = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}`, { headers });
      return jsonResponse(await res.json(), res.status);
    }

    case 'commits': {
      const res = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/commits`, { headers });
      return jsonResponse(await res.json(), res.status);
    }

    case 'search_repos': {
      const { query, sort = 'stars', order = 'desc', perPage = 10 } = params;
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&per_page=${perPage}`;
      const res = await fetch(url, { headers });
      return jsonResponse(await res.json(), res.status);
    }

    default:
      return jsonResponse({ error: `Unknown GitHub action: ${action}` }, 400);
  }
}
