import { usePhaseCountdown } from '@/client/hooks/usePhaseCountdown'
import './RevealPanel.css'
import type { ChallengeOutcome } from '@/network/types'

type PlayerCard = {
  id: string
  name: string
  code: string
  delta: number
  totalScore: number
}

type RevealPanelProps = {
  roundNumber: number
  isDoubleRound: boolean
  playerCards: PlayerCard[]
  challengeResults: ChallengeOutcome[]
  durationMs?: number
  deadlineAt?: number
  onComplete: () => void
}

export function RevealPanel({
  roundNumber,
  isDoubleRound,
  playerCards,
  challengeResults,
  durationMs = 10000,
  deadlineAt,
  onComplete,
}: RevealPanelProps) {
  const secondsLeft = usePhaseCountdown(deadlineAt, durationMs, onComplete)

  const isFinalRound = roundNumber >= 5

  return (
    <div className="reveal-panel">
      <p className="reveal-panel-title">🎴 REVEAL</p>
      <p className="reveal-panel-subtitle">
        Round {roundNumber}/5{isDoubleRound ? ' · ×2' : ''} · {secondsLeft}s
      </p>

      <div className="reveal-panel-cards">
        {playerCards.map((p) => (
          <div key={p.id} className="reveal-panel-card">
            <div className="reveal-panel-card-name">{p.name}</div>
            <div className="reveal-panel-card-code">
              {p.code.split('').map((d, i) => (
                <span key={i} className="reveal-panel-digit">
                  {d}
                </span>
              ))}
            </div>
            <div className="reveal-panel-card-footer">
              <span
                className={
                  'reveal-panel-delta' +
                  (p.delta > 0
                    ? ' reveal-panel-delta-pos'
                    : p.delta < 0
                    ? ' reveal-panel-delta-neg'
                    : '')
                }
              >
                {p.delta > 0 ? `+${p.delta}` : p.delta}
              </span>
              <span className="reveal-panel-total">{p.totalScore}</span>
            </div>
          </div>
        ))}
      </div>

      {challengeResults.length > 0 && (
        <div className="reveal-panel-challenges">
          <p className="reveal-panel-challenges-title">Challenges</p>
          <ul>
            {challengeResults.map((c, i) => (
              <li
                key={i}
                className={
                  'reveal-panel-challenge' +
                  (c.success
                    ? ' reveal-panel-challenge-success'
                    : ' reveal-panel-challenge-fail')
                }
              >
                <div className="reveal-panel-challenge-main">
                  <span className="reveal-panel-challenge-names">
                    {c.challengerName} challenged {c.targetName}
                  </span>
                  <span className="reveal-panel-challenge-claim">
                    {c.claimText ? `“${c.claimText}”` : '(no clue submitted)'}
                  </span>
                </div>
                <span className="reveal-panel-challenge-verdict">
                  {c.reason === 'missing'
                    ? 'NO CLUE CAUGHT'
                    : c.reason === 'false'
                      ? 'FALSE CLUE CAUGHT'
                      : 'TRUE CLUE · MISSED'}
                </span>
                <span className="reveal-panel-challenge-points">
                  {c.points > 0 ? `+${c.points}` : c.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="reveal-panel-next">
        {isFinalRound ? 'Final round complete' : 'Next round starting…'}
      </p>
    </div>
  )
}