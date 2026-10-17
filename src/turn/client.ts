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

  const qs = provider === 'auto' ? '' : `?provider=${provider}`
  const res = await fetch(`/api/turn${qs}`)
  if (!res.ok) throw new Error(`turn endpoint ${res.status}`)

  const data = (await res.json()) as { iceServers: RTCIceServer[] }
  cache = { at: Date.now(), provider, iceServers: data.iceServers }
  return data.iceServers
}