import type { ChallengeOutcome, GuessResult, Player } from '@/network/types'
import { evaluateClue, isSuccessfulChallenge, parseClueText } from './clues'

export type SubmittedGuess = {
  guessId: string
  targetId: string
  code: string
}

export type RoundScoringInput = {
  players: Pick<Player, 'id' | 'name'>[]
  scores: Record<string, number>
  codesByPlayer: Record<string, string>
  guessesByPlayer: Record<string, SubmittedGuess[]>
  bluffs: Record<string, string>
  challenges: Record<string, string>
  multiplier?: number
}

export type RoundScoringResult = {
  scores: Record<string, number>
  deltas: Record<string, number>
  challengeResults: ChallengeOutcome[]
}

/** Score a three-digit guess without over-counting repeated digits. */
export function scoreGuess(guess: string, secret: string): GuessResult {
  if (!/^[1-9]{3}$/.test(guess) || !/^[1-9]{3}$/.test(secret)) {
    return { correctPosition: 0, correctDigit: 0, points: 0 }
  }

  const guessedDigits = guess.split('').map(Number)
  const secretDigits = secret.split('').map(Number)
  const usedGuess = [false, false, false]
  const usedSecret = [false, false, false]
  let correctPosition = 0
  let correctDigit = 0

  for (let index = 0; index < 3; index += 1) {
    if (guessedDigits[index] === secretDigits[index]) {
      correctPosition += 1
      usedGuess[index] = true
      usedSecret[index] = true
    }
  }

  for (let guessIndex = 0; guessIndex < 3; guessIndex += 1) {
    if (usedGuess[guessIndex]) continue
    for (let secretIndex = 0; secretIndex < 3; secretIndex += 1) {
      if (usedSecret[secretIndex]) continue
      if (guessedDigits[guessIndex] === secretDigits[secretIndex]) {
        correctDigit += 1
        usedGuess[guessIndex] = true
        usedSecret[secretIndex] = true
        break
      }
    }
  }

  const points =
    correctPosition * 3 +
    correctDigit +
    (correctPosition === 3 ? 5 : 0)

  return { correctPosition, correctDigit, points }
}

/** Calculate one complete round in a pure, repeatable way. */
export function calculateRoundScores({
  players,
  scores,
  codesByPlayer,
  guessesByPlayer,
  bluffs,
  challenges,
  multiplier = 1,
}: RoundScoringInput): RoundScoringResult {
  const safeMultiplier = multiplier === 2 ? 2 : 1
  const deltas: Record<string, number> = Object.fromEntries(
    players.map((player) => [player.id, 0])
  )
  const challengeResults: ChallengeOutcome[] = []

  for (const [guesserId, guesses] of Object.entries(guessesByPlayer)) {
    if (!Object.prototype.hasOwnProperty.call(deltas, guesserId)) continue
    for (const guess of guesses) {
      const secret = codesByPlayer[guess.targetId]
      if (!secret) continue
      const verified = scoreGuess(guess.code, secret)
      deltas[guesserId] += verified.points * safeMultiplier
    }
  }

  for (const [challengerId, targetId] of Object.entries(challenges)) {
    if (!Object.prototype.hasOwnProperty.call(deltas, challengerId)) continue
    if (!Object.prototype.hasOwnProperty.call(deltas, targetId)) continue
    if (challengerId === targetId) continue

    const claimText = bluffs[targetId] ?? ''
    const targetSecret = codesByPlayer[targetId] ?? ''
    const hasClue = claimText.trim().length > 0
    const clueIsTrue = hasClue && evaluateClue(claimText, targetSecret)
    const success = isSuccessfulChallenge(claimText, targetSecret)
    const reason: ChallengeOutcome['reason'] = !hasClue
      ? 'missing'
      : clueIsTrue
        ? 'true'
        : 'false'
    const points = (success ? 4 : -3) * safeMultiplier
    deltas[challengerId] += points

    challengeResults.push({
      challengerId,
      challengerName: players.find((player) => player.id === challengerId)?.name ?? 'Unknown player',
      targetId,
      targetName: players.find((player) => player.id === targetId)?.name ?? 'Unknown player',
      success,
      reason,
      claimText,
      points,
    })
  }

  for (const player of players) {
    const clue = bluffs[player.id] ?? ''
    const wasSuccessfullyChallenged = challengeResults.some(
      (result) => result.targetId === player.id && result.success
    )
    if (parseClueText(clue) !== null && !wasSuccessfullyChallenged) {
      deltas[player.id] += 2 * safeMultiplier
    }
  }

  const nextScores: Record<string, number> = { ...scores }
  for (const player of players) {
    nextScores[player.id] = (nextScores[player.id] ?? 0) + deltas[player.id]
  }

  return { scores: nextScores, deltas, challengeResults }
}
