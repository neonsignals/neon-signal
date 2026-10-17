type IceServer = {
  urls: string | string[]
  username?: string
  credential?: string
}

type Env = {
  CLOUDFLARE_TURN_KEY_ID?: string
  CLOUDFLARE_TURN_API_TOKEN?: string
  METERED_TURN_USERNAME?: string
  METERED_TURN_CREDENTIAL?: string
  DEFAULT_TURN_PROVIDER?: string
}

const METERED_URLS = [
  'stun:stun.relay.metered.ca:80',
  'turn:standard.relay.metered.ca:80',
  'turn:standard.relay.metered.ca:80?transport=tcp',
  'turn:standard.relay.metered.ca:443',
  'turns:standard.relay.metered.ca:443?transport=tcp',
]

async function cloudflareIceServers(env: Env, ttl = 86400): Promise<IceServer[]> {
  if (!env.CLOUDFLARE_TURN_KEY_ID || !env.CLOUDFLARE_TURN_API_TOKEN) {
    throw new Error('cloudflare credentials missing')
  }

  const res = await fetch(
    `https://rtc.live.cloudflare.com/v1/turn/keys/${env.CLOUDFLARE_TURN_KEY_ID}/credentials/generate-ice-servers`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_TURN_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ttl }),
    }
  )

  if (!res.ok) throw new Error(`cloudflare ${res.status}`)
  const data = (await res.json()) as { iceServers: IceServer[] }
  return data.iceServers
}

function meteredIceServers(env: Env): IceServer[] {
  const { METERED_TURN_USERNAME: username, METERED_TURN_CREDENTIAL: credential } = env
  if (!username || !credential) throw new Error('metered credentials missing')

  return METERED_URLS.map((urls) =>
    urls.startsWith('stun:') ? { urls } : { urls, username, credential }
  )
}

const PROVIDERS: Record<string, (env: Env) => Promise<IceServer[]>> = {
  cloudflare: (env) => cloudflareIceServers(env),
  metered: async (env) => meteredIceServers(env),
}

export async function buildIceServers(
  requested: string | null,
  env: Env
): Promise<{ status: number; body: unknown }> {
  const wantsFallback = requested === 'auto'
  const primary =
    requested && PROVIDERS[requested]
      ? requested
      : env.DEFAULT_TURN_PROVIDER ?? 'cloudflare'

  const order = wantsFallback
    ? [primary, ...Object.keys(PROVIDERS).filter((p) => p !== primary)]
    : [primary]

  const settled = await Promise.allSettled(order.map((p) => PROVIDERS[p]!(env)))

  const iceServers: IceServer[] = []
  const failures: string[] = []

  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') iceServers.push(...r.value)
    else failures.push(`${order[i]}: ${r.reason?.message ?? 'failed'}`)
  })

  if (!iceServers.length) {
    return { status: 502, body: { error: 'all providers failed', failures } }
  }

  return { status: 200, body: { provider: primary, iceServers, failures } }
}

export const onRequestGet = async (context: {
  request: Request
  env: Env
}): Promise<Response> => {
  const url = new URL(context.request.url)
  const result = await buildIceServers(url.searchParams.get('provider'), context.env)

  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}