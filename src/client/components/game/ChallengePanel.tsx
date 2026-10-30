import { usePhaseCountdown } from '@/client/hooks/usePhaseCountdown'
import './ChallengePanel.css'

type Rival = {
  id: string
  name: string
  bluff: string | null
  challengeCount: number
}

type ChallengePanelProps = {
  rivals: Rival[]
  myChallenge: string | null
  durationMs?: number
  deadlineAt?: number
  onChallenge: (targetId: string) => void
  onComplete: () => void
}

export function ChallengePanel({
  rivals,
  myChallenge,
  durationMs = 15000,
  deadlineAt,
  onChallenge,
  onComplete,
}: ChallengePanelProps) {
  const secondsLeft = usePhaseCountdown(deadlineAt, durationMs, onComplete)

  return (
    <div className="challenge-panel">
      <p className="challenge-panel-title">⚡ CHALLENGE PHASE</p>
      <p className="challenge-panel-subtitle">
        {secondsLeft}s ·{' '}
        {myChallenge
          ? 'You have made your one challenge'
          : 'Choose one player who left no clue, or skip'}
      </p>

      <ul className="challenge-panel-list">
        {rivals.map((r) => {
          const challenged = myChallenge === r.id
          const locked = myChallenge !== null && !challenged
          return (
            <li
              key={r.id}
              className={
                'challenge-panel-row' +
                (challenged ? ' challenge-panel-row-selected' : '') +
                (locked ? ' challenge-panel-row-locked' : '')
              }
            >
              <div className="challenge-panel-info">
                <div className="challenge-panel-name">{r.name}</div>
                <div className="challenge-panel-bluff">
                  {r.bluff && r.bluff.length > 0
                    ? `"${r.bluff}"`
                    : '(no clue)'}
                </div>
                {r.challengeCount > 0 && (
                  <div className="challenge-panel-count">
                    {r.challengeCount}{' '}
                    {r.challengeCount === 1 ? 'person has' : 'people have'}{' '}
                    challenged
                  </div>
                )}
              </div>
              {challenged ? (
                <span className="challenge-panel-badge">CHALLENGED</span>
              ) : (
                <button
                  type="button"
                  className="challenge-panel-btn"
                  disabled={locked}
                  onClick={() => onChallenge(r.id)}
                >
                  ⚡ Challenge
                </button>
              )}
            </li>
          )
        })}
        {rivals.length === 0 && (
          <li className="challenge-panel-empty">
            No rivals to challenge.
          </li>
        )}
      </ul>

      <p className="challenge-panel-hint">
        {myChallenge
          ? 'Waiting for the result at the end of the round…'
          : 'One challenge only: +4 if they left no clue, or −3 if they submitted any clue.'}
      </p>
    </div>
  )
}