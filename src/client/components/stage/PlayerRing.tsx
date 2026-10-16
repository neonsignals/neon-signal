import { useEffect, useState } from 'react'
import { PlayerSeat } from './PlayerSeat'

type Player = {
  id: string
  name: string
  isHost?: boolean
  score?: number
  joinedAt?: number
  bluff?: string | null
}

type PlayerRingProps = {
  players?: Player[]
  maxSeats?: number
}

type SeatPosition = {
  index: number
  x: number
  y: number
}

function calculateSeatPositions(
  count: number,
  radius: number
): SeatPosition[] {
  const positions: SeatPosition[] = []

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2
    positions.push({
      index: i,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
    })
  }

  return positions
}

/** Reactive viewport width tier. Compact on phones, normal on tablets+ */
function useIsCompact() {
  const [compact, setCompact] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : true
  )
  useEffect(() => {
    const update = () => setCompact(window.innerWidth < 640)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return compact
}

export function PlayerRing({ players = [], maxSeats = 8 }: PlayerRingProps) {
  const compact = useIsCompact()
  // Compact radius keeps 40px avatars inside a 360px viewport.
  // Normal radius is the original 42% for tablets and up.
  const radius = compact ? 33 : 42

  const sorted = [...players].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1
    if (!a.isHost && b.isHost) return 1
    return (a.joinedAt ?? 0) - (b.joinedAt ?? 0)
  })

  const topScore = sorted.reduce(
    (max, p) => Math.max(max, p.score ?? 0),
    0
  )
  const leaderIds = new Set(
    topScore > 0
      ? sorted.filter((p) => (p.score ?? 0) === topScore).map((p) => p.id)
      : []
  )

  const seatPositions = calculateSeatPositions(maxSeats, radius)

  return (
    <div className="player-ring">
      {seatPositions.map((seat) => {
        const p = sorted[seat.index]
        const enriched = p
          ? { ...p, isLeader: leaderIds.has(p.id) }
          : null
        return (
          <div
            key={seat.index}
            style={{
              position: 'absolute',
              left: `${seat.x}%`,
              top: `${seat.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <PlayerSeat
              player={enriched}
              index={seat.index}
              compact={compact}
            />
          </div>
        )
      })}
    </div>
  )
}