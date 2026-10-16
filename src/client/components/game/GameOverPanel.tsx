import './GameOverPanel.css'

type FinalPlayer = {
  id: string
  name: string
  score: number
  isYou: boolean
}

type GameOverPanelProps = {
  players: FinalPlayer[]
  onPlayAgain: () => void
  onBackToHome: () => void
}

export function GameOverPanel({
  players,
  onPlayAgain,
  onBackToHome,
}: GameOverPanelProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)
  const winner = sorted[0]
  const hasTie = sorted.length > 1 && sorted[0].score === sorted[1].score

  return (
    <div className="game-over">
      <div className="game-over-confetti" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="game-over-confetti-piece"
            style={{
              left: `${(i * 100) / 24}%`,
              animationDelay: `${(i % 8) * 0.15}s`,
              background:
                i % 3 === 0
                  ? 'var(--color-cyan)'
                  : i % 3 === 1
                  ? 'var(--color-magenta)'
                  : 'var(--color-amber)',
            }}
          />
        ))}
      </div>

      <div className="game-over-winner">
        <div className="game-over-trophy">🏆</div>
        <p className="game-over-title">
          {hasTie ? 'IT’S A TIE' : 'WINNER'}
        </p>
        <p className="game-over-winner-name">{winner?.name ?? '???'}</p>
        <p className="game-over-winner-score">
          {winner?.score ?? 0} points
        </p>
        {winner?.isYou && (
          <p className="game-over-you-won">That’s you! 🎉</p>
        )}
      </div>

      <div className="game-over-standings">
        <p className="game-over-standings-title">Final Standings</p>
        <ol className="game-over-list">
          {sorted.map((p, i) => (
            <li
              key={p.id}
              className={
                'game-over-row' +
                (i === 0 ? ' game-over-row-gold' : '') +
                (i === 1 ? ' game-over-row-silver' : '') +
                (i === 2 ? ' game-over-row-bronze' : '') +
                (p.isYou ? ' game-over-row-you' : '')
              }
            >
              <span className="game-over-rank">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </span>
              <span className="game-over-name">
                {p.name}
                {p.isYou && (
                  <span className="game-over-you-tag"> (you)</span>
                )}
              </span>
              <span className="game-over-score">{p.score}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="game-over-actions">
        <button
          type="button"
          className="game-over-btn game-over-btn-primary"
          onClick={onPlayAgain}
        >
          ▶ Play Again
        </button>
        <button
          type="button"
          className="game-over-btn game-over-btn-ghost"
          onClick={onBackToHome}
        >
          ⌂ Back to Home
        </button>
      </div>
    </div>
  )
}