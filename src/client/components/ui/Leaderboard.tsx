type Player = {
  id: string
  name: string
  score: number
}

type LeaderboardProps = {
  players: Player[]
  title?: string
  roundLabel?: string
}

export function Leaderboard({
  players,
  title = 'LIVE SCORE',
  roundLabel,
}: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)
  const topScore = sorted[0]?.score ?? 0

  return (
    <div className="leaderboard">
      <header className="leaderboard-header">
        <span className="leaderboard-title">⚡ {title}</span>
        {roundLabel && <span className="leaderboard-round">{roundLabel}</span>}
      </header>

      <ul className="leaderboard-list">
        {sorted.map((player, index) => {
          const rank = index + 1
          const percent = topScore > 0 ? (player.score / topScore) * 100 : 0
          const rankClass =
            rank === 1
              ? 'leaderboard-row-gold'
              : rank === 2
              ? 'leaderboard-row-silver'
              : rank === 3
              ? 'leaderboard-row-bronze'
              : ''

          return (
            <li
              key={player.id}
              className={`leaderboard-row ${rankClass}`}
            >
              <span className="leaderboard-rank">{rank}</span>
              <span className="leaderboard-name">{player.name}</span>
              <span className="leaderboard-score">{player.score}</span>
              <div className="leaderboard-bar-track">
                <div
                  className="leaderboard-bar-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          )
        })}

        {sorted.length === 0 && (
          <li className="leaderboard-empty">No scores yet</li>
        )}
      </ul>
    </div>
  )
}