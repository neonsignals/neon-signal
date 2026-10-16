import { Button } from '../components/Button'
import './LandingScreen.css'

type LandingScreenProps = {
  onCreateRoom: () => void
  onJoinRoom: () => void
  onWatchGame: () => void
}

export function LandingScreen({
  onCreateRoom,
  onJoinRoom,
  onWatchGame,
}: LandingScreenProps) {
  return (
    <div className="landing">
      <div className="landing-header">
        <h1 className="landing-title">⚡ Neon Signal ⚡</h1>
        <p className="landing-tagline">late-night heist</p>
      </div>

      <div className="landing-actions">
        <Button variant="primary" onClick={onCreateRoom}>
          ▶ Create Room
        </Button>
        <Button variant="secondary" onClick={onJoinRoom}>
          ⌨ Join With Code
        </Button>
        <Button variant="ghost" onClick={onWatchGame}>
          👁 Watch A Game
        </Button>
      </div>
    </div>
  )
}