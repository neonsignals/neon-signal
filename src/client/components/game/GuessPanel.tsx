import { useState } from 'react'
import { usePhaseCountdown } from '@/client/hooks/usePhaseCountdown'
import './GuessPanel.css'
import type { GuessResult } from '@/network/types'

type Rival = {
  id: string
  name: string
}

type MyGuess = {
  targetId: string
  targetName: string
  code: string
  result: GuessResult
  pending?: boolean
}

type GuessPanelProps = {
  rivals: Rival[]
  myGuesses: MyGuess[]
  maxGuesses: number
  durationMs?: number
  deadlineAt?: number
  onGuess: (targetId: string, code: string) => void
  onComplete: () => void
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export function GuessPanel({
  rivals,
  myGuesses,
  maxGuesses,
  durationMs = 45000,
  deadlineAt,
  onGuess,
  onComplete,
}: GuessPanelProps) {
  const [targetId, setTargetId] = useState<string | null>(
    rivals[0]?.id ?? null
  )
  const [digits, setDigits] = useState<string[]>(['', '', ''])
  const secondsLeft = usePhaseCountdown(deadlineAt, durationMs, onComplete)

  const guessesLeft = maxGuesses - myGuesses.length
  const canSubmit =
    targetId !== null &&
    digits.every((d) => d !== '') &&
    guessesLeft > 0

  function pressKey(d: string) {
    if (guessesLeft <= 0) return
    setDigits((prev) => {
      const next = [...prev]
      const empty = next.findIndex((x) => x === '')
      if (empty === -1) next[2] = d
      else next[empty] = d
      return next
    })
  }

  function backspace() {
    setDigits((prev) => {
      const next = [...prev]
      for (let i = 2; i >= 0; i--) {
        if (next[i] !== '') {
          next[i] = ''
          break
        }
      }
      return next
    })
  }

  function submit() {
    if (!canSubmit || !targetId) return
    onGuess(targetId, digits.join(''))
    setDigits(['', '', ''])
  }

  const targetName =
    rivals.find((r) => r.id === targetId)?.name ?? '?'

  return (
    <div className="guess-panel">
      <p className="guess-panel-title">🔢 GUESS PHASE</p>
      <p className="guess-panel-subtitle">
        {secondsLeft}s · {guessesLeft} guess{guessesLeft === 1 ? '' : 'es'} left
      </p>

      {guessesLeft > 0 ? (
        <>
          <p className="guess-panel-label">Target</p>
          <div className="guess-panel-targets">
            {rivals.map((r) => (
              <button
                key={r.id}
                type="button"
                className={
                  'guess-panel-target' +
                  (targetId === r.id ? ' guess-panel-target-active' : '')
                }
                onClick={() => setTargetId(r.id)}
              >
                {r.name}
              </button>
            ))}
          </div>

          <p className="guess-panel-label">Enter 3-digit code for {targetName}</p>

          <div className="guess-panel-digits">
            {digits.map((digit, i) => (
              <div key={i} className="guess-panel-digit">
                {digit || '_'}
              </div>
            ))}
          </div>

          <div className="guess-panel-pad">
            {DIGITS.map((d) => (
              <button
                key={d}
                type="button"
                className="guess-panel-key"
                onClick={() => pressKey(d)}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              className="guess-panel-key guess-panel-key-action"
              onClick={backspace}
            >
              ⌫
            </button>
          </div>

          <button
            type="button"
            className="guess-panel-submit"
            disabled={!canSubmit}
            onClick={submit}
          >
            Submit Guess
          </button>
        </>
      ) : (
        <p className="guess-panel-no-more">No more guesses this round.</p>
      )}

      {myGuesses.length > 0 && (
        <div className="guess-panel-history">
          <p className="guess-panel-history-title">Your guesses</p>
          <ul>
            {myGuesses.map((g, i) => (
              <li key={i} className="guess-panel-history-row">
                <span className="guess-panel-history-target">
                  {g.targetName}
                </span>
                <span className="guess-panel-history-code">{g.code}</span>
                <span className="guess-panel-history-result">
                  {g.result.correctPosition > 0 && (
                    <span className="guess-panel-hit-pos">
                      {g.result.correctPosition}✓
                    </span>
                  )}
                  {g.result.correctDigit > 0 && (
                    <span className="guess-panel-hit-digit">
                      {g.result.correctDigit}~
                    </span>
                  )}
                  {g.result.correctPosition === 0 &&
                    g.result.correctDigit === 0 && (
                      <span className="guess-panel-hit-none">0</span>
                    )}
                </span>
                <span className="guess-panel-history-points">
                  {g.pending ? '...' : `+${g.result.points}`}
                </span>
              </li>
            ))}
          </ul>
          <p className="guess-panel-legend">
            ✓ = right spot · ~ = right digit, wrong spot
          </p>
        </div>
      )}
    </div>
  )
}