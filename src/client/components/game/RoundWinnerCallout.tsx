import { useEffect, useState } from 'react'
import './RoundWinnerCallout.css'

type RoundWinnerCalloutProps = {
  roundNumber: number
  winnerName: string | null
  winnerDelta: number
  isYou: boolean
  isTie: boolean
  durationMs?: number
}

export function RoundWinnerCallout({
  roundNumber,
  winnerName,
  winnerDelta,
  isYou,
  isTie,
  durationMs = 3500,
}: RoundWinnerCalloutProps) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHidden(true), durationMs)
    return () => clearTimeout(t)
  }, [durationMs])

  if (hidden) return null
  if (winnerDelta <= 0) return null

  return (
    <div className="round-callout" role="status" aria-live="polite">
      <div className="round-callout-glow" />
      <div className="round-callout-card">
        <p className="round-callout-label">
          ROUND {roundNumber} · TOP SCORER
        </p>
        {isTie ? (
          <p className="round-callout-name round-callout-name-tie">
            TIE ROUND
          </p>
        ) : (
          <p className="round-callout-name">
            {winnerName ?? '???'}
          </p>
        )}
        <p className="round-callout-points">
          +{winnerDelta} points
        </p>
        {isYou && !isTie && (
          <p className="round-callout-you">That's you! 🎉</p>
        )}
      </div>
    </div>
  )
}