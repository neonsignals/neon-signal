import { useEffect } from 'react'
import './ScorePop.css'

type ScorePop = {
  id: string
  amount: number
  playerName: string
}

type ScorePopContainerProps = {
  pops: ScorePop[]
  onExpire: (id: string) => void
}

export function ScorePopContainer({
  pops,
  onExpire,
}: ScorePopContainerProps) {
  return (
    <div className="score-pop-layer" aria-hidden="true">
      {pops.map((p) => (
        <ScorePopItem key={p.id} pop={p} onExpire={onExpire} />
      ))}
    </div>
  )
}

function ScorePopItem({
  pop,
  onExpire,
}: {
  pop: ScorePop
  onExpire: (id: string) => void
}) {
  useEffect(() => {
    const t = setTimeout(() => onExpire(pop.id), 2200)
    return () => clearTimeout(t)
  }, [pop.id, onExpire])

  const positive = pop.amount > 0

  return (
    <div
      className={
        'score-pop' + (positive ? ' score-pop-pos' : ' score-pop-neg')
      }
    >
      <div className="score-pop-player">{pop.playerName}</div>
      <div className="score-pop-amount">
        {positive ? `+${pop.amount}` : pop.amount}
      </div>
    </div>
  )
}