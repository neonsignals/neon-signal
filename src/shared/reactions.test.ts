import { describe, expect, it } from 'vitest'
import { ALLOWED_REACTIONS, isAllowedReaction } from './reactions'

describe('reaction allow-list', () => {
  it('accepts every reaction shown by the game', () => {
    for (const reaction of ALLOWED_REACTIONS) expect(isAllowedReaction(reaction)).toBe(true)
  })

  it('rejects arbitrary or oversized reaction text', () => {
    expect(isAllowedReaction('<script>alert(1)</script>')).toBe(false)
    expect(isAllowedReaction('not an emoji')).toBe(false)
  })
})
