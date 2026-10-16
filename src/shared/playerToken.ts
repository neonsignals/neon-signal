const KEY = 'neon-signal:player-token'

/**
 * Get (or create) a stable per-browser token.
 * This persists in localStorage so the same browser is always
 * recognised as the same player, even after refresh or leaving.
 */
export function getPlayerToken(): string {
  try {
    let token = localStorage.getItem(KEY)
    if (!token) {
      token = `p-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(KEY, token)
    }
    return token
  } catch {
    // localStorage unavailable (private mode fallback)
    return `p-${Math.random().toString(36).slice(2, 10)}`
  }
}