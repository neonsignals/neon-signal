import { useEffect } from 'react'
import './JoinBanner.css'

type JoinBannerProps = {
  playerName: string
  onDismiss: () => void
  durationMs?: number
}

export function JoinBanner({
  playerName,
  onDismiss,
  durationMs = 2000,
}: JoinBannerProps) {
  // `playerName` is in the deps on purpose — when the queue advances
  // (from one name to the next), we need a FRESH timer. Without it,
  // the second banner in the queue would never dismiss.
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs)
    return () => clearTimeout(timer)
  }, [playerName, onDismiss, durationMs])

  return (
    <div className="join-banner" role="status" aria-live="polite">
      <div className="join-banner-streak" />
      <div className="join-banner-content">
        <span className="join-banner-text">
          ⚡ {playerName} HAS ENTERED ⚡
        </span>
      </div>
    </div>
  )
}