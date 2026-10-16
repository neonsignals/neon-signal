import { useEffect, useRef, useState } from 'react'

/**
 * Countdown tied to an absolute phase deadline, not component mount time.
 * Remounting a panel therefore cannot restart a running phase timer.
 */
export function usePhaseCountdown(
  deadlineAt: number | undefined,
  durationMs: number,
  onComplete: () => void,
  enabled = true
): number {
  const onCompleteRef = useRef(onComplete)
  const completedDeadlineRef = useRef<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const deadline = deadlineAt ?? Date.now() + durationMs
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
  })

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const deadline = deadlineAt ?? Date.now() + durationMs
    let interval: number | undefined
    const update = () => {
      const remainingMs = Math.max(0, deadline - Date.now())
      setSecondsLeft(Math.ceil(remainingMs / 1000))
      if (remainingMs === 0 && enabled && completedDeadlineRef.current !== deadline) {
        completedDeadlineRef.current = deadline
        if (interval !== undefined) window.clearInterval(interval)
        onCompleteRef.current()
      }
    }

    if (!enabled) {
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
      return
    }

    interval = window.setInterval(update, 200)
    update()
    return () => {
      if (interval !== undefined) window.clearInterval(interval)
    }
  }, [deadlineAt, durationMs, enabled])

  return secondsLeft
}
