import { useEffect } from 'react'
import { Button } from '../Button'
import './HowToPlayModal.css'

type HowToPlayModalProps = {
  onClose: () => void
}

const phases = [
  {
    number: '1',
    title: 'LOCK — choose your secret',
    description:
      'Use the number buttons to make a 3-digit code. Each digit must be from 1 to 9. You may repeat a digit. Keep your code secret, then press “Lock It”.',
    example: 'Example: 7 · 2 · 7',
  },
  {
    number: '2',
    title: 'PEEK — remember one number',
    description:
      'The game secretly shows you one digit from another player’s code. Remember the digit and where it appeared: first, middle, or last. Another player gets one digit from your code.',
    example: 'Example: ? · 4 · ? means the middle digit is 4.',
  },
  {
    number: '3',
    title: 'BLUFF — write a clue',
    description:
      'Write a short sentence about your own secret code. It can be true or a lie. You can also leave it blank. You have a short time, so keep it simple.',
    example: 'Example: “My code starts with a 7.”',
  },
  {
    number: '4',
    title: 'CHALLENGE — choose carefully',
    description:
      'You may challenge one other player, or skip this step. Important: the current game rule gives you challenge points when that player left their clue blank. If they wrote any clue, your challenge does not succeed. The game does not automatically check whether a written clue is true or false.',
    example: 'Successful challenge: +4 points · Unsuccessful challenge: −3 points.',
  },
  {
    number: '5',
    title: 'GUESS — try to crack a code',
    description:
      'Choose another player, enter a 3-digit guess, and press “Submit Guess”. You can make up to 3 guesses each round. Use the digit you saw and the clues to help you.',
    example: '✓ = right number in the right place · ~ = right number in the wrong place.',
  },
  {
    number: '6',
    title: 'REVEAL — see the answers',
    description:
      'Everyone’s secret codes are shown. The points you earned in that round are added to the scoreboard. Then the next round begins automatically.',
    example: 'After Round 5, the player with the most total points wins.',
  },
]

const rounds = [
  { round: 'ROUND 1', title: 'Get comfortable', detail: 'Play all six steps. Learn how the secret codes, clues, challenges, and guesses work.' },
  { round: 'ROUND 2', title: 'Use what you learned', detail: 'The same six steps. Remember the clues and the digit you saw.' },
  { round: 'ROUND 3', title: 'DOUBLE POINTS', detail: 'The same game, but points gained or lost in this round are doubled. Think carefully!' },
  { round: 'ROUND 4', title: 'Back to normal points', detail: 'Play the same six steps again and try to move up the scoreboard.' },
  { round: 'ROUND 5', title: 'THE LAST ROUND', detail: 'This is the final chance to score. After the reveal, the game ends and the highest total score wins.' },
]

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="tutorial-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="tutorial-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <header className="tutorial-header">
          <div>
            <p className="tutorial-eyebrow">NEON SIGNAL · PLAYER GUIDE</p>
            <h2 id="tutorial-title">How to Play</h2>
            <p className="tutorial-lead">
              No computer experience is needed. Read these steps, then follow the instructions that appear on the screen while you play.
            </p>
          </div>
          <button
            type="button"
            className="tutorial-close"
            onClick={onClose}
            aria-label="Close tutorial"
          >
            ×
          </button>
        </header>

        <div className="tutorial-content">
          <section className="tutorial-welcome">
            <h3>Start here</h3>
            <p>
              One person chooses <strong>Create Room</strong> and shares the room code. Everyone else chooses <strong>Join With Code</strong>, types that code and their name, and waits in the lobby. You need at least 2 players. A room can have up to 8 players.
            </p>
            <p>
              Just watching? Choose <strong>Watch A Game</strong>, enter the room code and your name, and you can watch without taking a player spot.
            </p>
          </section>

          <section className="tutorial-section">
            <div className="tutorial-section-heading">
              <span className="tutorial-section-kicker">THE SAME SIX STEPS</span>
              <h3>What happens in every round?</h3>
            </div>
            <div className="tutorial-phase-list">
              {phases.map((phase) => (
                <article className="tutorial-phase" key={phase.number}>
                  <span className="tutorial-phase-number">{phase.number}</span>
                  <div>
                    <h4>{phase.title}</h4>
                    <p>{phase.description}</p>
                    <p className="tutorial-example">{phase.example}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="tutorial-section">
            <div className="tutorial-section-heading">
              <span className="tutorial-section-kicker">YOUR FIVE ROUNDS</span>
              <h3>Round 1 through Round 5</h3>
              <p>All five rounds use the same six steps. Only Round 3 has a special scoring rule.</p>
            </div>
            <div className="tutorial-round-list">
              {rounds.map((item) => (
                <article
                  className={`tutorial-round${item.round === 'ROUND 3' ? ' tutorial-round-double' : ''}${item.round === 'ROUND 5' ? ' tutorial-round-final' : ''}`}
                  key={item.round}
                >
                  <span>{item.round}</span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="tutorial-section tutorial-scoring">
            <div className="tutorial-section-heading">
              <span className="tutorial-section-kicker">POINTS MADE SIMPLE</span>
              <h3>How do I earn points?</h3>
            </div>
            <ul>
              <li><strong>+3 points</strong> for each correct digit in the correct position.</li>
              <li><strong>+1 point</strong> for each correct digit in the wrong position.</li>
              <li><strong>+5 extra points</strong> for guessing all 3 digits in the exact correct order.</li>
              <li><strong>Up to 3 guesses</strong> are allowed in each round.</li>
              <li><strong>Bluff bonus: +2 points</strong> for writing a clue that is not successfully challenged.</li>
            </ul>
            <p className="tutorial-note">
              Round 3 doubles points, including challenge points and penalties. The scoreboard shows your running total. The player with the highest total after Round 5 wins.
            </p>
          </section>

          <section className="tutorial-tip">
            <strong>Easy tip:</strong> Take your time, read the words on each screen, and use the number buttons shown in the game. You do not need to type numbers on your computer keyboard.
          </section>
        </div>

        <footer className="tutorial-footer">
          <span>Good luck. Keep your code secret!</span>
          <Button variant="primary" onClick={onClose}>Got it — let’s play</Button>
        </footer>
      </section>
    </div>
  )
}
