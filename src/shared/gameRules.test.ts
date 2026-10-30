import { describe, expect, it } from 'vitest'
import { calculateRoundScores, scoreGuess } from './gameRules'

const players = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
]

const base = {
  players,
  scores: { a: 10, b: 10, c: 10 },
  codesByPlayer: { a: '742', b: '581', c: '963' },
  guessesByPlayer: {},
  bluffs: {},
  challenges: {},
}

describe('guess scoring', () => {
  it('awards position, digit and perfect-code points', () => {
    expect(scoreGuess('742', '742')).toEqual({ correctPosition: 3, correctDigit: 0, points: 14 })
    expect(scoreGuess('724', '742')).toEqual({ correctPosition: 1, correctDigit: 2, points: 5 })
  })

  it('does not count duplicate digits more than once', () => {
    expect(scoreGuess('121', '112')).toEqual({ correctPosition: 1, correctDigit: 2, points: 5 })
  })

  it('does not award points for malformed guesses', () => {
    expect(scoreGuess('7x2', '742')).toEqual({ correctPosition: 0, correctDigit: 0, points: 0 })
  })
})

describe('round scoring', () => {
  it('rewards a successful challenge against a false clue and removes the clue bonus', () => {
    const result = calculateRoundScores({
      ...base,
      bluffs: { b: 'My first digit is 3.' },
      challenges: { a: 'b' },
    })
    expect(result.challengeResults[0]).toMatchObject({ success: true, reason: 'false', points: 4 })
    expect(result.deltas).toEqual({ a: 4, b: 0, c: 0 })
    expect(result.scores).toEqual({ a: 14, b: 10, c: 10 })
  })

  it('penalizes an incorrect challenge and awards the true clue bonus', () => {
    const result = calculateRoundScores({
      ...base,
      bluffs: { b: 'My first digit is 5.' },
      challenges: { a: 'b' },
    })
    expect(result.challengeResults[0]).toMatchObject({ success: false, reason: 'true', points: -3 })
    expect(result.deltas).toEqual({ a: -3, b: 2, c: 0 })
  })

  it('rewards a successful challenge against a missing clue but gives no clue bonus', () => {
    const result = calculateRoundScores({
      ...base,
      bluffs: { b: '' },
      challenges: { a: 'b' },
    })
    expect(result.challengeResults[0]).toMatchObject({ success: true, reason: 'missing', points: 4 })
    expect(result.deltas).toEqual({ a: 4, b: 0, c: 0 })
  })

  it('doubles both rewards and penalties in a double-points round', () => {
    const result = calculateRoundScores({
      ...base,
      multiplier: 2,
      bluffs: { b: 'My first digit is 5.', c: 'My first digit is 1.' },
      challenges: { a: 'b', c: 'a' },
    })
    expect(result.deltas).toEqual({ a: -6, b: 4, c: 12 })
  })

  it('adds verified guess scores to the round total', () => {
    const result = calculateRoundScores({
      ...base,
      guessesByPlayer: { a: [{ guessId: 'g1', targetId: 'b', code: '581' }] },
    })
    expect(result.deltas.a).toBe(14)
  })

  it('ignores self-challenges and unknown player IDs', () => {
    const result = calculateRoundScores({
      ...base,
      bluffs: { a: 'My first digit is 7.' },
      challenges: { a: 'a', unknown: 'b' },
    })
    expect(result.challengeResults).toHaveLength(0)
    expect(result.deltas).toEqual({ a: 2, b: 0, c: 0 })
  })
})
