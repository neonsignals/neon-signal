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

/** Get or create a stable browser token. Persists across refreshes. */
export function getOrCreateToken(): string {
  try {
    let t = localStorage.getItem(TOKEN_KEY)
    if (!t) {
      t = `P${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      localStorage.setItem(TOKEN_KEY, t)
    }
    return t
  } catch {
    return `P${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  }
}

/** Persist the current session so a refresh can rejoin. */
export function saveSession(s: Omit<SavedSession, 'expiresAt'>): void {
  try {
    const data: SavedSession = { ...s, expiresAt: Date.now() + HOUR }
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

/** Read the persisted session, or null if missing/expired. */
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

/** Wipe the persisted session (on voluntary leave). */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}