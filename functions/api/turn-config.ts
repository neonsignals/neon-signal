// functions/api/turn-config.ts

const DEFAULT_PROVIDER = 'cloudflare'
const ALLOWED = new Set(['cloudflare', 'metered'])

export async function onRequestGet({ env }: { env: any }): Promise<Response> {
  let provider = DEFAULT_PROVIDER
  try {
    const stored = await env.TURN_CONFIG?.get('active_provider')
    if (stored && ALLOWED.has(stored)) provider = stored
  } catch {
    /* fail open */
  }

  return new Response(JSON.stringify({ provider }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store, max-age=0',
    },
  })
}