import { usePhaseCountdown } from '@/client/hooks/usePhaseCountdown'
import './PeekPanel.css'

type PeekPanelProps = {
  /** Name of the rival whose code we peeked at */
  targetName: string | null
  /** Which digit we saw (0, 1, or 2) */
  digitIndex: number | null
  /** The digit value we saw ("1"–"9") */
  digit: string | null
  /** Seconds remaining in the peek phase */
  durationMs?: number
  deadlineAt?: number
  /** Called when the timer runs out */
  onComplete: () => void
}

export function PeekPanel({
  targetName,
  digitIndex,
  digit,
  durationMs = 5000,
  deadlineAt,
  onComplete,
}: PeekPanelProps) {
  const secondsLeft = usePhaseCountdown(deadlineAt, durationMs, onComplete)

  const hasPeek = targetName !== null && digit !== null

  return (
    <div className="peek-panel">
      <p className="peek-panel-title">👁 PEEK PHASE</p>
      <p className="peek-panel-subtitle">{secondsLeft}s remaining</p>

      {hasPeek ? (
        <div className="peek-panel-reveal">
          <p className="peek-panel-who">
            You saw <strong>{targetName}</strong>'s code:
          </p>
          <div className="peek-panel-digits">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={
                  i === digitIndex
                    ? 'peek-panel-digit peek-panel-digit-revealed'
                    : 'peek-panel-digit'
                }
              >
                {i === digitIndex ? digit : '?'}
              </div>
            ))}
          </div>
          <p className="peek-panel-hint">Remember it. Don't tell.</p>
        </div>
      ) : (
        <div className="peek-panel-waiting">
          <p>Scanning rivals…</p>
        </div>
      )}
    </div>
  )
}