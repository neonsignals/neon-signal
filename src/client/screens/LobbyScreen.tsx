import { Button } from '../components/Button'
import { formatRoomCode } from '@/shared/roomCode'

type Player = {
  id: string
  name: string
  isHost?: boolean
  score?: number
  joinedAt?: number
}

type LobbyScreenProps = {
  roomCode: string
  playerName: string
  isHost: boolean
  players: Player[]
  gameStarted: boolean
  onStartGame: () => void
  onReturnToStage: () => void
  onLeave: () => void
}

export function LobbyScreen({
  roomCode,
  playerName,
  isHost,
  players,
  gameStarted,
  onStartGame,
  onReturnToStage,
  onLeave,
}: LobbyScreenProps) {
  const sorted = [...players].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1
    if (!a.isHost && b.isHost) return 1
    return (a.joinedAt ?? 0) - (b.joinedAt ?? 0)
  })

  const emptySlots = Math.max(0, 8 - sorted.length)
  const canStart = isHost && sorted.length >= 2 && !gameStarted

  return (
    <div className="lobby">
      <header className="lobby-header">
        <span className="lobby-logo">⚡ Neon Signal</span>
        <button className="lobby-leave" onClick={onLeave}>
          Leave
        </button>
      </header>

      <section className="lobby-code-section">
        <p className="lobby-code-label">Room Code</p>
        <div className="lobby-code">{formatRoomCode(roomCode)}</div>
        <p className="lobby-code-hint">
          Share this code with friends to join
        </p>
      </section>

      {gameStarted && (
        <section className="lobby-in-progress">
          <p className="lobby-in-progress-badge">⚡ GAME IN PROGRESS</p>
          <Button
            variant="primary"
            className="lobby-return-btn"
            onClick={onReturnToStage}
          >
            ▶ Return to Stage
          </Button>
        </section>
      )}

      <section className="lobby-players">
        <h2 className="lobby-players-title">
          Players
          <span className="lobby-players-count">{sorted.length} / 8</span>
        </h2>

        <ul className="lobby-player-list">
          {sorted.map((p) => {
            const isYou = p.name === playerName
            return (
              <li key={p.id} className="lobby-player">
                <span className="lobby-player-avatar">🦊</span>
                <span className="lobby-player-name">
                  {p.name}
                  {isYou && (
                    <span
                      style={{
                        color: 'var(--color-text-muted)',
                        fontWeight: 400,
                      }}
                    >
                      {' '}(you)
                    </span>
                  )}
                </span>
                {p.isHost && <span className="lobby-player-tag">HOST</span>}
              </li>
            )
          })}

          {Array.from({ length: emptySlots }).map((_, i) => (
            <li
              key={`empty-${i}`}
              className="lobby-player lobby-player-empty"
            >
              <span className="lobby-player-avatar">🪑</span>
              <span className="lobby-player-name">Waiting…</span>
            </li>
          ))}
        </ul>
      </section>

      {isHost ? (
        <Button
          variant="primary"
          className="lobby-start"
          onClick={onStartGame}
          disabled={!canStart}
        >
          {gameStarted
            ? 'Game in progress'
            : sorted.length < 2
            ? 'Waiting for players…'
            : '⚡ Start Game'}
        </Button>
      ) : (
        <p
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
            padding: 'var(--space-4)',
          }}
        >
          {gameStarted
            ? 'Game in progress — use the Return button above to rejoin'
            : 'Waiting for the host to start the game…'}
        </p>
      )}
    </div>
  )
}