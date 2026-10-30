import { Beast, beastForSeat, hueForSeat } from '../beasts/Beast'

type Player = {
  id: string
  name: string
  isHost?: boolean
  score?: number
  bluff?: string | null
  isLeader?: boolean
}

type PlayerSeatProps = {
  player: Player | null
  index: number
  isActive?: boolean
  compact?: boolean
}

export function PlayerSeat({
  player,
  index,
  isActive = false,
  compact = false,
}: PlayerSeatProps) {
  const beast = beastForSeat(index)
  const hue = hueForSeat(index)
  const beastSize = compact ? 40 : 56

  if (!player) {
    return (
      <div className={'player-seat' + (compact ? ' player-seat-compact' : '')}>
        <div className="player-seat-chair">🪑</div>
        <span className="player-seat-label player-seat-label-empty">
          Waiting…
        </span>
      </div>
    )
  }

  const hasBluff = player.bluff !== null && player.bluff !== undefined
  const isLeader = player.isLeader === true

  return (
    <div
      className={
        'player-seat' +
        (compact ? ' player-seat-compact' : '') +
        (isActive ? ' player-seat-active' : '') +
        (isLeader ? ' player-seat-leader' : '')
      }
    >
      {isLeader && (
        <div className="player-seat-crown" aria-label="Leader">
          👑
        </div>
      )}

      {hasBluff && (
        <div className="player-seat-bluff">
          {player.bluff && player.bluff.length > 0 ? (
            <span>"{player.bluff}"</span>
          ) : (
            <span className="player-seat-bluff-empty">(no clue submitted)</span>
          )}
        </div>
      )}

      <Beast name={beast} size={beastSize} hue={hue} />
      <span className="player-seat-label">{player.name}</span>
      <span className="player-seat-score" aria-label={`${player.score ?? 0} points`}>⚡ {player.score ?? 0}</span>
      {player.isHost && <span className="player-seat-host">HOST</span>}
    </div>
  )
}