import { useState } from 'react'
import { Stage } from '../components/stage/Stage'
import { Button } from '../components/Button'
import { ReactionBar } from '../components/game/ReactionBar'
import {
  ReactionLayer,
  type ReactionEntry,
} from '../components/game/ReactionLayer'
import { formatRoomCode, normalizeRoomCode } from '@/shared/roomCode'
import type { Player } from '@/network/types'
import type { Phase } from '@/shared/phases'
import './SpectatorScreen.css'

type SpectatorScreenProps = {
  joined: boolean
  players: Player[]
  scores: Record<string, number>
  spectators: Player[]
  phase: Phase
  roundLabel: string
  gameStarted: boolean
  gameOver: boolean
  roomCode: string | null
  reactions: ReactionEntry[]
  onExpireReaction: (id: string) => void
  onSendReaction: (emoji: string) => void
  onJoin: (code: string, name: string) => Promise<void>
  onLeave: () => void
}

export function SpectatorScreen({
  joined,
  players,
  scores,
  spectators,
  phase,
  roundLabel,
  gameStarted,
  gameOver,
  roomCode,
  reactions,
  onExpireReaction,
  onSendReaction,
  onJoin,
  onLeave,
}: SpectatorScreenProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedCode = normalizeRoomCode(code)
  const canJoin =
    normalizedCode.length >= 6 && name.trim().length > 0 && !joining

  async function handleSubmit() {
    if (!canJoin) return
    setJoining(true)
    setError(null)
    try {
      await onJoin(normalizedCode, name.trim())
    } catch (err) {
      setError((err as Error).message ?? 'Failed to join')
      setJoining(false)
    }
  }

  // ---- Joined: watch view ----
  if (joined) {
    return (
      <div className="spectator-screen">
        <ReactionLayer
          reactions={reactions}
          onExpire={onExpireReaction}
        />

        <header className="spectator-header">
          <span className="spectator-badge">👁 WATCHING</span>
          <div className="spectator-header-right">
            <span>
              Room:{' '}
              <strong>
                {roomCode ? formatRoomCode(roomCode) : '------'}
              </strong>
            </span>
            <span>
              👁 {spectators.length}{' '}
              {spectators.length === 1 ? 'watcher' : 'watchers'}
            </span>
            <Button variant="ghost" onClick={onLeave}>
              Leave
            </Button>
          </div>
        </header>

        {gameOver ? (
          <div className="spectator-finished">
            <div className="spectator-finished-trophy">🏆</div>
            <h1>GAME COMPLETE</h1>
            <p className="spectator-finished-subtitle">
              The five rounds are over. Here are the final scores.
            </p>
            <ol className="spectator-final-list">
              {[...players]
                .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
                .map((player, index) => (
                  <li key={player.id}>
                    <span className="spectator-final-rank">{index + 1}.</span>
                    <span className="spectator-final-name">{player.name}</span>
                    <strong>{scores[player.id] ?? 0} pts</strong>
                  </li>
                ))}
            </ol>
            <p className="spectator-finished-footer">
              You can leave now, or stay connected while the host prepares another game.
            </p>
          </div>
        ) : !gameStarted ? (
          <div className="spectator-waiting">
            <p className="spectator-waiting-title">Waiting for the game…</p>
            <p className="spectator-waiting-subtitle">
              The host hasn't started yet. Watch this space.
            </p>
          </div>
        ) : (
          <div className="spectator-stage">
            <Stage
              players={players.map((p) => ({
                id: p.id,
                name: p.name,
                isHost: p.isHost,
                score: scores[p.id] ?? 0,
                joinedAt: p.joinedAt,
                bluff: null,
              }))}
              phase={phase}
              roundLabel={roundLabel}
              showLeaderboard={true}
            />
          </div>
        )}

        {spectators.length > 1 && (
          <div className="spectator-list">
            <p className="spectator-list-title">Other watchers</p>
            <ul>
              {spectators.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          </div>
        )}

        <ReactionBar onSend={onSendReaction} />
      </div>
    )
  }

  // ---- Not joined: join form ----
  return (
    <div className="spectator-screen spectator-screen-join">
      <div className="spectator-join-card">
        <div className="spectator-join-icon">👁</div>
        <h1 className="spectator-join-title">Watch a Game</h1>
        <p className="spectator-join-subtitle">
          Enter the room code to watch a live match.
        </p>

        <label className="field">
          <span className="field-label">Room code</span>
          <input
            className="field-input code-input"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="3486-60D3-3708-5CE7"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span className="field-label">Your display name</span>
          <input
            className="field-input"
            type="text"
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            placeholder="SPECTATOR"
            maxLength={16}
          />
        </label>

        <Button
          variant="primary"
          className="spectator-join-btn"
          disabled={!canJoin}
          onClick={handleSubmit}
        >
          {joining ? 'Connecting…' : 'Watch Room'}
        </Button>

        {error && <p className="spectator-join-error" role="alert">{error}</p>}

        <button type="button" className="spectator-back" onClick={onLeave}>
          ← Back to Home
        </button>
      </div>
    </div>
  )
}