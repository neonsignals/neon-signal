import { PlayerRing } from './PlayerRing'
import { TableContent } from './TableContent'
import { Leaderboard } from '../ui/Leaderboard'
import { JoinBanner } from '../ui/JoinBanner'
import { PHASE_COLORS, type Phase } from '@/shared/phases'
import './Stage.css'
import './TableContent.css'

type Player = {
  id: string
  name: string
  isHost?: boolean
  score?: number
  joinedAt?: number
  bluff?: string | null
}

type StageProps = {
  players?: Player[]
  phase?: Phase
  roundLabel?: string
  showLeaderboard?: boolean
  joinBannerName?: string | null
  onJoinBannerDismiss?: () => void
}

export function Stage({
  players = [],
  phase = 'lock',
  roundLabel,
  showLeaderboard = true,
  joinBannerName = null,
  onJoinBannerDismiss,
}: StageProps) {
  const phaseColor = PHASE_COLORS[phase]

  const leaderboardPlayers = players.map((p) => ({
    id: p.id,
    name: p.name,
    score: p.score ?? 0,
  }))

  return (
    <div className="stage-wrapper">
      {joinBannerName && onJoinBannerDismiss && (
        <JoinBanner
          playerName={joinBannerName}
          onDismiss={onJoinBannerDismiss}
        />
      )}

      {showLeaderboard && (
        <div className="stage-leaderboard">
          <Leaderboard
            players={leaderboardPlayers}
            roundLabel={roundLabel}
          />
        </div>
      )}

      <div className="stage">
        <div
          className="stage-table"
          style={{ ['--phase-color' as string]: phaseColor }}
        >
          <div className="stage-table-inner">
            <TableContent phase={phase} />
          </div>
        </div>

        <PlayerRing players={players} />
      </div>
    </div>
  )
}