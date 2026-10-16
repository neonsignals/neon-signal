import { ReactNode, useEffect, useState } from 'react'
import './ScreenShake.css'

type ShakeKind = 'light' | 'heavy' | null

type ScreenShakeProps = {
  /** Increments on each new shake request. */
  trigger: number
  /** 'light' for small shakes, 'heavy' for big ones. */
  kind?: ShakeKind
  children: ReactNode
}

/**
 * Wraps its children and shakes them when `trigger` changes.
 * The shake auto-clears after the animation finishes.
 */
export function ScreenShake({
  trigger,
  kind = 'light',
  children,
}: ScreenShakeProps) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (trigger === 0) return
    setActive(false)
    // Force a re-render so the class toggles on next frame
    const raf1 = requestAnimationFrame(() => {
      setActive(true)
    })
    const clear = setTimeout(
      () => setActive(false),
      kind === 'heavy' ? 800 : 500
    )
    return () => {
      cancelAnimationFrame(raf1)
      clearTimeout(clear)
    }
  }, [trigger, kind])

  return (
    <div
      className={
        'screen-shake' +
        (active ? ` screen-shake-${kind ?? 'light'}` : '')
      }
    >
      {children}
    </div>
  )
}