export const ALLOWED_REACTIONS = ['😂', '😱', '🔥', '👏', '💀', '🧠', '🤯', '⚡'] as const

export function isAllowedReaction(value: string): boolean {
  return (ALLOWED_REACTIONS as readonly string[]).includes(value)
}
