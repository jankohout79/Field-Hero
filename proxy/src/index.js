const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_BODY_BYTES = 20_000;

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN;
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/v1/messages') {
      return new Response('Not found', { status: 404, headers });
    }

    const bodyText = await request.text();
    if (bodyText.length > MAX_BODY_BYTES) {
      return new Response('Payload too large', { status: 413, headers });
    }

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return new Response('Invalid JSON', { status: 400, headers });
    }

    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    const respBody = await upstream.text();
    return new Response(respBody, {
      status: upstream.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  },
};
