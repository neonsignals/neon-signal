/** Read a displayed round label without treating the round number as a radix. */
export function parseRoundNumber(
  roundLabel: string | null | undefined,
  fallback: number,
  maxRound = 5
): number {
  const match = roundLabel?.match(/^R(\d+)\//i)
  if (!match) return fallback

  const round = Number(match[1])
  if (!Number.isInteger(round) || round < 0 || round > maxRound) {
    return fallback
  }

  return round
}
