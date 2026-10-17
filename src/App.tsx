import { useState, useEffect, useRef } from 'react'
import { LandingScreen } from './client/screens/LandingScreen'
import { JoinRoomScreen } from './client/screens/JoinRoomScreen'
import { LobbyScreen } from './client/screens/LobbyScreen'
import { SpectatorScreen } from './client/screens/SpectatorScreen'
import { Stage } from './client/components/stage/Stage'
import { LockPanel } from './client/components/game/LockPanel'
import { PeekPanel } from './client/components/game/PeekPanel'
import { BluffPanel } from './client/components/game/BluffPanel'
import { ChallengePanel } from './client/components/game/ChallengePanel'
import { GuessPanel } from './client/components/game/GuessPanel'
import { RevealPanel } from './client/components/game/RevealPanel'
import { GameOverPanel } from './client/components/game/GameOverPanel'
import { PhaseIntro } from './client/components/game/PhaseIntro'
import { ScorePopContainer } from './client/components/game/ScorePop'
import { ScreenShake } from './client/components/game/ScreenShake'
import { RoundWinnerCallout } from './client/components/game/RoundWinnerCallout'
import {
  ReactionLayer,
  type ReactionEntry,
} from './client/components/game/ReactionLayer'
import { Button } from './client/components/Button'
import { MuteButton } from './client/components/MuteButton'
import { useNetwork } from './client/hooks/useNetwork'
import { useJoinBanner } from './client/hooks/useJoinBanner'
import { useSound } from './client/hooks/useSound'
import { PHASES, type Phase } from './shared/phases'
import { formatRoomCode } from './shared/roomCode'
import {
  getOrCreateToken,
  regenerateToken,
  saveSession,
  loadSession,
  clearSession,
} from './shared/session'
import type { Player, GuessResult, ChallengeOutcome, GameEvent } from './network/types'
import { network } from '@/network'
import './client/components/Button.css'
import './client/components/beasts/Beast.css'
import './client/components/ui/Leaderboard.css'
import './client/components/ui/JoinBanner.css'
import './client/components/game/LockPanel.css'
import './client/components/game/PeekPanel.css'
import './client/components/game/BluffPanel.css'
import './client/components/game/ChallengePanel.css'
import './client/components/game/GuessPanel.css'
import './client/components/game/RevealPanel.css'
import './client/components/game/GameOverPanel.css'
import './client/components/game/PhaseIntro.css'
import './client/components/game/ScorePop.css'
import './client/components/game/ScreenShake.css'
import './client/components/game/RoundWinnerCallout.css'
import './client/components/game/ReactionLayer.css'
import './client/components/game/ReactionBar.css'
import './client/components/stage/Stage.css'
import './client/components/stage/PlayerRing.css'
import './client/components/stage/PlayerSeat.css'
import './client/components/stage/TableContent.css'
import './client/screens/LandingScreen.css'
import './client/screens/JoinRoomScreen.css'
import './client/screens/LobbyScreen.css'
import './client/screens/SpectatorScreen.css'

type Screen =
  | 'landing'
  | 'join'
  | 'reason'
  | 'waiting'
  | 'lobby'
  | 'stage'
  | 'game-over'
  | 'spectator'

type PeekInfo = {
  fromPlayerId: string
  fromPlayerName: string
  digitIndex: number
  digit: string
}

type MyGuess = {
  guessId: string
  targetId: string
  targetName: string
  code: string
  result: GuessResult
  pending?: boolean
}

type PopEntry = {
  id: string
  amount: number
  playerName: string
}

const TOTAL_ROUNDS = 5
const DOUBLE_ROUNDS = [3]
const PHASE_DURATION_MS: Record<Phase, number> = {
  lock: 15_000,
  peek: 10_000,
  bluff: 30_000,
  challenge: 25_000,
  guess: 50_000,
  reveal: 15_000,
}

const PHASE_LABELS: Record<string, string> = {
  lock: 'Lock',
  peek: 'Peek',
  bluff: 'Bluff',
  challenge: 'Challenge',
  guess: 'Guess',
  reveal: 'Reveal',
}

function scoreGuess(guess: string, secret: string): GuessResult {
  const g = guess.split('').map(Number)
  const s = secret.split('').map(Number)
  const usedG = [false, false, false]
  const usedS = [false, false, false]
  let correctPosition = 0
  let correctDigit = 0

  for (let i = 0; i < 3; i++) {
    if (g[i] === s[i]) {
      correctPosition++
      usedG[i] = true
      usedS[i] = true
    }
  }
  for (let i = 0; i < 3; i++) {
    if (usedG[i]) continue
    for (let j = 0; j < 3; j++) {
      if (usedS[j]) continue
      if (g[i] === s[j]) {
        correctDigit++
        usedG[i] = true
        usedS[j] = true
        break
      }
    }
  }
  const points =
    correctPosition * 3 +
    correctDigit * 1 +
    (correctPosition === 3 ? 5 : 0)
  return { correctPosition, correctDigit, points }
}

function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [playerName, setPlayerName] = useState('')
  const [previewPhase, setPreviewPhase] = useState<Phase>('lock')
  const [players, setPlayers] = useState<Player[]>([])
  const [pendingPlayers, setPendingPlayers] = useState<Player[]>([])
  const [spectators, setSpectators] = useState<Player[]>([])
  const [spectatorJoined, setSpectatorJoined] = useState(false)
  const [lockedPlayers, setLockedPlayers] = useState<string[]>([])
  const [codesByPlayer, setCodesByPlayer] = useState<Record<string, string>>({})
  const [myCode, setMyCode] = useState<string | null>(null)
  const [myPeek, setMyPeek] = useState<PeekInfo | null>(null)
  const [bluffs, setBluffs] = useState<Record<string, string>>({})
  const [bluffedPlayers, setBluffedPlayers] = useState<string[]>([])
  const [challenges, setChallenges] = useState<Record<string, string>>({})
  const [guesses, setGuesses] = useState<Record<string, MyGuess[]>>({})
  const [roundNumber, setRoundNumber] = useState(1)
  const [phaseDeadlineAt, setPhaseDeadlineAt] = useState<number | null>(null)
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [roundDeltas, setRoundDeltas] = useState<Record<string, number>>({})
  const [challengeResults, setChallengeResults] = useState<ChallengeOutcome[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [joinedMidRound, setJoinedMidRound] = useState(false)
  const [reasonInput, setReasonInput] = useState('')
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null)
  const [myRejoinCode, setMyRejoinCode] = useState<string>('')
  const [pops, setPops] = useState<PopEntry[]>([])
  const [showIntro, setShowIntro] = useState(false)
  const [shakeTrigger, setShakeTrigger] = useState(0)
  const [shakeKind, setShakeKind] = useState<'light' | 'heavy'>('light')
  const [reactions, setReactions] = useState<ReactionEntry[]>([])
  const [heldPlayers, setHeldPlayers] = useState<string[]>([])

  const showDevTools =
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug')

  const peekSentRef = useRef(false)
  const lastSpokenRoundRef = useRef<number>(0)
  const lastSpokenPhaseRef = useRef<string>('')
  const lastPopRoundRef = useRef<number>(0)
  const lastShakeRoundRef = useRef<number>(0)
  const lastReactionAtRef = useRef<number>(0)
  const sentReactionIdsRef = useRef<Set<string>>(new Set())

  const {
    roomCode,
    selfId,
    selfName,
    lastEvent,
    createRoom,
    joinRoom,
    leaveRoom,
    send,
    sendToPlayer,
    clearLastEvent,
  } = useNetwork()

  const { currentName, triggerJoin, dismissCurrent, clearAll } =
    useJoinBanner()

  const { play, speak, muted, toggleMute } = useSound()

  const playersRef = useRef<Player[]>(players)
  const gameStartedRef = useRef<boolean>(gameStarted)
  const previewPhaseRef = useRef<Phase>(previewPhase)
  const lockedPlayersRef = useRef<string[]>(lockedPlayers)
  const codesByPlayerRef = useRef<Record<string, string>>(codesByPlayer)
  const bluffsRef = useRef<Record<string, string>>(bluffs)
  const bluffedPlayersRef = useRef<string[]>(bluffedPlayers)
  const challengesRef = useRef<Record<string, string>>(challenges)
  const guessesRef = useRef<Record<string, MyGuess[]>>(guesses)
  const roundNumberRef = useRef<number>(roundNumber)
  const scoresRef = useRef<Record<string, number>>(scores)
  const myCodeRef = useRef<string | null>(myCode)
  const selfIdRef = useRef<string | null>(selfId)
  const selfNameRef = useRef<string | null>(selfName)
  const myPlayerIdRef = useRef<string | null>(myPlayerId)
  const spectatorsRef = useRef<Player[]>(spectators)
  const heldPlayersRef = useRef<string[]>(heldPlayers)
  const peerToPlayerRef = useRef<Record<string, string>>({})
  const activePeerByPlayerRef = useRef<Record<string, string>>({})
  const pendingPeerByPlayerRef = useRef<Record<string, string>>({})
  const phaseDeadlineAtRef = useRef<number | null>(phaseDeadlineAt)
  const handledPhaseKeyRef = useRef<string | null>(null)
  const isSpectatorRef = useRef<boolean>(false)

  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { gameStartedRef.current = gameStarted }, [gameStarted])
  useEffect(() => { previewPhaseRef.current = previewPhase }, [previewPhase])
  useEffect(() => { lockedPlayersRef.current = lockedPlayers }, [lockedPlayers])
  useEffect(() => { codesByPlayerRef.current = codesByPlayer }, [codesByPlayer])
  useEffect(() => { bluffsRef.current = bluffs }, [bluffs])
  useEffect(() => { bluffedPlayersRef.current = bluffedPlayers }, [bluffedPlayers])
  useEffect(() => { challengesRef.current = challenges }, [challenges])
  useEffect(() => { guessesRef.current = guesses }, [guesses])
  useEffect(() => { roundNumberRef.current = roundNumber }, [roundNumber])
  useEffect(() => { scoresRef.current = scores }, [scores])
  useEffect(() => { myCodeRef.current = myCode }, [myCode])
  useEffect(() => { selfIdRef.current = selfId }, [selfId])
  useEffect(() => { selfNameRef.current = selfName }, [selfName])
  useEffect(() => { myPlayerIdRef.current = myPlayerId }, [myPlayerId])
  useEffect(() => { spectatorsRef.current = spectators }, [spectators])
  useEffect(() => { heldPlayersRef.current = heldPlayers }, [heldPlayers])
  useEffect(() => { phaseDeadlineAtRef.current = phaseDeadlineAt }, [phaseDeadlineAt])
  useEffect(() => {
    isSpectatorRef.current = screen === 'spectator'
  }, [screen])

  useEffect(() => {
    setMyRejoinCode(getOrCreateToken())
  }, [])

  function triggerShake(kind: 'light' | 'heavy') {
    setShakeKind(kind)
    setShakeTrigger((n) => n + 1)
  }

  // Auto-rejoin on refresh — skipped if the user is in spectator mode
  useEffect(() => {
    if (isSpectatorRef.current) return
    const saved = loadSession()
    if (!saved) return
    if (saved.isHost) {
      clearSession()
      return
    }
    ;(async () => {
      try {
        setPlayerName(saved.playerName)
        await joinRoom(saved.roomCode, saved.playerName)
        await new Promise((r) => setTimeout(r, 250))

        setMyPlayerId(saved.myPlayerId)

        const selfPlayer: Player = {
          id: saved.myPlayerId,
          name: saved.playerName,
          role: 'player',
          isHost: false,
          score: 0,
          joinedAt: Date.now(),
          playerToken: saved.playerToken,
          status: 'pending',
        }

        send({ type: 'HELLO', player: selfPlayer, isReturning: true })

        setPendingRoomCode(saved.roomCode)
        setScreen('reason')
      } catch (err) {
        console.warn('[App] Auto-rejoin failed:', err)
        clearSession()
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Join banner + narrator
  const prevPlayerIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    const currentIds = new Set(players.map((p) => p.id))
    for (const p of players) {
      if (p.id === myPlayerIdRef.current) continue
      if (!prevPlayerIdsRef.current.has(p.id)) {
        triggerJoin(p.name)
        play('join')
        speak(`${p.name} has entered the room`)
      }
    }
    prevPlayerIdsRef.current = currentIds
  }, [players, triggerJoin, play, speak])

  // Narrate phase changes
  useEffect(() => {
    if (!gameStarted) return
    if (screen !== 'stage') return
    const key = `${roundNumber}:${previewPhase}`
    if (lastSpokenPhaseRef.current === key) return
    lastSpokenPhaseRef.current = key

    const isDouble = DOUBLE_ROUNDS.includes(roundNumber)

    switch (previewPhase) {
      case 'lock':
        if (roundNumber !== lastSpokenRoundRef.current) {
          lastSpokenRoundRef.current = roundNumber
          if (isDouble) {
            speak(`Round ${roundNumber}. Points are doubled. Pick your codes`)
          } else {
            speak(`Round ${roundNumber}. Pick your secret codes`)
          }
        }
        break
      case 'peek':
        play('select')
        speak('Peek phase. One digit revealed')
        break
      case 'bluff':
        play('select')
        speak('Bluff phase. Say something about your code')
        break
      case 'challenge':
        play('challenge')
        speak('Challenge phase. Call a liar out')
        break
      case 'guess':
        play('select')
        speak('Guess phase. Try to crack a code')
        break
      case 'reveal':
        play('reveal')
        speak('Reveal. All codes are shown')
        break
      default:
        break
    }
  }, [previewPhase, roundNumber, gameStarted, screen, play, speak])

  // Challenge outcome narration + shake
  useEffect(() => {
    if (previewPhase !== 'reveal') return
    if (challengeResults.length === 0) return

    const timer = setTimeout(() => {
      for (const c of challengeResults) {
        if (c.success) {
          play('correct')
          speak(`${c.challengerName} caught ${c.targetName} lying`)
          triggerShake('heavy')
        } else {
          play('wrong')
          speak(`${c.challengerName} challenged ${c.targetName} wrongly`)
          triggerShake('light')
        }
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [previewPhase, challengeResults, play, speak])

  // Score pops on reveal
  useEffect(() => {
    if (previewPhase !== 'reveal') return
    if (lastPopRoundRef.current === roundNumber) return
    lastPopRoundRef.current = roundNumber

    const newPops: PopEntry[] = []
    for (const p of players) {
      const delta = roundDeltas[p.id]
      if (typeof delta === 'number' && delta !== 0) {
        newPops.push({
          id: `${roundNumber}-${p.id}`,
          amount: delta,
          playerName: p.name,
        })
      }
    }
    setPops(newPops)
  }, [previewPhase, roundNumber, players, roundDeltas])

  // Shake on new round
  useEffect(() => {
    if (screen !== 'stage') return
    if (previewPhase !== 'lock') return
    if (lastShakeRoundRef.current === roundNumber) return
    lastShakeRoundRef.current = roundNumber
    if (DOUBLE_ROUNDS.includes(roundNumber)) {
      triggerShake('heavy')
    } else {
      triggerShake('light')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewPhase, roundNumber, screen])

  // Phase intro overlay
  useEffect(() => {
    if (!gameStarted) return
    if (screen !== 'stage') return
    setShowIntro(true)
  }, [previewPhase, roundNumber, gameStarted, screen])

  function resetGameStateLocally() {
    setGameStarted(false)
    gameStartedRef.current = false
    setPhaseDeadlineAt(null)
    phaseDeadlineAtRef.current = null
    setRoundNumber(1)
    roundNumberRef.current = 1
    setLockedPlayers([])
    lockedPlayersRef.current = []
    setCodesByPlayer({})
    codesByPlayerRef.current = {}
    setMyCode(null)
    setMyPeek(null)
    setBluffs({})
    bluffsRef.current = {}
    setBluffedPlayers([])
    bluffedPlayersRef.current = []
    setChallenges({})
    challengesRef.current = {}
    setGuesses({})
    guessesRef.current = {}
    setScores({})
    scoresRef.current = {}
    setRoundDeltas({})
    setChallengeResults([])
    handledPhaseKeyRef.current = null
    setHeldPlayers([])
    heldPlayersRef.current = []
    clearAll()
  }

  function computeAndBroadcastScores() {
    const isDouble = DOUBLE_ROUNDS.includes(roundNumberRef.current)
    const multiplier = isDouble ? 2 : 1

    const deltas: Record<string, number> = {}
    const newTotals: Record<string, number> = { ...scoresRef.current }
    const challengeRes: ChallengeOutcome[] = []

    for (const p of playersRef.current) {
      deltas[p.id] = 0
    }

    for (const [guesserId, list] of Object.entries(guessesRef.current)) {
      for (const g of list) {
        const secret = codesByPlayerRef.current[g.targetId]
        if (!secret || !/^[1-9]{3}$/.test(g.code)) continue
        const verifiedResult = scoreGuess(g.code, secret)
        const gain = verifiedResult.points * multiplier
        deltas[guesserId] = (deltas[guesserId] ?? 0) + gain
      }
    }

    for (const [challengerId, targetId] of Object.entries(
      challengesRef.current
    )) {
      const targetBluff = bluffsRef.current[targetId] ?? ''
      const success = targetBluff.trim().length === 0
      const basePoints = success ? 4 : -3
      const points = basePoints * multiplier

      deltas[challengerId] = (deltas[challengerId] ?? 0) + points

      const challengerName =
        playersRef.current.find((p) => p.id === challengerId)?.name ?? '???'
      const targetName =
        playersRef.current.find((p) => p.id === targetId)?.name ?? '???'

      challengeRes.push({
        challengerId,
        challengerName,
        targetId,
        targetName,
        success,
        points,
      })
    }

    for (const p of playersRef.current) {
      const bluffText = bluffsRef.current[p.id] ?? ''
      const wasChallengedSuccessfully = challengeRes.some(
        (c) => c.targetId === p.id && c.success
      )
      if (bluffText.trim().length > 0 && !wasChallengedSuccessfully) {
        deltas[p.id] = (deltas[p.id] ?? 0) + 2 * multiplier
      }
    }

    for (const [id, delta] of Object.entries(deltas)) {
      newTotals[id] = (newTotals[id] ?? 0) + delta
    }

    scoresRef.current = newTotals
    setScores(newTotals)
    setRoundDeltas(deltas)
    setChallengeResults(challengeRes)

    send({
      type: 'ROUND_COMPLETE',
      roundNumber: roundNumberRef.current,
      scores: newTotals,
      deltas,
      challengeResults: challengeRes,
    })
  }

  function beginPhase(phase: Phase, round = roundNumberRef.current) {
    const deadlineAt = Date.now() + PHASE_DURATION_MS[phase]
    previewPhaseRef.current = phase
    roundNumberRef.current = round
    phaseDeadlineAtRef.current = deadlineAt
    setPreviewPhase(phase)
    setRoundNumber(round)
    setPhaseDeadlineAt(deadlineAt)
    send({
      type: 'PHASE_CHANGE',
      phase,
      roundLabel: `R${round}/5`,
      deadlineAt,
    })
  }

  function makeRandomCode() {
    return Array.from({ length: 3 }, () => String(1 + Math.floor(Math.random() * 9))).join('')
  }

  function advanceCurrentPhase() {
    if (selfIdRef.current !== 'host') return
    const phase = previewPhaseRef.current
    const round = roundNumberRef.current
    const key = `${round}:${phase}`
    if (handledPhaseKeyRef.current === key) return
    handledPhaseKeyRef.current = key

    const activePlayers = playersRef.current.filter(
      (player) => !heldPlayersRef.current.includes(player.id)
    )

    if (phase === 'lock') {
      const nextCodes = { ...codesByPlayerRef.current }
      const locked = new Set(lockedPlayersRef.current)
      for (const player of activePlayers) {
        if (locked.has(player.id)) continue
        const code = nextCodes[player.id] ?? makeRandomCode()
        nextCodes[player.id] = code
        locked.add(player.id)
        send({ type: 'LOCK_STATUS', playerId: player.id })
        sendToPlayer(player.id, { type: 'LOCK_CODE_ASSIGNED', playerId: player.id, code })
      }
      codesByPlayerRef.current = nextCodes
      lockedPlayersRef.current = [...locked]
      setCodesByPlayer(nextCodes)
      setLockedPlayers([...locked])
      if (myPlayerIdRef.current) {
        const ownCode = nextCodes[myPlayerIdRef.current]
        if (ownCode) setMyCode(ownCode)
      }
      beginPhase('peek', round)
      return
    }

    if (phase === 'peek') {
      beginPhase('bluff', round)
      return
    }

    if (phase === 'bluff') {
      const nextBluffs = { ...bluffsRef.current }
      const bluffed = new Set(bluffedPlayersRef.current)
      for (const player of activePlayers) {
        if (bluffed.has(player.id)) continue
        nextBluffs[player.id] = ''
        bluffed.add(player.id)
        send({ type: 'BLUFF_SUBMITTED', playerId: player.id, text: '' })
      }
      bluffsRef.current = nextBluffs
      bluffedPlayersRef.current = [...bluffed]
      setBluffs(nextBluffs)
      setBluffedPlayers([...bluffed])
      beginPhase('challenge', round)
      return
    }

    if (phase === 'challenge') {
      beginPhase('guess', round)
      return
    }

    if (phase === 'guess') {
      computeAndBroadcastScores()
      send({ type: 'CODES_REVEALED', codesByPlayer: codesByPlayerRef.current })
      beginPhase('reveal', round)
      return
    }

    if (phase === 'reveal') {
      if (round >= TOTAL_ROUNDS) {
        phaseDeadlineAtRef.current = null
        setPhaseDeadlineAt(null)
        send({ type: 'PHASE_CHANGE', phase: 'game-over', roundLabel: 'FINAL' })
        setScreen('game-over')
        return
      }

      if (heldPlayersRef.current.length > 0) {
        heldPlayersRef.current = []
        setHeldPlayers([])
        send({ type: 'ROSTER_SYNC', players: playersRef.current, heldPlayers: [] })
      }

      const nextRound = round + 1
      setLockedPlayers([])
      lockedPlayersRef.current = []
      setCodesByPlayer({})
      codesByPlayerRef.current = {}
      setMyCode(null)
      setMyPeek(null)
      setBluffs({})
      bluffsRef.current = {}
      setBluffedPlayers([])
      bluffedPlayersRef.current = []
      setChallenges({})
      challengesRef.current = {}
      setGuesses({})
      guessesRef.current = {}
      setRoundDeltas({})
      setChallengeResults([])
      beginPhase('lock', nextRound)
    }
  }

  useEffect(() => {
    if (!gameStarted || selfId !== 'host' || phaseDeadlineAt === null) return
    const delay = Math.max(0, phaseDeadlineAt - Date.now()) + 750
    const timer = setTimeout(() => advanceCurrentPhase(), delay)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, selfId, previewPhase, roundNumber, phaseDeadlineAt])

  // ---- Incoming network events ----
  useEffect(() => {
    if (!lastEvent) return

    try {
      const { event, from } = lastEvent
      const hostAuthorityEvents = new Set([
        'GAME_START', 'PHASE_CHANGE', 'LOCK_STATUS', 'LOCK_CODE_ASSIGNED', 'CODES_REVEALED',
        'GUESS_RESOLVED', 'ROUND_COMPLETE', 'GAME_STATE_SYNC',
        'ROSTER_SYNC', 'ROUND_SNAPSHOT', 'JOIN_APPROVED', 'JOIN_REJECTED',
      ])
      if (hostAuthorityEvents.has(event.type) && from !== 'host') return

      if (event.type === 'GAME_START') {
        if (selfIdRef.current === 'host' && from !== 'host') return
        // Spectator path — accept whenever we're currently on the spectator
        // screen, even if the ref hasn't caught up yet.
        if (isSpectatorRef.current || screen === 'spectator') {
          const spectatorDeadlineAt =
            event.deadlineAt ?? Date.now() + PHASE_DURATION_MS.lock
          setGameStarted(true)
          gameStartedRef.current = true
          setSpectatorJoined(true)
          setPreviewPhase('lock')
          previewPhaseRef.current = 'lock'
          setRoundNumber(1)
          roundNumberRef.current = 1
          setPhaseDeadlineAt(spectatorDeadlineAt)
          phaseDeadlineAtRef.current = spectatorDeadlineAt
          return
        }
        const deadlineAt = event.deadlineAt ?? Date.now() + PHASE_DURATION_MS.lock
        setGameStarted(true)
        gameStartedRef.current = true
        setPreviewPhase('lock')
        previewPhaseRef.current = 'lock'
        setPhaseDeadlineAt(deadlineAt)
        phaseDeadlineAtRef.current = deadlineAt
        setRoundNumber(1)
        roundNumberRef.current = 1
        setLockedPlayers([])
        lockedPlayersRef.current = []
        setCodesByPlayer({})
        codesByPlayerRef.current = {}
        setMyCode(null)
        setMyPeek(null)
        setBluffs({})
        bluffsRef.current = {}
        setBluffedPlayers([])
        bluffedPlayersRef.current = []
        setChallenges({})
        challengesRef.current = {}
        setGuesses({})
        guessesRef.current = {}
        setScores({})
        scoresRef.current = {}
        setRoundDeltas({})
        setChallengeResults([])
        handledPhaseKeyRef.current = null
        setHeldPlayers([])
        heldPlayersRef.current = []
        clearAll()
        if (selfId !== 'host' && from === 'host') setScreen('stage')
        return
      }

      if (event.type === 'PHASE_CHANGE') {
        if (selfIdRef.current === 'host' && from !== 'host') return

        // Spectator branch — also promote to gameStarted if a real phase
        // arrives and we somehow missed GAME_START.
        if (isSpectatorRef.current || screen === 'spectator') {
          if (event.phase === 'lobby') {
            setGameStarted(false)
            gameStartedRef.current = false
            setSpectatorJoined(false)
            return
          }
          if (event.phase === 'game-over') {
            phaseDeadlineAtRef.current = null
            setPhaseDeadlineAt(null)
            if (!gameStartedRef.current) {
              setGameStarted(true)
              gameStartedRef.current = true
              setSpectatorJoined(true)
            }
            return
          }
          if (!gameStartedRef.current) {
            setGameStarted(true)
            gameStartedRef.current = true
            setSpectatorJoined(true)
          }
          const sPhase = event.phase as Phase
          const sDeadline = event.deadlineAt ?? Date.now() + PHASE_DURATION_MS[sPhase]
          setPreviewPhase(sPhase)
          previewPhaseRef.current = sPhase
          setPhaseDeadlineAt(sDeadline)
          phaseDeadlineAtRef.current = sDeadline
          if (event.roundLabel) {
            const sm = event.roundLabel.match(/^R(\d+)\//)
            const sRn = sm ? parseInt(sm[1], 5) : roundNumberRef.current
            setRoundNumber(sRn)
            roundNumberRef.current = sRn
          }
          return
        }

        if (event.phase === 'lobby') {
          resetGameStateLocally()
          setScreen('lobby')
          return
        }

        if (event.phase === 'game-over') {
          phaseDeadlineAtRef.current = null
          setPhaseDeadlineAt(null)
          setScreen('game-over')
          return
        }

        const phase = event.phase as Phase
        const m = event.roundLabel.match(/^R(\d+)\//)
        const rn = m ? parseInt(m[1], 5) : roundNumberRef.current
        const deadlineAt = event.deadlineAt ?? Date.now() + PHASE_DURATION_MS[phase]
        roundNumberRef.current = rn
        previewPhaseRef.current = phase
        phaseDeadlineAtRef.current = deadlineAt
        setRoundNumber(rn)
        setPreviewPhase(phase)
        setPhaseDeadlineAt(deadlineAt)
        if (selfId !== 'host' && from === 'host') setScreen('stage')
        return
      }

      // ---- Reaction ----
      // Dedup with a stable id so the sender's own optimistic add doesn't
      // double-render when the host echoes it back. Host rebroadcast is
      // authoritative, so all players accept it.
      if (event.type === 'REACTION') {
        const reactionId =
          (event as { id?: string }).id ??
          `${event.fromId}-${event.emoji}-${Date.now()}`

        if (selfIdRef.current === 'host') {
          const mappedId = peerToPlayerRef.current[from]
          const senderIsHost = from === 'host'
          const senderIsPlayer = playersRef.current.some((p) => p.id === event.fromId)
          const senderIsSpectator = spectatorsRef.current.some(
            (p) => p.id === event.fromId
          )
          if (!senderIsHost && mappedId !== event.fromId) return
          if (senderIsPlayer && activePeerByPlayerRef.current[event.fromId] !== from) return
          if (!senderIsPlayer && !senderIsSpectator) return

          send({ ...event, id: reactionId } as GameEvent)
        } else if (from !== 'host') {
          return
        }

        if (sentReactionIdsRef.current.has(reactionId)) {
          sentReactionIdsRef.current.delete(reactionId)
          return
        }

        const senderName =
          playersRef.current.find((p) => p.id === event.fromId)?.name ??
          spectatorsRef.current.find((p) => p.id === event.fromId)?.name ??
          '???'
        setReactions((prev) => [
          ...prev.slice(-19),
          { id: reactionId, emoji: event.emoji, fromName: senderName },
        ])
        return
      }

      if (event.type === 'SPECTATOR_JOIN') {
        const s = event.spectator
        if (selfIdRef.current === 'host') {
          if (s.role !== 'spectator') return
          if (!/^spec-[a-z0-9]+$/i.test(s.id)) return
          if (playersRef.current.some((p) => p.id === s.id)) return
          if (pendingPeerByPlayerRef.current[s.id]) return

          const existingPeerPlayer = peerToPlayerRef.current[from]
          if (existingPeerPlayer && existingPeerPlayer !== s.id) return

          if (existingPeerPlayer !== s.id) {
            peerToPlayerRef.current[from] = s.id
            // Register the spectator peer with the network layer so that
            // subsequent host broadcasts (GAME_START, PHASE_CHANGE,
            // ROUND_COMPLETE, …) actually reach this peer.
            network.setActivePlayerPeer(s.id, from)
          }
          // Fall through on duplicate joins too — the client retries, and
          // each retry should get a fresh GAME_STATE_SYNC back.
        }
        const nextSpectators = spectatorsRef.current.some((x) => x.id === s.id)
          ? spectatorsRef.current
          : [...spectatorsRef.current, s]
        spectatorsRef.current = nextSpectators
        setSpectators(nextSpectators)
        if (selfId === 'host') {
          send({
            type: 'GAME_STATE_SYNC',
            gameStarted: gameStartedRef.current,
            phase: previewPhaseRef.current,
            deadlineAt: phaseDeadlineAtRef.current ?? undefined,
            roundLabel: `R${roundNumberRef.current}/5`,
            lockedPlayers: lockedPlayersRef.current,
            bluffedPlayers: bluffedPlayersRef.current,
            bluffs: bluffsRef.current,
            players: playersRef.current,
            challenges: challengesRef.current,
            roundNumber: roundNumberRef.current,
            scores: scoresRef.current,
            spectators: nextSpectators,
          })
        }
        return
      }

      if (event.type === 'SPECTATOR_LEFT') {
        if (selfIdRef.current === 'host' && from !== 'host' && peerToPlayerRef.current[from] !== event.spectatorId) return
        if (selfIdRef.current === 'host' && from !== 'host') delete peerToPlayerRef.current[from]
        const nextSpectators = spectatorsRef.current.filter((s) => s.id !== event.spectatorId)
        spectatorsRef.current = nextSpectators
        setSpectators(nextSpectators)
        if (selfIdRef.current === 'host') {
          send({
            type: 'GAME_STATE_SYNC',
            gameStarted: gameStartedRef.current,
            phase: previewPhaseRef.current,
            deadlineAt: phaseDeadlineAtRef.current ?? undefined,
            roundLabel: `R${roundNumberRef.current}/5`,
            lockedPlayers: lockedPlayersRef.current,
            bluffedPlayers: bluffedPlayersRef.current,
            bluffs: bluffsRef.current,
            players: playersRef.current,
            challenges: challengesRef.current,
            roundNumber: roundNumberRef.current,
            scores: scoresRef.current,
            spectators: nextSpectators,
          })
        }
        return
      }

      // ---- Shared events: both players and spectators handle these ----

      if (event.type === 'ROUND_COMPLETE') {
        if (from !== 'host') return
        setScores(event.scores)
        scoresRef.current = event.scores
        setRoundDeltas(event.deltas)
        setChallengeResults(event.challengeResults)
        return
      }

      if (event.type === 'GAME_STATE_SYNC') {
        setGameStarted(event.gameStarted)
        gameStartedRef.current = event.gameStarted
        setPreviewPhase(event.phase as Phase)
        previewPhaseRef.current = event.phase as Phase
        setPhaseDeadlineAt(event.deadlineAt ?? null)
        phaseDeadlineAtRef.current = event.deadlineAt ?? null
        setLockedPlayers(event.lockedPlayers)
        lockedPlayersRef.current = event.lockedPlayers
        setBluffedPlayers(event.bluffedPlayers)
        bluffedPlayersRef.current = event.bluffedPlayers
        setBluffs(event.bluffs)
        bluffsRef.current = event.bluffs
        setChallenges(event.challenges ?? {})
        challengesRef.current = event.challenges ?? {}
        setRoundNumber(event.roundNumber ?? 1)
        roundNumberRef.current = event.roundNumber ?? 1
        setScores(event.scores ?? {})
        scoresRef.current = event.scores ?? {}
        if (Array.isArray(event.spectators)) {
          setSpectators(event.spectators)
          spectatorsRef.current = event.spectators
        }

        if (Array.isArray(event.players) && event.players.length > 0) {
          setPlayers(event.players)
          playersRef.current = event.players
        }

        if (isSpectatorRef.current) {
          setSpectatorJoined(true)
          return
        }

        if (event.gameStarted) {
          clearAll()
          setScreen('stage')
          setJoinedMidRound(true)
        }
        return
      }

      if (event.type === 'ROSTER_SYNC') {
        playersRef.current = event.players
        heldPlayersRef.current = event.heldPlayers ?? []
        setPlayers(event.players)
        setHeldPlayers(event.heldPlayers ?? [])
        return
      }

      if (event.type === 'ROUND_SNAPSHOT') {
        setPlayers(event.players)
        playersRef.current = event.players
        setHeldPlayers(event.heldPlayers ?? [])
        heldPlayersRef.current = event.heldPlayers ?? []
        setSpectators(event.spectators ?? [])
        spectatorsRef.current = event.spectators ?? []
        setGameStarted(event.gameStarted)
        gameStartedRef.current = event.gameStarted
        setPhaseDeadlineAt(event.deadlineAt ?? null)
        phaseDeadlineAtRef.current = event.deadlineAt ?? null
        setRoundNumber(event.roundNumber ?? 1)
        roundNumberRef.current = event.roundNumber ?? 1
        setPreviewPhase(event.phase as Phase)
        previewPhaseRef.current = event.phase as Phase
        setLockedPlayers(event.lockedPlayers ?? [])
        lockedPlayersRef.current = event.lockedPlayers ?? []
        setBluffedPlayers(event.bluffedPlayers ?? [])
        bluffedPlayersRef.current = event.bluffedPlayers ?? []
        setBluffs(event.bluffs ?? {})
        bluffsRef.current = event.bluffs ?? {}
        setChallenges(event.challenges ?? {})
        challengesRef.current = event.challenges ?? {}
        const snapshotCodes = event.phase === 'reveal' ? (event.codesByPlayer ?? {}) : {}
        setCodesByPlayer(snapshotCodes)
        codesByPlayerRef.current = snapshotCodes
        setScores(event.scores ?? {})
        scoresRef.current = event.scores ?? {}

        if (isSpectatorRef.current) {
          return
        }

        if (event.gameStarted && screen !== 'reason' && screen !== 'waiting') {
          clearAll()
          setScreen('stage')
        }
        return
      }

      // ---- Everything below this line is for players only ----
      if (isSpectatorRef.current) return

      if (event.type === 'LOCK_SUBMITTED') {
        if (selfIdRef.current !== 'host' || previewPhaseRef.current !== 'lock') return
        const who = event.playerId
        const mappedId = peerToPlayerRef.current[from]
        if (mappedId !== who || activePeerByPlayerRef.current[who] !== from || !playersRef.current.some((p) => p.id === who)) return
        if (!/^[1-9]{3}$/.test(event.code)) return
        const previousCode = codesByPlayerRef.current[who]
        if (lockedPlayersRef.current.includes(who) && previousCode && previousCode !== event.code) return
        const nextCodes = { ...codesByPlayerRef.current, [who]: event.code }
        codesByPlayerRef.current = nextCodes
        setCodesByPlayer(nextCodes)
        const locked = lockedPlayersRef.current.includes(who)
          ? lockedPlayersRef.current
          : [...lockedPlayersRef.current, who]
        lockedPlayersRef.current = locked
        setLockedPlayers(locked)
        send({ type: 'LOCK_STATUS', playerId: who })
        return
      }

      if (event.type === 'LOCK_CODE_ASSIGNED') {
        if (from !== 'host' || event.playerId !== myPlayerIdRef.current || !/^[1-9]{3}$/.test(event.code)) return
        setMyCode(event.code)
        return
      }

      if (event.type === 'LOCK_STATUS') {
        if (from !== 'host') return
        const nextLocked = lockedPlayersRef.current.includes(event.playerId)
          ? lockedPlayersRef.current
          : [...lockedPlayersRef.current, event.playerId]
        lockedPlayersRef.current = nextLocked
        setLockedPlayers(nextLocked)
        return
      }

      if (event.type === 'CODES_REVEALED') {
        if (from !== 'host') return
        codesByPlayerRef.current = event.codesByPlayer
        setCodesByPlayer(event.codesByPlayer)
        return
      }

      if (event.type === 'BLUFF_SUBMITTED') {
        if (selfIdRef.current === 'host') {
          if (previewPhaseRef.current !== 'bluff') return
          const mappedId = peerToPlayerRef.current[from]
          if (from !== 'host' && (mappedId !== event.playerId || activePeerByPlayerRef.current[event.playerId] !== from)) return
          if (!playersRef.current.some((p) => p.id === event.playerId)) return
          if (bluffedPlayersRef.current.includes(event.playerId)) return
          send({ ...event, text: event.text.slice(0, 40) })
        } else if (from !== 'host') {
          return
        }
        const who = event.playerId
        if (bluffedPlayersRef.current.includes(who)) return
        const nextBluffs = { ...bluffsRef.current, [who]: event.text.slice(0, 40) }
        bluffsRef.current = nextBluffs
        setBluffs(nextBluffs)
        const bluffed = bluffedPlayersRef.current.includes(who)
          ? bluffedPlayersRef.current
          : [...bluffedPlayersRef.current, who]
        bluffedPlayersRef.current = bluffed
        setBluffedPlayers(bluffed)
        return
      }

      if (event.type === 'CHALLENGE_SUBMITTED') {
        if (selfIdRef.current === 'host') {
          if (previewPhaseRef.current !== 'challenge') return
          const mappedId = peerToPlayerRef.current[from]
          if (from !== 'host' && (mappedId !== event.challengerId || activePeerByPlayerRef.current[event.challengerId] !== from)) return
          if (event.challengerId === event.targetId) return
          if (!playersRef.current.some((p) => p.id === event.challengerId) || !playersRef.current.some((p) => p.id === event.targetId)) return
          if (Object.prototype.hasOwnProperty.call(challengesRef.current, event.challengerId)) return
          send(event)
        } else if (from !== 'host') {
          return
        }
        if (Object.prototype.hasOwnProperty.call(challengesRef.current, event.challengerId)) return
        const nextChallenges = { ...challengesRef.current, [event.challengerId]: event.targetId }
        challengesRef.current = nextChallenges
        setChallenges(nextChallenges)
        return
      }

      if (event.type === 'GUESS_SUBMITTED') {
        if (selfIdRef.current !== 'host' || previewPhaseRef.current !== 'guess') return
        const mappedId = peerToPlayerRef.current[from]
        if (from !== 'host' && (mappedId !== event.guesserId || activePeerByPlayerRef.current[event.guesserId] !== from)) return
        if (!event.guessId || !/^[1-9]{3}$/.test(event.code)) return
        if (event.guesserId === event.targetId) return
        if (!playersRef.current.some((p) => p.id === event.guesserId) || !playersRef.current.some((p) => p.id === event.targetId)) return
        const list = guessesRef.current[event.guesserId] ?? []
        if (list.some((g) => g.guessId === event.guessId) || list.length >= 3) return
        const secret = codesByPlayerRef.current[event.targetId]
        if (!secret) return
        const result = scoreGuess(event.code, secret)
        const resolved = {
          guessId: event.guessId,
          guesserId: event.guesserId,
          targetId: event.targetId,
          code: event.code,
          result,
        }
        const targetName = playersRef.current.find((p) => p.id === event.targetId)?.name ?? '???'
        const nextList = [...list, { guessId: event.guessId, targetId: event.targetId, targetName, code: event.code, result }]
        guessesRef.current = { ...guessesRef.current, [event.guesserId]: nextList }
        setGuesses(guessesRef.current)
        send({ type: 'GUESS_RESOLVED', ...resolved })
        return
      }

      if (event.type === 'GUESS_RESOLVED') {
        if (from !== 'host') return
        const targetName = playersRef.current.find((p) => p.id === event.targetId)?.name ?? '???'
        const list = guessesRef.current[event.guesserId] ?? []
        const replacement: MyGuess = { guessId: event.guessId, targetId: event.targetId, targetName, code: event.code, result: event.result }
        const index = list.findIndex((g) => g.guessId === event.guessId)
        const nextList = index >= 0 ? list.map((g, i) => i === index ? replacement : g) : [...list, replacement]
        const next = { ...guessesRef.current, [event.guesserId]: nextList }
        guessesRef.current = next
        setGuesses(next)
        if (event.guesserId === myPlayerIdRef.current) {
          if (event.result.correctPosition === 3) play('correct')
          else if (event.result.points > 0) play('select')
          else play('wrong')
        }
        return
      }

      if (event.type === 'PEEK_SHARED') {
        if (selfIdRef.current === 'host') {
          const mappedId = peerToPlayerRef.current[from]
          if (from !== 'host' && (mappedId !== event.from || activePeerByPlayerRef.current[event.from] !== from)) return
          if (event.to === 'host') {
            const sender = playersRef.current.find((p) => p.id === event.from)
            setMyPeek({ fromPlayerId: event.from, fromPlayerName: sender?.name ?? '???', digitIndex: event.digitIndex, digit: event.digit })
          } else {
            sendToPlayer(event.to, event)
          }
          return
        }
        if (from !== 'host' || event.to !== myPlayerIdRef.current) return
        const sender = playersRef.current.find((p) => p.id === event.from)
        setMyPeek({
          fromPlayerId: event.from,
          fromPlayerName: sender?.name ?? '???',
          digitIndex: event.digitIndex,
          digit: event.digit,
        })
        return
      }

      if (event.type === 'JOIN_APPROVED') {
        if (event.playerId !== myPlayerIdRef.current) return
        clearAll()
        setJoinedMidRound(true)
        setScreen('stage')
        return
      }

      if (event.type === 'JOIN_REJECTED') {
        if (event.playerId !== myPlayerIdRef.current) return
        alert('The host declined your request to join.')
        clearSession()
        void leaveRoom()
        setScreen('landing')
        return
      }

      if (event.type === 'REASON_UPDATED') {
        setPendingPlayers((prev) =>
          prev.map((p) =>
            p.id === event.playerId ? { ...p, rejoinReason: event.reason } : p
          )
        )
        return
      }

      if (event.type === 'HELLO' || event.type === 'PLAYER_JOINED') {
        if (event.type === 'PLAYER_JOINED' && selfIdRef.current === 'host' && from !== 'host') return
        const incoming = event.player
        const id = incoming.id || from

        const mine = myPlayerIdRef.current
        if (id === mine) return
        if (from === selfIdRef.current) return

        const isNew = !playersRef.current.some((p) => p.id === id)

        if (event.type === 'HELLO' && selfId === 'host') {
          const isReturning = event.isReturning === true
          if (incoming.role !== 'player' || !/^guest-[a-z0-9]+-[a-z0-9]+$/i.test(id)) return
          const mappedId = peerToPlayerRef.current[from]
          if (mappedId && mappedId !== id) return
          if (mappedId && /^spec-/i.test(mappedId)) return

          const rosterAlreadyHasId = playersRef.current.some((p) => p.id === id)

          if (isReturning) {
            if (activePeerByPlayerRef.current[id] === from) return

            if (rosterAlreadyHasId) {
              const cleanedRoster = playersRef.current.filter((p) => p.id !== id)
              playersRef.current = cleanedRoster
              setPlayers(cleanedRoster)
              syncRoster(cleanedRoster, heldPlayersRef.current)
              const nextLocked = lockedPlayersRef.current.filter((x) => x !== id)
              lockedPlayersRef.current = nextLocked
              setLockedPlayers(nextLocked)
              const nextBluffed = bluffedPlayersRef.current.filter((x) => x !== id)
              bluffedPlayersRef.current = nextBluffed
              setBluffedPlayers(nextBluffed)
              const nextCodes = { ...codesByPlayerRef.current }
              delete nextCodes[id]
              codesByPlayerRef.current = nextCodes
              setCodesByPlayer(nextCodes)
              const nextBluffs = { ...bluffsRef.current }
              delete nextBluffs[id]
              bluffsRef.current = nextBluffs
              setBluffs(nextBluffs)
            }

            pendingPeerByPlayerRef.current[id] = from
            setPendingPlayers((prev) => {
              if (prev.some((p) => p.id === id)) return prev
              return [...prev, { ...incoming, id, status: 'pending' }]
            })
            return
          }

          if (rosterAlreadyHasId) {
            if (activePeerByPlayerRef.current[id] === from) return
            return
          }

          peerToPlayerRef.current[from] = id
          activePeerByPlayerRef.current[id] = from
          network.setActivePlayerPeer(id, from)
          const active: Player = { ...incoming, id, status: 'active' }
          const roster = [...playersRef.current, active]

          const held = gameStartedRef.current
            ? [...heldPlayersRef.current, id]
            : heldPlayersRef.current

          setPlayers(roster)
          playersRef.current = roster
          setHeldPlayers(held)
          heldPlayersRef.current = held

          syncRoster(roster, held)
          send(buildSnapshot(roster, held))
          return
        }

        if (event.type === 'HELLO' && !event.isReturning) {
          setPlayers((prev) => {
            if (prev.some((p) => p.id === id)) return prev
            return [...prev, { ...incoming, id, status: 'active' }]
          })
          if (isNew && mine && selfName) {
            send({
              type: 'PLAYER_JOINED',
              player: {
                id: mine,
                name: selfName,
                role: 'player',
                isHost: mine === 'host',
                score: 0,
                joinedAt: mine === 'host' ? 1 : 2,
                playerToken: getOrCreateToken(),
                status: 'active',
              },
            })
          }
        }

        if (event.type === 'PLAYER_JOINED') {
          setPlayers((prev) => {
            if (prev.some((p) => p.id === id)) return prev
            return [...prev, { ...incoming, id, status: 'active' }]
          })
        }
      }

      if (event.type === 'PLAYER_LEFT') {
        if (selfIdRef.current === 'host' && from !== 'host') {
          const mappedId = peerToPlayerRef.current[from]
          if (mappedId !== event.playerId || activePeerByPlayerRef.current[event.playerId] !== from) return
          delete peerToPlayerRef.current[from]
          delete activePeerByPlayerRef.current[event.playerId]
        }
        const departed = playersRef.current.find((p) => p.id === event.playerId)
        if (departed) setConnectionNotice(`${departed.name} left the room.`)
        const roster = playersRef.current.filter((p) => p.id !== event.playerId)
        const held = heldPlayersRef.current.filter((x) => x !== event.playerId)
        playersRef.current = roster
        heldPlayersRef.current = held
        setPlayers(roster)
        setHeldPlayers(held)
        setPendingPlayers((prev) => prev.filter((p) => p.id !== event.playerId))
        const nextLocked = lockedPlayersRef.current.filter((id) => id !== event.playerId)
        lockedPlayersRef.current = nextLocked
        setLockedPlayers(nextLocked)
        const nextBluffed = bluffedPlayersRef.current.filter((id) => id !== event.playerId)
        bluffedPlayersRef.current = nextBluffed
        setBluffedPlayers(nextBluffed)
        const nextCodes = { ...codesByPlayerRef.current }; delete nextCodes[event.playerId]
        codesByPlayerRef.current = nextCodes; setCodesByPlayer(nextCodes)
        const nextBluffs = { ...bluffsRef.current }; delete nextBluffs[event.playerId]
        bluffsRef.current = nextBluffs; setBluffs(nextBluffs)
        const nextChallenges = { ...challengesRef.current }
        delete nextChallenges[event.playerId]
        for (const [challengerId, targetId] of Object.entries(nextChallenges)) {
          if (targetId === event.playerId) delete nextChallenges[challengerId]
        }
        challengesRef.current = nextChallenges; setChallenges(nextChallenges)
        const nextGuesses = { ...guessesRef.current }
        delete nextGuesses[event.playerId]
        for (const [guesserId, list] of Object.entries(nextGuesses)) {
          nextGuesses[guesserId] = list.filter((guess) => guess.targetId !== event.playerId)
        }
        guessesRef.current = nextGuesses; setGuesses(nextGuesses)
        if (selfIdRef.current === 'host') {
          if (from !== 'host') send({ type: 'PLAYER_LEFT', playerId: event.playerId, reason: event.reason })
          syncRoster(roster, held)
        }
        return
      }
    } finally {
      clearLastEvent()
    }
  }, [lastEvent, selfId, selfName, send, sendToPlayer, clearAll, clearLastEvent, play, screen])

  // Someone's connection dropped — remove them, then resync everyone.
  useEffect(() => {
    const handler = (peerId: string) => {
      if (selfIdRef.current !== 'host') {
        if (peerId === 'host') setConnectionNotice('Host connection lost. The current game may pause.')
        return
      }

      const pendingEntry = Object.entries(pendingPeerByPlayerRef.current).find(([, id]) => id === peerId)
      if (pendingEntry) {
        const [pendingPlayerId] = pendingEntry
        delete pendingPeerByPlayerRef.current[pendingPlayerId]
        setPendingPlayers((prev) => prev.filter((p) => p.id !== pendingPlayerId))
        return
      }

      const playerId = peerToPlayerRef.current[peerId]
      if (!playerId) return
      const departed = playersRef.current.find((p) => p.id === playerId)
      if (departed && activePeerByPlayerRef.current[playerId] !== peerId) {
        delete peerToPlayerRef.current[peerId]
        return
      }
      if (!departed) {
        const nextSpectators = spectatorsRef.current.filter((s) => s.id !== playerId)
        if (nextSpectators.length !== spectatorsRef.current.length) {
          spectatorsRef.current = nextSpectators
          setSpectators(nextSpectators)
          send({
            type: 'GAME_STATE_SYNC',
            gameStarted: gameStartedRef.current,
            phase: previewPhaseRef.current,
            deadlineAt: phaseDeadlineAtRef.current ?? undefined,
            roundLabel: `R${roundNumberRef.current}/5`,
            lockedPlayers: lockedPlayersRef.current,
            bluffedPlayers: bluffedPlayersRef.current,
            bluffs: bluffsRef.current,
            players: playersRef.current,
            challenges: challengesRef.current,
            roundNumber: roundNumberRef.current,
            scores: scoresRef.current,
            spectators: nextSpectators,
          })
        }
        delete peerToPlayerRef.current[peerId]
        return
      }
      setConnectionNotice(`${departed.name} disconnected.`)
      delete peerToPlayerRef.current[peerId]
      delete activePeerByPlayerRef.current[playerId]

      const roster = playersRef.current.filter((p) => p.id !== playerId)
      const held = heldPlayersRef.current.filter((x) => x !== playerId)

      playersRef.current = roster
      heldPlayersRef.current = held
      setPlayers(roster)
      setHeldPlayers(held)

      setPendingPlayers((prev) => prev.filter((p) => p.id !== playerId))
      setSpectators((prev) => prev.filter((p) => p.id !== playerId))
      const nextLocked = lockedPlayersRef.current.filter((x) => x !== playerId)
      lockedPlayersRef.current = nextLocked
      setLockedPlayers(nextLocked)
      const nextBluffed = bluffedPlayersRef.current.filter((x) => x !== playerId)
      bluffedPlayersRef.current = nextBluffed
      setBluffedPlayers(nextBluffed)
      const nextCodes = { ...codesByPlayerRef.current }; delete nextCodes[playerId]
      codesByPlayerRef.current = nextCodes; setCodesByPlayer(nextCodes)
      const nextBluffs = { ...bluffsRef.current }; delete nextBluffs[playerId]
      bluffsRef.current = nextBluffs; setBluffs(nextBluffs)
      const nextChallenges = { ...challengesRef.current }
      delete nextChallenges[playerId]
      for (const [challengerId, targetId] of Object.entries(nextChallenges)) {
        if (targetId === playerId) delete nextChallenges[challengerId]
      }
      challengesRef.current = nextChallenges; setChallenges(nextChallenges)
      const nextGuesses = { ...guessesRef.current }
      delete nextGuesses[playerId]
      for (const [guesserId, list] of Object.entries(nextGuesses)) {
        nextGuesses[guesserId] = list.filter((guess) => guess.targetId !== playerId)
      }
      guessesRef.current = nextGuesses; setGuesses(nextGuesses)

      send({ type: 'PLAYER_LEFT', playerId })
      syncRoster(roster, held)
    }

    network.onPlayerLeave(handler)
    return () => network.offPlayerLeave(handler)
  }, [send])

  // Auto-advance Lock → Peek
  useEffect(() => {
    if (previewPhase !== 'lock') return
    const activeCount = players.filter((p) => !heldPlayers.includes(p.id)).length
    if (activeCount === 0) return
    if (lockedPlayers.length < activeCount) return
    if (selfId !== 'host') return

    const timer = setTimeout(() => {
      beginPhase('peek', roundNumberRef.current)
    }, 500)

    return () => clearTimeout(timer)
  }, [previewPhase, lockedPlayers, players, heldPlayers, selfId, send, roundNumber])

  // Auto-advance Bluff → Challenge
  useEffect(() => {
    if (previewPhase !== 'bluff') return
    const activeCount = players.filter((p) => !heldPlayers.includes(p.id)).length
    if (activeCount === 0) return
    if (bluffedPlayers.length < activeCount) return
    if (selfId !== 'host') return

    const timer = setTimeout(() => {
      beginPhase('challenge', roundNumberRef.current)
    }, 500)

    return () => clearTimeout(timer)
  }, [previewPhase, bluffedPlayers, players, heldPlayers, selfId, send, roundNumber])

  // Peek round-robin
  useEffect(() => {
    if (previewPhase !== 'peek') return
    if (peekSentRef.current) return
    if (!myCode) return
    if (!myPlayerId) return
    if (players.length < 2) return

    const sorted = [...players]
      .filter((p) => !heldPlayers.includes(p.id))
      .sort((a, b) => a.id.localeCompare(b.id))
    if (sorted.length < 2) return
    const myIndex = sorted.findIndex((p) => p.id === myPlayerId)
    if (myIndex === -1) return

    const nextIndex = (myIndex + 1) % sorted.length
    const target = sorted[nextIndex]
    if (!target) return

    const digitIndex = Math.floor(Math.random() * 3)
    const digit = myCode[digitIndex]

    const peekEvent: GameEvent = {
      type: 'PEEK_SHARED',
      from: myPlayerId,
      to: target.id,
      digitIndex,
      digit,
    }
    if (selfId === 'host') sendToPlayer(target.id, peekEvent)
    else send(peekEvent)

    peekSentRef.current = true
  }, [previewPhase, myCode, myPlayerId, players, heldPlayers, selfId, send, sendToPlayer])

  useEffect(() => {
    if (previewPhase !== 'peek') {
      peekSentRef.current = false
    }
  }, [previewPhase])

  // Reset round state on lock entry
  useEffect(() => {
    if (previewPhase !== 'lock') return
    setLockedPlayers([])
    setCodesByPlayer({})
    setMyCode(null)
    setMyPeek(null)
    setBluffs({})
    setBluffedPlayers([])
    setChallenges({})
    setGuesses({})
    setRoundDeltas({})
    setChallengeResults([])
  }, [previewPhase, roundNumber])

  // Re-broadcast lock on stage entry
  useEffect(() => {
    if (screen !== 'stage') return
    if (!myCode) return
    if (!myPlayerId) return

    const timer = setTimeout(() => {
      if (selfId === 'host') send({ type: 'LOCK_STATUS', playerId: myPlayerId })
      else send({ type: 'LOCK_SUBMITTED', playerId: myPlayerId, code: myCode })
    }, 800)

    return () => clearTimeout(timer)
  }, [screen, myCode, myPlayerId, selfId, send])

  // Narrate + shake on game over
  useEffect(() => {
    if (screen !== 'game-over') return
    const sorted = [...players].sort(
      (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
    )
    const winner = sorted[0]
    if (!winner) return
    play('fanfare')
    triggerShake('heavy')
    const t = setTimeout(() => {
      speak(
        `${winner.name} wins the game with ${scores[winner.id] ?? 0} points`
      )
    }, 400)
    return () => clearTimeout(t)
  }, [screen, players, scores, play, speak])

  function syncRoster(roster: Player[], held: string[]) {
    if (selfIdRef.current !== 'host') return
    send({ type: 'ROSTER_SYNC', players: roster, heldPlayers: held })
  }

  function buildSnapshot(roster: Player[], held: string[]): GameEvent {
    return {
      type: 'ROUND_SNAPSHOT',
      gameStarted: gameStartedRef.current,
      deadlineAt: phaseDeadlineAtRef.current ?? undefined,
      phase: previewPhaseRef.current,
      roundLabel: `R${roundNumberRef.current}/5`,
      roundNumber: roundNumberRef.current,
      lockedPlayers: lockedPlayersRef.current,
      bluffedPlayers: bluffedPlayersRef.current,
      bluffs: bluffsRef.current,
      challenges: challengesRef.current,
      codesByPlayer: previewPhaseRef.current === 'reveal' ? codesByPlayerRef.current : {},
      players: roster,
      heldPlayers: held,
      scores: scoresRef.current,
      spectators: spectatorsRef.current,
    }
  }

  function approvePending(p: Player) {
    const pendingPeerId = pendingPeerByPlayerRef.current[p.id]
    if (!pendingPeerId) {
      setConnectionNotice(`Unable to approve ${p.name}: their connection is no longer available.`)
      setPendingPlayers((prev) => prev.filter((x) => x.id !== p.id))
      return
    }

    const activePlayer: Player = { ...p, status: 'active' }
    peerToPlayerRef.current[pendingPeerId] = p.id
    activePeerByPlayerRef.current[p.id] = pendingPeerId
    network.setActivePlayerPeer(p.id, pendingPeerId)
    delete pendingPeerByPlayerRef.current[p.id]

    setPendingPlayers((prev) => prev.filter((x) => x.id !== p.id))

    const without = playersRef.current.filter((x) => x.id !== p.id)
    const newRoster = [...without, activePlayer]

    const held = gameStartedRef.current
      ? [...heldPlayersRef.current, p.id]
      : heldPlayersRef.current

    setPlayers(newRoster)
    playersRef.current = newRoster
    setHeldPlayers(held)
    heldPlayersRef.current = held

    syncRoster(newRoster, held)
    network.sendToPeer(pendingPeerId, { type: 'JOIN_APPROVED', playerId: p.id })
    network.sendToPeer(pendingPeerId, buildSnapshot(newRoster, held))
  }

  function rejectPending(p: Player) {
    const pendingPeerId = pendingPeerByPlayerRef.current[p.id]
    setPendingPlayers((prev) => prev.filter((x) => x.id !== p.id))
    if (pendingPeerId) {
      network.sendToPeer(pendingPeerId, { type: 'JOIN_REJECTED', playerId: p.id })
      delete pendingPeerByPlayerRef.current[p.id]
    }
  }

  function sendReaction(emoji: string) {
    const now = Date.now()
    if (now - lastReactionAtRef.current < 400) return
    lastReactionAtRef.current = now
    if (!myPlayerId) return

    const senderName =
      spectatorsRef.current.find((s) => s.id === myPlayerId)?.name ??
      selfNameRef.current ??
      playerName ??
      'Spectator'

    const id = `${myPlayerId}-${now}-${Math.random().toString(36).slice(2, 8)}`
    sentReactionIdsRef.current.add(id)
    if (sentReactionIdsRef.current.size > 100) {
      const first = sentReactionIdsRef.current.values().next().value
      if (first) sentReactionIdsRef.current.delete(first)
    }

    setReactions((prev) => [
      ...prev.slice(-19),
      { id, emoji, fromName: senderName },
    ])
    send({ type: 'REACTION', fromId: myPlayerId, emoji, id } as GameEvent)
  }

  async function handleSpectatorJoin(code: string, name: string) {
    clearSession()
    setPlayers([])
    setPendingPlayers([])
    setLockedPlayers([])
    setCodesByPlayer({})
    setMyCode(null)
    setMyPeek(null)
    setBluffs({})
    setBluffedPlayers([])
    setChallenges({})
    setGuesses({})
    setScores({})
    setRoundDeltas({})
    setChallengeResults([])
    setHeldPlayers([])
    peerToPlayerRef.current = {}
    activePeerByPlayerRef.current = {}
    pendingPeerByPlayerRef.current = {}

    setPlayerName(name)
    await joinRoom(code, name)
    await new Promise((r) => setTimeout(r, 250))

    const spectId = `spec-${Math.random().toString(36).slice(2, 8)}`
    setMyPlayerId(spectId)

    const spectator: Player = {
      id: spectId,
      name,
      role: 'spectator',
      isHost: false,
      score: 0,
      joinedAt: Date.now(),
      playerToken: getOrCreateToken(),
      status: 'active',
    }

    // Show ourselves immediately so the watcher count is never stuck at 0
    // while waiting for the host's GAME_STATE_SYNC response.
    setSpectators([spectator])
    spectatorsRef.current = [spectator]
    setSpectatorJoined(true)

    // Retry the join like players do with HELLO, in case the data channel
    // isn't fully open on the first tick.
    const joinEvent: GameEvent = { type: 'SPECTATOR_JOIN', spectator }
    send(joinEvent)
    setTimeout(() => send(joinEvent), 500)
    setTimeout(() => send(joinEvent), 1500)
  }

  function handleSpectatorLeave() {
    if (myPlayerId) {
      send({ type: 'SPECTATOR_LEFT', spectatorId: myPlayerId })
    }
    void leaveRoom()
    peerToPlayerRef.current = {}
    activePeerByPlayerRef.current = {}
    pendingPeerByPlayerRef.current = {}
    setSpectators([])
    setSpectatorJoined(false)
    setMyPlayerId(null)
    setScreen('landing')
  }

  const RejoinPill = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '8px 14px',
        marginBottom: 16,
        background: 'rgba(0, 245, 212, 0.05)',
        border: '1px solid rgba(0, 245, 212, 0.25)',
        borderRadius: 'var(--radius-md)',
        fontSize: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ color: 'var(--color-text-muted)' }}>
        Your rejoin code{' '}
        <span style={{ fontSize: 10, opacity: 0.7 }}>
          (save to get back in if you drop)
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: 'var(--color-cyan)',
            letterSpacing: '0.05em',
          }}
        >
          {myRejoinCode || '...'}
        </strong>
        <button
          type="button"
          onClick={() => {
            if (myRejoinCode) {
              navigator.clipboard?.writeText(myRejoinCode)
            }
          }}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-cyan)',
            color: 'var(--color-cyan)',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Copy
        </button>
        <button
          type="button"
          onClick={() => {
            const fresh = regenerateToken()
            setMyRejoinCode(fresh)
          }}
          title="Generate a new rejoin code for this tab"
          style={{
            background: 'transparent',
            border: '1px solid var(--color-magenta)',
            color: 'var(--color-magenta)',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          New
        </button>
      </div>
    </div>
  )

  const renderTopBar = (extra?: React.ReactNode) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {extra}
        <MuteButton muted={muted} onToggle={toggleMute} />
      </div>

      <div
        style={{
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          textAlign: 'right',
          lineHeight: 1.5,
          maxWidth: 220,
        }}
      >
        <div>
          Room{' '}
          <strong
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text)',
              letterSpacing: '0.05em',
            }}
          >
            {roomCode ? formatRoomCode(roomCode) : '------'}
          </strong>
        </div>
        <div>
          You{' '}
          <strong style={{ color: 'var(--color-text)' }}>
            {selfName ?? playerName ?? '?'}
          </strong>
        </div>
      </div>
    </div>
  )

  // ---- SCREEN: SPECTATOR ----
  if (screen === 'spectator') {
    return (
      <SpectatorScreen
        joined={spectatorJoined}
        players={players.map((p) => ({
          ...p,
          score: scores[p.id] ?? 0,
        }))}
        spectators={spectators.map((s) => ({
          ...s,
          score: scores[s.id] ?? 0,
        }))}
        phase={previewPhase}
        roundLabel={`R${roundNumber}/5`}
        gameStarted={gameStarted}
        roomCode={roomCode}
        reactions={reactions}
        onExpireReaction={(id) =>
          setReactions((prev) => prev.filter((r) => r.id !== id))
        }
        onSendReaction={sendReaction}
        onJoin={handleSpectatorJoin}
        onLeave={handleSpectatorLeave}
      />
    )
  }

  // ---- SCREEN: JOIN ----
  if (screen === 'join') {
    return (
      <JoinRoomScreen
        onBack={() => setScreen('landing')}
        onJoin={async (code, name, rejoinCode) => {
          try {
            setPlayerName(name)
            setConnectionNotice(null)

            await joinRoom(code, name)
            await new Promise((r) => setTimeout(r, 250))

            const savedSession = loadSession()
            const hasManualCode = rejoinCode.trim().length > 0
            const hasMatchingSession =
              savedSession !== null && savedSession.roomCode === code

            const isReturning = hasManualCode || hasMatchingSession

            const token = hasManualCode
              ? rejoinCode.trim().toUpperCase()
              : savedSession?.playerToken ?? getOrCreateToken()

            const safeName =
              name.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'guest'
            const suffix = Math.random().toString(36).slice(2, 8)
            const myId = isReturning && savedSession
              ? savedSession.myPlayerId
              : `guest-${safeName}-${suffix}`

            setMyPlayerId(myId)

            const selfPlayer: Player = {
              id: myId,
              name,
              role: 'player',
              isHost: false,
              score: 0,
              joinedAt: Date.now(),
              playerToken: token,
              status: isReturning ? 'pending' : 'active',
            }

            const hostPlayer: Player = {
              id: 'host',
              name: 'HOST',
              role: 'player',
              isHost: true,
              score: 0,
              joinedAt: 1,
              playerToken: '',
              status: 'active',
            }

            saveSession({
              roomCode: code,
              myPlayerId: myId,
              playerName: name,
              playerToken: token,
              isHost: false,
            })

            setPendingRoomCode(code)

            if (isReturning) {
              setPlayers([hostPlayer])
              const hello = {
                type: 'HELLO' as const,
                player: selfPlayer,
                isReturning: true,
              }
              send(hello)
              setTimeout(() => send(hello), 500)
              setTimeout(() => send(hello), 1500)
              setScreen('reason')
            } else {
              setPlayers([hostPlayer, selfPlayer])
              const hello = { type: 'HELLO' as const, player: selfPlayer }
              send(hello)
              setTimeout(() => send(hello), 500)
              setTimeout(() => send(hello), 1500)
              setScreen('lobby')
            }
          } catch (err) {
            alert(`Failed to join: ${(err as Error).message}`)
          }
        }}
      />
    )
  }

  // ---- SCREEN: REASON ----
  if (screen === 'reason') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: 24,
          maxWidth: 480,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-cyan)',
            letterSpacing: '0.2em',
            margin: 0,
          }}
        >
          WELCOME BACK
        </h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          The host needs to know why you left before approving your return.
        </p>

        <label className="field" style={{ width: '100%' }}>
          <span className="field-label">Reason for leaving</span>
          <textarea
            className="field-input"
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value.slice(0, 200))}
            placeholder="e.g. lost connection, had to step away…"
            rows={3}
            style={{ resize: 'vertical', minHeight: 80 }}
          />
        </label>

        <Button
          variant="primary"
          disabled={reasonInput.trim().length < 3}
          onClick={() => {
            const reason = reasonInput.trim()
            send({
              type: 'REASON_UPDATED',
              playerId: myPlayerId ?? '',
              reason,
            })
            setScreen('waiting')
          }}
        >
          Submit Reason
        </Button>

        <button
          onClick={async () => {
            clearSession()
            await leaveRoom()
            peerToPlayerRef.current = {}
            activePeerByPlayerRef.current = {}
            pendingPeerByPlayerRef.current = {}
            setPlayers([])
            setPendingPlayers([])
            setMyPlayerId(null)
            setPendingRoomCode(null)
            setScreen('landing')
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  // ---- SCREEN: WAITING ----
  if (screen === 'waiting') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48 }}>🎟</div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-cyan)',
            letterSpacing: '0.2em',
            margin: 0,
          }}
        >
          WAITING FOR HOST
        </h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: 320 }}>
          The host has been notified that you want to rejoin the game.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--color-text-muted)',
          }}
        >
          Room: {pendingRoomCode ? formatRoomCode(pendingRoomCode) : '------'}
        </p>
        <Button
          variant="ghost"
          onClick={async () => {
            clearSession()
            await leaveRoom()
            peerToPlayerRef.current = {}
            activePeerByPlayerRef.current = {}
            pendingPeerByPlayerRef.current = {}
            setPlayers([])
            setPendingPlayers([])
            setMyPlayerId(null)
            setPendingRoomCode(null)
            setScreen('landing')
          }}
        >
          Cancel
        </Button>
      </div>
    )
  }

  // ---- SCREEN: LOBBY ----
  if (screen === 'lobby') {
    const isHost = selfId === 'host'
    return (
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {renderTopBar()}
          {connectionNotice && (
            <div
              role="status"
              style={{
                margin: '0 0 12px',
                padding: 10,
                border: '1px solid var(--color-amber)',
                borderRadius: 8,
                color: 'var(--color-amber)',
              }}
            >
              {connectionNotice}
            </div>
          )}
          {RejoinPill}

          {isHost && pendingPlayers.length > 0 && (
            <div
              style={{
                padding: 16,
                marginBottom: 16,
                background: 'rgba(255, 183, 3, 0.08)',
                border: '1px solid var(--color-amber)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  marginBottom: 12,
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  color: 'var(--color-amber)',
                  textShadow: '0 0 8px var(--color-amber)',
                }}
              >
                ⚠ {pendingPlayers.length} PLAYER
                {pendingPlayers.length === 1 ? '' : 'S'} WAITING TO REJOIN
              </p>
              {pendingPlayers.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '10px 0',
                    borderTop: '1px solid rgba(255, 183, 3, 0.2)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{ fontWeight: 600, color: 'var(--color-text)' }}
                    >
                      {p.name}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        variant="primary"
                        onClick={() => approvePending(p)}
                        style={{ padding: '6px 14px', fontSize: 13 }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => rejectPending(p)}
                        style={{ padding: '6px 14px', fontSize: 13 }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                  {p.rejoinReason && (
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: 12,
                        fontStyle: 'italic',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Reason: "{p.rejoinReason}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <LobbyScreen
          roomCode={roomCode ?? '------'}
          playerName={playerName}
          isHost={isHost}
          players={players}
          gameStarted={gameStarted}
          onStartGame={() => {
            if (selfId !== 'host' || players.length < 2) return

            setLockedPlayers([])
            setCodesByPlayer({})
            setMyCode(null)
            setMyPeek(null)
            setBluffs({})
            setBluffedPlayers([])
            setChallenges({})
            setGuesses({})
            setRoundNumber(1)
            roundNumberRef.current = 1
            setScores({})
            scoresRef.current = {}
            setLockedPlayers([])
            lockedPlayersRef.current = []
            setCodesByPlayer({})
            codesByPlayerRef.current = {}
            setBluffs({})
            bluffsRef.current = {}
            setBluffedPlayers([])
            bluffedPlayersRef.current = []
            setChallenges({})
            challengesRef.current = {}
            setGuesses({})
            guessesRef.current = {}
            setRoundDeltas({})
            setChallengeResults([])
            setPreviewPhase('lock')
            previewPhaseRef.current = 'lock'
            const deadlineAt = Date.now() + PHASE_DURATION_MS.lock
            setPhaseDeadlineAt(deadlineAt)
            phaseDeadlineAtRef.current = deadlineAt
            setGameStarted(true)
            gameStartedRef.current = true
            handledPhaseKeyRef.current = null
            setHeldPlayers([])
            heldPlayersRef.current = []
            clearAll()
            play('select')
            speak('Game starting. Round one')
            send({ type: 'GAME_START', roundLabel: 'R1/5', deadlineAt })
            setScreen('stage')
          }}
          onReturnToStage={() => setScreen('stage')}
          onLeave={async () => {
            if (myPlayerId) {
              send({
                type: 'PLAYER_LEFT',
                playerId: myPlayerId,
                reason: 'left',
              })
            }
            await leaveRoom()
            peerToPlayerRef.current = {}
            activePeerByPlayerRef.current = {}
            pendingPeerByPlayerRef.current = {}
            clearSession()
            setPlayers([])
            setPendingPlayers([])
            setLockedPlayers([])
            setCodesByPlayer({})
            setMyCode(null)
            setMyPeek(null)
            setBluffs({})
            setBluffedPlayers([])
            setChallenges({})
            setGuesses({})
            setRoundNumber(1)
            setScores({})
            setRoundDeltas({})
            setChallengeResults([])
            setGameStarted(false)
            setMyPlayerId(null)
            setJoinedMidRound(false)
            setPendingRoomCode(null)
            clearAll()
            setScreen('landing')
          }}
        />
      </div>
    )
  }

  // ---- SCREEN: GAME OVER ----
  if (screen === 'game-over') {
    const finalPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      score: scores[p.id] ?? 0,
      isYou: p.id === myPlayerId,
    }))

    return (
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {RejoinPill}
          <ScreenShake trigger={shakeTrigger} kind={shakeKind}>
            <GameOverPanel
              players={finalPlayers}
              onPlayAgain={() => {
                resetGameStateLocally()
                setScreen('lobby')

                if (selfIdRef.current === 'host') {
                  send({
                    type: 'PHASE_CHANGE',
                    phase: 'lobby',
                    roundLabel: 'R0/5',
                  })
                  send({
                    type: 'ROSTER_SYNC',
                    players: playersRef.current,
                    heldPlayers: [],
                  })
                }
              }}
              onBackToHome={async () => {
                if (myPlayerId) {
                  send({
                    type: 'PLAYER_LEFT',
                    playerId: myPlayerId,
                    reason: 'left',
                  })
                }
                await leaveRoom()
                peerToPlayerRef.current = {}
                activePeerByPlayerRef.current = {}
                pendingPeerByPlayerRef.current = {}
                clearSession()
                setPlayers([])
                setPendingPlayers([])
                setLockedPlayers([])
                setCodesByPlayer({})
                setMyCode(null)
                setMyPeek(null)
                setBluffs({})
                setBluffedPlayers([])
                setChallenges({})
                setGuesses({})
                setRoundNumber(1)
                setScores({})
                setRoundDeltas({})
                setChallengeResults([])
                setGameStarted(false)
                setMyPlayerId(null)
                setJoinedMidRound(false)
                setPendingRoomCode(null)
                clearAll()
                setScreen('landing')
              }}
            />
          </ScreenShake>
        </div>
      </div>
    )
  }

  // ---- SCREEN: STAGE ----
  if (screen === 'stage') {
    const lockedCount = lockedPlayers.length
    const bluffedCount = bluffedPlayers.length
    const myId = myPlayerId ?? ''
    const isHeld = heldPlayers.includes(myId)
    const totalPlayers = players.filter((p) => !heldPlayers.includes(p.id)).length
    const iHaveLocked = lockedPlayers.includes(myId)
    const iHaveBluffed = bluffedPlayers.includes(myId)
    const myChallenge = challenges[myId] ?? null
    const myGuesses: MyGuess[] = guesses[myId] ?? []
    const isHost = selfId === 'host'
    const isDoubleRound = DOUBLE_ROUNDS.includes(roundNumber)

    let roundWinnerId: string | null = null
    let roundWinnerDelta = 0
    let roundIsTie = false
    if (previewPhase === 'reveal') {
      for (const p of players) {
        const d = roundDeltas[p.id] ?? 0
        if (d > roundWinnerDelta) {
          roundWinnerDelta = d
          roundWinnerId = p.id
          roundIsTie = false
        } else if (d === roundWinnerDelta && d > 0) {
          roundIsTie = true
        }
      }
    }
    const roundWinnerName =
      players.find((p) => p.id === roundWinnerId)?.name ?? null

    const handleLock = (code: string) => {
      if (!myId || iHaveLocked || !/^[1-9]{3}$/.test(code)) return
      setMyCode(code)
      const nextCodes = { ...codesByPlayerRef.current, [myId]: code }
      codesByPlayerRef.current = nextCodes
      setCodesByPlayer(nextCodes)
      const nextLocked = lockedPlayersRef.current.includes(myId)
        ? lockedPlayersRef.current
        : [...lockedPlayersRef.current, myId]
      lockedPlayersRef.current = nextLocked
      setLockedPlayers(nextLocked)
      if (selfId === 'host') send({ type: 'LOCK_STATUS', playerId: myId })
      else send({ type: 'LOCK_SUBMITTED', playerId: myId, code })
      play('select')
    }

    const handlePeekComplete = () => undefined

    const handleBluff = (text: string) => {
      if (!myId || iHaveBluffed) return
      setBluffs((prev) => ({ ...prev, [myId]: text }))
      setBluffedPlayers((prev) => {
        if (prev.includes(myId)) return prev
        return [...prev, myId]
      })
      bluffsRef.current = { ...bluffsRef.current, [myId]: text }
      bluffedPlayersRef.current = bluffedPlayersRef.current.includes(myId)
        ? bluffedPlayersRef.current
        : [...bluffedPlayersRef.current, myId]
      send({ type: 'BLUFF_SUBMITTED', playerId: myId, text })
      play('select')
    }

    const handleChallenge = (targetId: string) => {
      if (!myId || myChallenge) return
      setChallenges((prev) => ({ ...prev, [myId]: targetId }))
      play('challenge')
      challengesRef.current = { ...challengesRef.current, [myId]: targetId }
      send({
        type: 'CHALLENGE_SUBMITTED',
        challengerId: myId,
        targetId,
      })
    }

    const handleGuess = (targetId: string, code: string) => {
      if (!myId || !/^[1-9]{3}$/.test(code) || isHeld) return
      const current = guessesRef.current[myId] ?? []
      if (current.length >= 3) return
      const guessId = `${myId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const targetName = playersRef.current.find((p) => p.id === targetId)?.name ?? '???'

      if (selfId === 'host') {
        const secret = codesByPlayerRef.current[targetId]
        if (!secret) {
          alert("Target's code is not available yet. Try again in a moment.")
          return
        }
        const result = scoreGuess(code, secret)
        const guess: MyGuess = { guessId, targetId, targetName, code, result }
        const next = { ...guessesRef.current, [myId]: [...current, guess] }
        guessesRef.current = next
        setGuesses(next)
        send({ type: 'GUESS_RESOLVED', guessId, guesserId: myId, targetId, code, result })
      } else {
        const pending: MyGuess = {
          guessId,
          targetId,
          targetName,
          code,
          result: { correctPosition: 0, correctDigit: 0, points: 0 },
          pending: true,
        }
        const next = { ...guessesRef.current, [myId]: [...current, pending] }
        guessesRef.current = next
        setGuesses(next)
        send({ type: 'GUESS_SUBMITTED', guessId, guesserId: myId, targetId, code })
      }
    }

    const handleGuessComplete = () => undefined
    const handleChallengeComplete = () => undefined
    const handleRevealComplete = () => undefined

    const challengeCounts: Record<string, number> = {}
    for (const targetId of Object.values(challenges)) {
      challengeCounts[targetId] = (challengeCounts[targetId] ?? 0) + 1
    }

    const rivals = players
      .filter((p) => p.id !== myId && !heldPlayers.includes(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        bluff: bluffs[p.id] ?? null,
        challengeCount: challengeCounts[p.id] ?? 0,
      }))

    const playerCards = players.map((p) => ({
      id: p.id,
      name: p.name,
      code: codesByPlayer[p.id] ?? '???',
      delta: roundDeltas[p.id] ?? 0,
      totalScore: scores[p.id] ?? 0,
    }))

    return (
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <ScreenShake trigger={shakeTrigger} kind={shakeKind}>
          {showIntro && (
            <PhaseIntro
              phaseLabel={PHASE_LABELS[previewPhase] ?? previewPhase}
              roundNumber={roundNumber}
              isDoubleRound={isDoubleRound}
              durationMs={1400}
              onComplete={() => setShowIntro(false)}
            />
          )}

          {previewPhase === 'reveal' && (
            <RoundWinnerCallout
              roundNumber={roundNumber}
              winnerName={roundWinnerName}
              winnerDelta={roundWinnerDelta}
              isYou={roundWinnerId === myId}
              isTie={roundIsTie}
              durationMs={3500}
            />
          )}

          <ReactionLayer
            reactions={reactions}
            onExpire={(id) =>
              setReactions((prev) => prev.filter((r) => r.id !== id))
            }
          />

          <ScorePopContainer
            pops={pops}
            onExpire={(id) =>
              setPops((prev) => prev.filter((p) => p.id !== id))
            }
          />

          {isHost && pendingPlayers.length > 0 && (
            <div
              style={{
                maxWidth: 560,
                margin: '0 auto 20px',
                padding: 16,
                background: 'rgba(255, 183, 3, 0.08)',
                border: '1px solid var(--color-amber)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  marginBottom: 12,
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  color: 'var(--color-amber)',
                  textShadow: '0 0 8px var(--color-amber)',
                }}
              >
                ⚠ {pendingPlayers.length} PLAYER
                {pendingPlayers.length === 1 ? '' : 'S'} WAITING TO REJOIN
              </p>
              {pendingPlayers.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '10px 0',
                    borderTop: '1px solid rgba(255, 183, 3, 0.2)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{ fontWeight: 600, color: 'var(--color-text)' }}
                    >
                      {p.name}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        variant="primary"
                        onClick={() => approvePending(p)}
                        style={{ padding: '6px 14px', fontSize: 13 }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => rejectPending(p)}
                        style={{ padding: '6px 14px', fontSize: 13 }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                  {p.rejoinReason && (
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: 12,
                        fontStyle: 'italic',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Reason: "{p.rejoinReason}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {connectionNotice && (
            <div
              role="status"
              style={{
                maxWidth: 560,
                margin: '0 auto 12px',
                padding: 10,
                border: '1px solid var(--color-amber)',
                borderRadius: 8,
                color: 'var(--color-amber)',
              }}
            >
              {connectionNotice}
            </div>
          )}
          {renderTopBar(
            <button
              onClick={() => setScreen('lobby')}
              style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}
            >
              ← Back to Lobby
            </button>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '8px',
              justifyContent: 'center',
            }}
          >
            {spectators.length > 0 && (
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  padding: '4px 12px',
                  borderRadius: 9999,
                  border: '1px solid var(--color-border)',
                }}
              >
                👁 {spectators.length}{' '}
                {spectators.length === 1 ? 'watcher' : 'watchers'}
              </span>
            )}
          </div>

          {showDevTools && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '24px',
                justifyContent: 'center',
              }}
            >
              {PHASES.map((p) => (
                <button
                  key={p}
                  onClick={() => beginPhase(p, roundNumberRef.current)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background:
                      previewPhase === p
                        ? 'var(--color-cyan)'
                        : 'var(--color-surface)',
                    color:
                      previewPhase === p
                        ? 'var(--color-bg)'
                        : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <Stage
            players={players.map((p) => ({
              id: p.id,
              name: p.name,
              isHost: p.isHost,
              score: scores[p.id] ?? 0,
              joinedAt: p.joinedAt,
              bluff: previewPhase === 'bluff' ? bluffs[p.id] ?? null : null,
            }))}
            phase={previewPhase}
            roundLabel={`R${roundNumber}/5${isDoubleRound ? ' ×2' : ''}`}
            joinBannerName={currentName}
            onJoinBannerDismiss={dismissCurrent}
          />
          {isHeld && previewPhase !== 'reveal' && (
            <div
              style={{
                maxWidth: 480,
                margin: '32px auto 0',
                padding: 24,
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
              }}
            >
              You joined mid-round. You'll play from the next round.
            </div>
          )}

          {previewPhase === 'lock' && !isHeld && (
            <div style={{ maxWidth: 480, margin: '32px auto 0' }}>
              <LockPanel
                locked={iHaveLocked}
                lockedCount={lockedCount}
                totalPlayers={totalPlayers}
                durationMs={10000}
                deadlineAt={phaseDeadlineAt ?? Date.now() + PHASE_DURATION_MS.lock}
                onLock={handleLock}
              />
              {myCode && (
                <p
                  style={{
                    textAlign: 'center',
                    marginTop: 16,
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Your code: {myCode}
                </p>
              )}
            </div>
          )}

          {previewPhase === 'peek' && !isHeld && (
            <div style={{ maxWidth: 480, margin: '32px auto 0' }}>
              {joinedMidRound && !myPeek ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  You joined mid-round — you'll play from the next phase.
                </div>
              ) : (
                <PeekPanel
                  targetName={myPeek?.fromPlayerName ?? null}
                  digitIndex={myPeek?.digitIndex ?? null}
                  digit={myPeek?.digit ?? null}
                  durationMs={5000}
                  deadlineAt={phaseDeadlineAt ?? Date.now() + PHASE_DURATION_MS.peek}
                  onComplete={handlePeekComplete}
                />
              )}
            </div>
          )}

          {previewPhase === 'bluff' && !isHeld && (
            <div style={{ maxWidth: 480, margin: '32px auto 0' }}>
              <BluffPanel
                submitted={iHaveBluffed}
                myBluff={bluffs[myId] ?? null}
                submittedCount={bluffedCount}
                totalPlayers={totalPlayers}
                durationMs={20000}
                deadlineAt={phaseDeadlineAt ?? Date.now() + PHASE_DURATION_MS.bluff}
                onBluff={handleBluff}
              />
            </div>
          )}

          {previewPhase === 'challenge' && !isHeld && (
            <div style={{ maxWidth: 480, margin: '32px auto 0' }}>
              <ChallengePanel
                rivals={rivals}
                myChallenge={myChallenge}
                durationMs={15000}
                deadlineAt={phaseDeadlineAt ?? Date.now() + PHASE_DURATION_MS.challenge}
                onChallenge={handleChallenge}
                onComplete={handleChallengeComplete}
              />
            </div>
          )}

          {previewPhase === 'guess' && !isHeld && (
            <div style={{ maxWidth: 480, margin: '32px auto 0' }}>
              <GuessPanel
                rivals={rivals.map((r) => ({ id: r.id, name: r.name }))}
                myGuesses={myGuesses}
                maxGuesses={3}
                durationMs={45000}
                deadlineAt={phaseDeadlineAt ?? Date.now() + PHASE_DURATION_MS.guess}
                onGuess={handleGuess}
                onComplete={handleGuessComplete}
              />
            </div>
          )}

          {previewPhase === 'reveal' && (
            <div style={{ maxWidth: 600, margin: '32px auto 0' }}>
              <RevealPanel
                roundNumber={roundNumber}
                isDoubleRound={isDoubleRound}
                playerCards={playerCards}
                challengeResults={challengeResults}
                durationMs={10000}
                deadlineAt={phaseDeadlineAt ?? Date.now() + PHASE_DURATION_MS.reveal}
                onComplete={handleRevealComplete}
              />
            </div>
          )}
        </ScreenShake>
      </div>
    )
  }

  // ---- SCREEN: LANDING ----
  return (
    <LandingScreen
      onCreateRoom={async () => {
        try {
          const name = prompt('Your name?')?.trim() || 'HOST'
          setPlayerName(name)
          setConnectionNotice(null)
          peerToPlayerRef.current = {}
          activePeerByPlayerRef.current = {}
          pendingPeerByPlayerRef.current = {}
          await createRoom(name)

          const token = getOrCreateToken()
          setMyPlayerId('host')

          const hostPlayer: Player = {
            id: 'host',
            name,
            role: 'player',
            isHost: true,
            score: 0,
            joinedAt: 1,
            playerToken: token,
            status: 'active',
          }

          setPlayers([hostPlayer])
          setGameStarted(false)
          setPhaseDeadlineAt(null)
          phaseDeadlineAtRef.current = null
          setRoundNumber(1)
          setScores({})
          clearAll()
          send({ type: 'PLAYER_JOINED', player: hostPlayer })
          setScreen('lobby')
        } catch (err) {
          alert(`Failed to create room: ${(err as Error).message}`)
        }
      }}
      onJoinRoom={() => setScreen('join')}
      onWatchGame={() => {
        clearSession()
        peerToPlayerRef.current = {}
        activePeerByPlayerRef.current = {}
        pendingPeerByPlayerRef.current = {}
        setPlayers([])
        setPendingPlayers([])
        setHeldPlayers([])
        setMyPlayerId(null)
        setSpectatorJoined(false)
        setGameStarted(false)
        gameStartedRef.current = false
        setPreviewPhase('lock')
        previewPhaseRef.current = 'lock'
        setPhaseDeadlineAt(null)
        phaseDeadlineAtRef.current = null
        setRoundNumber(1)
        roundNumberRef.current = 1
        setScreen('spectator')
      }}
    />
  )
}

export default App