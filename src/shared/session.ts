const SESSION_KEY = 'neon-signal:session'
const TOKEN_KEY = 'neon-signal:token'
const HOUR = 60 * 60 * 1000

export type SavedSession = {
  roomCode: string
  myPlayerId: string
  playerName: string
  playerToken: string
  /** Short, room-scoped code shown to the player. */
  rejoinCode?: string
  isHost: boolean
  expiresAt: number
}

function generateToken(): string {
  // Keep the high-entropy credential private; it is never displayed in the UI.
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
    return `P${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`
  }
  throw new Error('Secure random-number generation is unavailable in this browser. Open Neon Signal over HTTPS or use an up-to-date browser.')
}

export function getOrCreateToken(): string {
  try {
    let token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      token = generateToken()
      localStorage.setItem(TOKEN_KEY, token)
    }
    return token
  } catch {
    return generateToken()
  }
}

/** Store a private token supplied by the room host after a short-code rejoin. */
export function setPrivateToken(token: string): void {
  if (!/^P[0-9A-F]{32}$/i.test(token)) return
  try {
    localStorage.setItem(TOKEN_KEY, token.toUpperCase())
  } catch {
    // The current live session can still continue if storage is unavailable.
  }
}

/** Generate a random branded code that is unique within the current room. */
export function generateRejoinCode(usedCodes: Iterable<string> = []): string {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure random-number generation is unavailable. Open Neon Signal over HTTPS or use an up-to-date browser.')
  }

  const used = new Set(Array.from(usedCodes, normalizeRejoinCode).filter(Boolean))
  const value = new Uint16Array(1)
  // 60,000 is divisible by 10,000, so rejecting values above it avoids modulo bias.
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    globalThis.crypto.getRandomValues(value)
    if (value[0] >= 60000) continue
    const code = `NEON-${String(value[0] % 10000).padStart(4, '0')}`
    if (!used.has(code)) return code
  }
  throw new Error('Could not allocate a unique rejoin code. Please try again.')
}

export function normalizeRejoinCode(input: string): string {
  const clean = input.trim().toUpperCase().replace(/\s+/g, '')
  const match = clean.match(/^NEON-?(\d{4})$/)
  return match ? `NEON-${match[1]}` : ''
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
