import { describe, expect, it } from 'vitest'
import { parseRoundNumber } from './roundLabel'

describe('parseRoundNumber', () => {
  it('reads the final round as the number 5', () => {
    expect(parseRoundNumber('R5/5', 1)).toBe(5)
  })

  it('reads ordinary round labels', () => {
    expect(parseRoundNumber('R3/5', 1)).toBe(3)
    expect(parseRoundNumber('R1/5', 1)).toBe(1)
  })

  it('keeps the waiting-room round zero', () => {
    expect(parseRoundNumber('R0/5', 1)).toBe(0)
  })

  it('uses the fallback for labels that do not contain a valid round', () => {
    expect(parseRoundNumber('FINAL', 4)).toBe(4)
    expect(parseRoundNumber('R6/5', 4)).toBe(4)
    expect(parseRoundNumber(undefined, 2)).toBe(2)
  })
})
