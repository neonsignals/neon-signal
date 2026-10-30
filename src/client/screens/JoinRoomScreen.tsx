import { useState } from 'react'
import { Button } from '../components/Button'
import { normalizeRoomCode } from '@/shared/roomCode'

type JoinRoomScreenProps = {
  onBack: () => void
  onJoin: (code: string, name: string, rejoinCode: string) => Promise<void>
}

export function JoinRoomScreen({ onBack, onJoin }: JoinRoomScreenProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [rejoinCode, setRejoinCode] = useState('')
  const [showRejoin, setShowRejoin] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedCode = normalizeRoomCode(code)
  const canJoin = normalizedCode.length >= 6 && name.trim().length > 0 && !joining

  async function handleJoin() {
    if (!canJoin) return
    setJoining(true)
    setError(null)
    try {
      await onJoin(normalizedCode, name.trim().replace(/\s+/g, ' ').slice(0, 16), rejoinCode.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join this room. Check the code and try again.')
      setJoining(false)
    }
  }

  return (
    <div className="join-screen">
      <button type="button" className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <h1 className="join-title">Enter Room Code</h1>

      <label className="field">
        <span className="field-label">Room code</span>
        <input
          id="room-code"
          name="room-code"
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
        <span className="field-label">Your name</span>
        <input
          id="player-name"
          name="player-name"
          className="field-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 16))}
          placeholder="AMP"
          maxLength={16}
        />
      </label>

      {showRejoin ? (
        <label className="field">
          <span className="field-label">Your rejoin code</span>
          <input
            id="rejoin-code"
            name="rejoin-code"
            className="field-input"
            type="text"
            value={rejoinCode}
            onChange={(e) => setRejoinCode(e.target.value.toUpperCase())}
            placeholder="PXXXXXXXX"
            spellCheck={false}
            autoComplete="off"
          />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => setShowRejoin(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: 12,
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Rejoining? Enter your rejoin code
        </button>
      )}

      <Button
        variant="primary"
        className="join-btn"
        disabled={!canJoin}
        onClick={handleJoin}
      >
        {joining ? 'Joining…' : 'Join Room'}
      </Button>

      {error && <p className="join-error" role="alert">{error}</p>}

      <p className="join-hint">
        Paste the full code from the host, dashes and all.
      </p>
    </div>
  )
}