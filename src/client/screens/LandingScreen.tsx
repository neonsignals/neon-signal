import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../components/Button'
import { HowToPlayModal } from '../components/tutorial/HowToPlayModal'
import './LandingScreen.css'

type LandingScreenProps = {
  onCreateRoom: (playerName: string) => Promise<void>
  onJoinRoom: () => void
  onWatchGame: () => void
}

export function LandingScreen({ onCreateRoom, onJoinRoom, onWatchGame }: LandingScreenProps) {
  const [showTutorial, setShowTutorial] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [hostName, setHostName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const createDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = createDialogRef.current
    if (!dialog) return
    if (showCreateDialog && !dialog.open) dialog.showModal()
    if (!showCreateDialog && dialog.open) dialog.close()
  }, [showCreateDialog])

  async function submitCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = hostName.trim().replace(/\s+/g, ' ').slice(0, 16)
    if (!cleanName) {
      setCreateError('Please enter a name before creating your room.')
      return
    }

    setCreating(true)
    setCreateError(null)
    try {
      await onCreateRoom(cleanName)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'The room could not be created. Please try again.')
      setCreating(false)
    }
  }

  return (
    <>
      <main className="landing">
        <header className="landing-header">
          <p className="landing-eyebrow">LIVE MULTIPLAYER · CODE & BLUFF ARENA</p>
          <h1 className="landing-title">NEON SIGNAL</h1>
          <p className="landing-tagline">THINK · BLUFF · CHALLENGE · WIN</p>
          <p className="landing-description">
            Read the clues. Outsmart the table. Challenge a bluff and crack the secret code before your rivals do.
          </p>
          <div className="landing-metrics" aria-label="Game features">
            <span><strong>08</strong> PLAYERS</span>
            <span><strong>05</strong> ROUNDS</span>
            <span><strong>LIVE</strong> MULTIPLAYER</span>
          </div>
        </header>

        <nav className="landing-actions" aria-label="Main menu">
          <Button variant="primary" onClick={() => { setCreateError(null); setShowCreateDialog(true) }}>
            ▶ Create Room
          </Button>
          <Button variant="secondary" onClick={onJoinRoom}>
            ⌨ Join With Code
          </Button>
          <Button variant="ghost" onClick={onWatchGame}>
            👁 Watch A Game
          </Button>
          <Button
            variant="ghost"
            className="landing-tutorial-button"
            onClick={() => setShowTutorial(true)}
            aria-haspopup="dialog"
          >
            ? How to Play
          </Button>
        </nav>
      </main>

      <dialog
        ref={createDialogRef}
        className="create-room-dialog"
        aria-labelledby="create-room-title"
        onClose={() => setShowCreateDialog(false)}
        onCancel={() => setShowCreateDialog(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget && !creating) setShowCreateDialog(false)
        }}
      >
        <form className="create-room-form" onSubmit={submitCreateRoom}>
          <p className="create-room-eyebrow">NEW GAME</p>
          <h2 id="create-room-title">Create a room</h2>
          <p className="create-room-description">Choose the name other players will see in the lobby.</p>
          <label className="create-room-label" htmlFor="host-player-name">Your name</label>
          <input
            id="host-player-name"
            className="create-room-input"
            value={hostName}
            onChange={(event) => setHostName(event.target.value.slice(0, 16))}
            placeholder="Enter your name"
            maxLength={16}
            autoComplete="nickname"
            autoFocus
            required
          />
          {createError && <p className="create-room-error" role="alert">{createError}</p>}
          <div className="create-room-actions">
            <Button type="button" variant="ghost" disabled={creating} onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={creating || !hostName.trim()}>
              {creating ? 'Creating…' : 'Create room'}
            </Button>
          </div>
        </form>
      </dialog>

      {showTutorial && <HowToPlayModal onClose={() => setShowTutorial(false)} />}
    </>
  )
}
