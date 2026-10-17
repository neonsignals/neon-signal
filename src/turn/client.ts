const STORAGE_KEY = 'neon-signal:turn-provider'
export const PROVIDERS = ['cloudflare', 'metered', 'auto'] as const
export type TurnProvider = (typeof PROVIDERS)[number]

const CACHE_TTL_MS = 20 * 60 * 1000
let cache: { at: number; provider: TurnProvider; iceServers: RTCIceServer[] } | null = null

export function getActiveProvider(): TurnProvider {
  const stored = localStorage.getItem(STORAGE_KEY)
  const fromUrl = new URLSearchParams(location.search).get('turn')
  const candidate = fromUrl ?? stored
  return (PROVIDERS as readonly string[]).includes(candidate ?? '')
    ? (candidate as TurnProvider)
    : 'cloudflare'
}

export function setActiveProvider(provider: TurnProvider): void {
  if (!PROVIDERS.includes(provider)) return
  localStorage.setItem(STORAGE_KEY, provider)
  cache = null
  window.dispatchEvent(new CustomEvent('neon-signal:turn-changed', { detail: provider }))
}

export async function getIceServers(): Promise<RTCIceServer[]> {
  const provider = getActiveProvider()

  if (cache && cache.provider === provider && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.iceServers
  }

  // FIXED: always pass the provider to the server.
  //   provider=metered  → Metered only
  //   provider=cloudflare → Cloudflare only
  //   provider=auto     → server tries primary, falls back on failure
  // Sending NO param means "server DEFAULT_TURN_PROVIDER, single provider",
  // which is not what 'auto' is supposed to mean.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  let res: Response
  try {
    res = await fetch(`/api/turn?provider=${provider}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) throw new Error(`turn endpoint ${res.status}`)

  // FIXED: check content-type before .json() so a stray HTML page gives a
  // clear error instead of "Unexpected token '<'".
  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    throw new Error(`turn endpoint returned non-JSON (content-type: ${ct || 'none'})`)
  }

  const data = (await res.json()) as { iceServers: RTCIceServer[] }
  if (!Array.isArray(data.iceServers) || data.iceServers.length === 0) {
    throw new Error('turn endpoint returned no iceServers')
  }

  cache = { at: Date.now(), provider, iceServers: data.iceServers }
  return data.iceServers
}