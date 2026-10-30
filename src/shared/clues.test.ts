import { describe, expect, it } from 'vitest'
import {
  buildClueText,
  evaluateClue,
  isSuccessfulChallenge,
  isValidClueSubmission,
  parseClueText,
} from './clues'

describe('structured clue statements', () => {
  const secret = '742'

  it('builds and verifies each supported clue type', () => {
    expect(buildClueText('first', 7)).toBe('My first digit is 7.')
    expect(evaluateClue(buildClueText('first', 7), secret)).toBe(true)
    expect(evaluateClue(buildClueText('middle', 4), secret)).toBe(true)
    expect(evaluateClue(buildClueText('last', 2), secret)).toBe(true)
    expect(evaluateClue(buildClueText('contains', 4), secret)).toBe(true)
    expect(evaluateClue(buildClueText('sum', 13), secret)).toBe(true)
  })

  it('detects false statements', () => {
    expect(evaluateClue('My first digit is 3.', secret)).toBe(false)
    expect(evaluateClue('My code contains the digit 9.', secret)).toBe(false)
    expect(evaluateClue('The sum of my digits is 10.', secret)).toBe(false)
  })

  it('accepts blank submissions but rejects unsupported free text', () => {
    expect(isValidClueSubmission('')).toBe(true)
    expect(isValidClueSubmission('   ')).toBe(true)
    expect(isValidClueSubmission('My first digit is 7.')).toBe(true)
    expect(isValidClueSubmission('Trust me, my code is lucky.')).toBe(false)
  })

  it('recognizes missing and false clues as successful challenges', () => {
    expect(isSuccessfulChallenge('', secret)).toBe(true)
    expect(isSuccessfulChallenge('My first digit is 3.', secret)).toBe(true)
  })

  it('recognizes a truthful clue as an unsuccessful challenge', () => {
    expect(isSuccessfulChallenge('My first digit is 7.', secret)).toBe(false)
  })

  it('rejects invalid digit and sum ranges', () => {
    expect(buildClueText('first', 0)).toBe('')
    expect(buildClueText('contains', 10)).toBe('')
    expect(buildClueText('sum', 28)).toBe('')
    expect(parseClueText('The sum of my digits is 2.')).toBeNull()
  })
})
