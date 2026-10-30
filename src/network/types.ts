// ---------- Players ----------

export type PlayerId = string

export type PlayerRole = 'player' | 'spectator'

export type Player = {
  id: PlayerId
  name: string
  role: PlayerRole
  isHost: boolean
  score: number
  joinedAt: number
  playerToken: string
  status: 'active' | 'pending'
  rejoinReason?: string
}

// ---------- Rooms ----------

export type RoomCode = string

// ---------- Guess Result ----------

export type GuessResult = {
  correctPosition: number
  correctDigit: number
  points: number
}

// ---------- Challenge Outcome ----------

export type ChallengeOutcome = {
  challengerId: PlayerId
  challengerName: string
  targetId: PlayerId
  targetName: string
  success: boolean
  reason: 'missing' | 'false' | 'true'
  claimText: string
  points: number
}

// ---------- Game Events ----------

export type GameEvent =
  | { type: 'HELLO'; player: Player; isReturning?: boolean; rejoinCode?: string; requestId?: string }
  // Sent directly by the host to the reconnecting peer; never broadcast.
  | { type: 'REJOIN_IDENTIFIED'; requestId: string; playerId: PlayerId; rejoinCode: string }
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: PlayerId; reason?: string }
  | { type: 'NAME_CHANGED'; playerId: PlayerId; name: string }
  | { type: 'GAME_START'; roundLabel: string; deadlineAt?: number }
  | { type: 'LOCK_SUBMITTED'; playerId: PlayerId; code: string }
  | { type: 'LOCK_STATUS'; playerId: PlayerId }
  | { type: 'LOCK_CODE_ASSIGNED'; playerId: PlayerId; code: string }
  | {
      type: 'PEEK_SHARED'
      from: PlayerId
      to: PlayerId
      digitIndex: number
      digit: string
    }
  | { type: 'PHASE_CHANGE'; phase: string; roundLabel: string; deadlineAt?: number }
  | { type: 'BLUFF_SUBMITTED'; playerId: PlayerId; text: string }
  | {
      type: 'CHALLENGE_SUBMITTED'
      challengerId: PlayerId
      targetId: PlayerId
    }
  | {
      type: 'GUESS_SUBMITTED'
      guessId: string
      guesserId: PlayerId
      targetId: PlayerId
      code: string
      result?: GuessResult
    }
  | {
      type: 'GUESS_RESOLVED'
      guessId: string
      guesserId: PlayerId
      targetId: PlayerId
      code: string
      result: GuessResult
    }
  | { type: 'CODES_REVEALED'; codesByPlayer: Record<PlayerId, string> }
  | {
      type: 'ROUND_COMPLETE'
      roundNumber: number
      scores: Record<PlayerId, number>
      deltas: Record<PlayerId, number>
      challengeResults: ChallengeOutcome[]
    }
  | {
      type: 'GAME_STATE_SYNC'
      gameStarted: boolean
      gameOver?: boolean
      deadlineAt?: number
      phase: string
      roundLabel: string
      lockedPlayers: PlayerId[]
      bluffedPlayers: PlayerId[]
      bluffs: Record<PlayerId, string>
      players: Player[]
      challenges: Record<PlayerId, PlayerId>
      roundNumber: number
      scores: Record<PlayerId, number>
      spectators: Player[]
    }

    | { type: 'ROSTER_SYNC'; players: Player[]; heldPlayers: PlayerId[] }
    | { type: 'ROUND_SNAPSHOT'
        gameStarted: boolean
        deadlineAt?: number
        players: Player[]
        heldPlayers: PlayerId[]
        spectators: Player[]
        roundNumber: number
        phase: string
        roundLabel: string
        lockedPlayers: PlayerId[]
        bluffedPlayers: PlayerId[]
        bluffs: Record<PlayerId, string>
        challenges: Record<PlayerId, PlayerId>
        codesByPlayer: Record<PlayerId, string>
        scores: Record<PlayerId, number>
    }

  | { type: 'JOIN_APPROVED'; playerId: PlayerId; playerToken?: string; rejoinCode?: string }
  | { type: 'JOIN_REJECTED'; playerId: PlayerId }
  | { type: 'ROOM_FULL'; playerId: PlayerId }
  | { type: 'REASON_UPDATED'; playerId: PlayerId; reason: string }
  | { type: 'SPECTATOR_JOIN'; spectator: Player }
  | { type: 'SPECTATOR_LEFT'; spectatorId: PlayerId }
  | { type: 'REACTION'; fromId: PlayerId; emoji: string; id?: string }

// ---------- Connection State ----------

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'in-lobby'
  | 'failed'
  | 'closed'