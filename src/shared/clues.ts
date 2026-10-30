export type ClueKind = 'first' | 'middle' | 'last' | 'contains' | 'sum'

export type ParsedClue = {
  kind: ClueKind
  value: number
}

/** Build the exact sentence shared with every player and checked by the host. */
export function buildClueText(kind: ClueKind, value: number): string {
  if (!Number.isInteger(value)) return ''

  if (kind === 'sum') {
    if (value < 3 || value > 27) return ''
    return `The sum of my digits is ${value}.`
  }

  if (value < 1 || value > 9) return ''

  switch (kind) {
    case 'first':
      return `My first digit is ${value}.`
    case 'middle':
      return `My middle digit is ${value}.`
    case 'last':
      return `My last digit is ${value}.`
    case 'contains':
      return `My code contains the digit ${value}.`
  }
}

/** Parse only supported, unambiguous clue sentences. Free-form text is rejected. */
export function parseClueText(text: string): ParsedClue | null {
  const normalized = text.trim()
  if (!normalized) return null

  const positionMatch = normalized.match(/^My (first|middle|last) digit is ([1-9])\.$/i)
  if (positionMatch) {
    const kind = positionMatch[1].toLowerCase() as 'first' | 'middle' | 'last'
    return { kind, value: Number(positionMatch[2]) }
  }

  const containsMatch = normalized.match(/^My code contains the digit ([1-9])\.$/i)
  if (containsMatch) {
    return { kind: 'contains', value: Number(containsMatch[1]) }
  }

  const sumMatch = normalized.match(/^The sum of my digits is (\d{1,2})\.$/i)
  if (sumMatch) {
    const value = Number(sumMatch[1])
    if (value >= 3 && value <= 27) return { kind: 'sum', value }
  }

  return null
}

/** Empty is allowed to mean “no clue”; all non-empty clues must be structured. */
export function isValidClueSubmission(text: string): boolean {
  return text.trim() === '' || parseClueText(text) !== null
}

/** Evaluate a parsed clue against the secret code known by the host. */
export function evaluateClue(text: string, secretCode: string): boolean {
  const clue = parseClueText(text)
  if (!clue || !/^[1-9]{3}$/.test(secretCode)) return false

  const digits = secretCode.split('').map(Number)
  switch (clue.kind) {
    case 'first':
      return digits[0] === clue.value
    case 'middle':
      return digits[1] === clue.value
    case 'last':
      return digits[2] === clue.value
    case 'contains':
      return digits.includes(clue.value)
    case 'sum':
      return digits.reduce((total, digit) => total + digit, 0) === clue.value
  }
}

/** A challenge catches a missing clue or a statement that is objectively false. */
export function isSuccessfulChallenge(clueText: string, secretCode: string): boolean {
  if (clueText.trim() === '') return true
  return !evaluateClue(clueText, secretCode)
}
