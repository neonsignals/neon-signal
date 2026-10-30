const SESSION_KEY = 'neon-signal:session'
const TOKEN_KEY = 'neon-signal:token'
const HOUR = 60 * 60 * 1000

export type SavedSession = {
  roomCode: string
  myPlayerId: string
  playerName: string
  playerToken: string
  isHost: boolean
  expiresAt: number
}

function generateToken(): string {
  // Rejoin codes are used as bearer secrets. Prefer 128 bits from the
  // browser's cryptographically secure random-number generator.
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
    return `P${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`
  }

  // Older/insecure contexts should not silently issue a weak rejoin token.
  throw new Error('Secure random-number generation is unavailable in this browser. Open Neon Signal over HTTPS or use an up-to-date browser.')
}

export function getOrCreateToken(): string {
  try {
    let t = localStorage.getItem(TOKEN_KEY)
    if (!t) {
      t = generateToken()
      localStorage.setItem(TOKEN_KEY, t)
    }
    return t
  } catch {
    return generateToken()
  }
}

/** Force a fresh rejoin code for this browser. */
export function regenerateToken(): string {
  try {
    const t = generateToken()
    localStorage.setItem(TOKEN_KEY, t)
    return t
  } catch {
    return generateToken()
  }
}

export function saveSession(s: Omit<SavedSession, 'expiresAt'>): void {
  try {
    const data: SavedSession = { ...s, expiresAt: Date.now() + HOUR }
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SavedSession
    if (!data.expiresAt || data.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}