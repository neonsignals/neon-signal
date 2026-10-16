import { useEffect } from 'react'
import './ReactionLayer.css'

export type ReactionEntry = {
  id: string
  emoji: string
  fromName: string
}

type ReactionLayerProps = {
  reactions: ReactionEntry[]
  onExpire: (id: string) => void
}

export function ReactionLayer({ reactions, onExpire }: ReactionLayerProps) {
  return (
    <div className="reaction-layer" aria-hidden="true">
      {reactions.map((r) => (
        <ReactionFloat key={r.id} reaction={r} onExpire={onExpire} />
      ))}
    </div>
  )
}

function ReactionFloat({
  reaction,
  onExpire,
}: {
  reaction: ReactionEntry
  onExpire: (id: string) => void
}) {
  useEffect(() => {
    const t = setTimeout(() => onExpire(reaction.id), 2600)
    return () => clearTimeout(t)
  }, [reaction.id, onExpire])

  // Stable horizontal offset (-28% to +28%) based on the id hash
  const offset = (hashCode(reaction.id) % 57) - 28

  return (
    <div
      className="reaction-float"
      style={{ left: `${50 + offset}%` }}
    >
      <span className="reaction-emoji">{reaction.emoji}</span>
      <span className="reaction-name">{reaction.fromName}</span>
    </div>
  )
}

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}