const KEY = 'neon-signal:player-token'

/**
 * Get or create a stable per-browser rejoin token.
 * This legacy helper is kept for compatibility, but now uses the browser's
 * cryptographically secure random-number generator instead of Math.random.
 */
export function getPlayerToken(): string {
  try {
    let token = localStorage.getItem(KEY)
    if (!token) {
      const bytes = new Uint8Array(16)
      if (!globalThis.crypto?.getRandomValues) {
        throw new Error('Secure random-number generation is unavailable. Open Neon Signal over HTTPS in an up-to-date browser.')
      }
      globalThis.crypto.getRandomValues(bytes)
      token = `P${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`
      localStorage.setItem(KEY, token)
    }
    return token
  } catch (error) {
    if (error instanceof Error && error.message.includes('Secure random-number')) throw error
    const bytes = new Uint8Array(16)
    if (!globalThis.crypto?.getRandomValues) {
      throw new Error('Secure random-number generation is unavailable. Open Neon Signal over HTTPS in an up-to-date browser.')
    }
    globalThis.crypto.getRandomValues(bytes)
    return `P${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`
  }
}
