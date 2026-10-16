/**
 * Format a Sparrow invite code for display.
 * Example: "348660d337085ce7" → "3486-60D3-3708-5CE7"
 */
export function formatRoomCode(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return clean.match(/.{1,4}/g)?.join('-') ?? clean
}

/**
 * Normalize a user-entered code for use with Sparrow.
 * Removes dashes/spaces, lowercases.
 * Example: "3486-60D3-3708-5CE7" → "348660d337085ce7"
 */
export function normalizeRoomCode(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}