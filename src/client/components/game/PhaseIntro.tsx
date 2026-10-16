import { useEffect, useState } from 'react'
import './PhaseIntro.css'

type PhaseIntroProps = {
  phaseLabel: string
  roundNumber: number
  isDoubleRound: boolean
  durationMs?: number
  onComplete: () => void
}

export function PhaseIntro({
  phaseLabel,
  roundNumber,
  isDoubleRound,
  durationMs = 1400,
  onComplete,
}: PhaseIntroProps) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setHidden(true)
      onComplete()
    }, durationMs)
    return () => clearTimeout(t)
  }, [durationMs, onComplete])

  if (hidden) return null

  return (
    <div className="phase-intro" role="status" aria-live="polite">
      <div className="phase-intro-backdrop" />
      <div className="phase-intro-content">
        {isDoubleRound && (
          <div className="phase-intro-double">×2</div>
        )}
        <div className="phase-intro-round">ROUND {roundNumber}</div>
        <div className="phase-intro-phase">{phaseLabel}</div>
      </div>
    </div>
  )
}