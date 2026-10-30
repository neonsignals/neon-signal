import { describe, expect, it } from 'vitest'
import { generateRejoinCode, normalizeRejoinCode } from './session'

describe('branded rejoin codes', () => {
  it('generates a unique four-digit branded code for each room member', () => {
    const first = generateRejoinCode()
    const second = generateRejoinCode([first])
    expect(first).toMatch(/^NEON-\d{4}$/)
    expect(second).toMatch(/^NEON-\d{4}$/)
    expect(second).not.toBe(first)
  })

  it('normalizes the displayed NEON-#### format', () => {
    expect(normalizeRejoinCode('neon-7429')).toBe('NEON-7429')
    expect(normalizeRejoinCode(' NEON 7429 ')).toBe('NEON-7429')
    expect(normalizeRejoinCode('NEON7429')).toBe('NEON-7429')
  })

  it('rejects values that are not a four-digit branded code', () => {
    expect(normalizeRejoinCode('7429')).toBe('')
    expect(normalizeRejoinCode('NEON-742')).toBe('')
    expect(normalizeRejoinCode('NEON-74290')).toBe('')
    expect(normalizeRejoinCode('P0123456789ABCDEF0123456789ABCDEF')).toBe('')
  })
})
