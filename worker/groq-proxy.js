// Cloudflare Worker: keeps the Groq key on the server so it never ships in the page.
// Setup: create a Worker, paste this file, then add a secret named GROQ_API_KEY
// (Settings > Variables and Secrets). Put the Worker's URL in AI_ENDPOINT in index.html.
const ALLOWED_ORIGINS = ['https://c-sawe.github.io', 'https://c-sawe.is-a.dev'];
// Tried in order; the first one Groq accepts is used. Smallest and cheapest first.
const MODELS = ['llama-3.1-8b-instant', 'openai/gpt-oss-20b'];
const MAX_PROMPT = 24000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply(405, { error: 'Send a POST request.' });
    if (!ALLOWED_ORIGINS.includes(origin)) return reply(403, { error: 'This origin is not allowed.' });

    let prompt = '';
    try { prompt = String((await request.json()).prompt || ''); } catch (e) { return reply(400, { error: 'The request body must be JSON.' }); }
    if (!prompt || prompt.length > MAX_PROMPT) return reply(400, { error: 'The question is missing or too long.' });

    let last = { status: 502, error: 'No model answered.' };
    for (const model of MODELS) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 260, temperature: 0.2, messages: [{ role: 'user', content: prompt }] }),
      });
      if (r.ok) {
        const j = await r.json();
        const choice = (j.choices || [])[0] || {};
        return reply(200, { text: (choice.message && choice.message.content) || '', truncated: choice.finish_reason === 'length', model });
      }
      last = { status: r.status === 429 ? 429 : 502, error: r.status === 429 ? 'Rate limited. Try again in a minute.' : `Groq answered ${r.status} for ${model}.` };
      if (r.status === 429 || r.status === 401) break;   // another model will not fix these
    }
    return reply(last.status, { error: last.error });
  },
};
