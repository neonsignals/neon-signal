import { useCallback, useRef, useState } from 'react'

export function useJoinBanner() {
  const [queue, setQueue] = useState<string[]>([])
  const seenRef = useRef<Set<string>>(new Set())

  const triggerJoin = useCallback((playerName: string) => {
    if (!playerName) return
    if (seenRef.current.has(playerName)) return
    seenRef.current.add(playerName)
    setQueue((q) => [...q, playerName])
  }, [])

  const dismissCurrent = useCallback(() => {
    setQueue((q) => q.slice(1))
  }, [])

  const clearAll = useCallback(() => {
    setQueue([])
    seenRef.current.clear()
  }, [])

  return {
    currentName: queue[0] ?? null,
    triggerJoin,
    dismissCurrent,
    clearAll,
  }
}