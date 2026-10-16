import { useState, useRef } from 'react'
import { usePhaseCountdown } from '@/client/hooks/usePhaseCountdown'
import { Button } from '../Button'
import './LockPanel.css'

type LockPanelProps = {
  locked: boolean
  lockedCount: number
  totalPlayers: number
  durationMs?: number
  deadlineAt?: number
  onLock: (code: string) => void
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

function randomCode(): string {
  return Array.from({ length: 3 }, () => DIGITS[Math.floor(Math.random() * 9)]).join('')
}

export function LockPanel({
  locked,
  lockedCount,
  totalPlayers,
  durationMs = 10000,
  deadlineAt,
  onLock,
}: LockPanelProps) {
  const [digits, setDigits] = useState<string[]>(['', '', ''])
  const digitsRef = useRef(digits)
  const onLockRef = useRef(onLock)
  digitsRef.current = digits
  onLockRef.current = onLock

  const secondsLeft = usePhaseCountdown(
    deadlineAt,
    durationMs,
    () => {
      const currentDigits = digitsRef.current
      const fallback = currentDigits.every((d) => d === '') ? randomCode() : currentDigits.join('')
      onLockRef.current(fallback.length === 3 ? fallback : randomCode())
    },
    !locked
  )


  function handleKeyPress(digit: string) {
    if (locked) return
    // Fill the first empty slot, or replace the last slot if full
    setDigits((prev) => {
      const emptyIndex = prev.findIndex((d) => d === '')
      const next = [...prev]
      if (emptyIndex === -1) {
        next[2] = digit
      } else {
        next[emptyIndex] = digit
      }
      return next
    })
  }

  function handleBackspace() {
    if (locked) return
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

  const canLock = digits.every((d) => d !== '') && !locked

  function handleLock() {
    if (!canLock) return
    onLock(digits.join(''))
  }

  if (locked) {
    return (
      <div className="lock-panel lock-panel-locked">
        <p className="lock-panel-title">🔒 CODE LOCKED</p>
        <p className="lock-panel-subtitle">
          Waiting for others… {lockedCount}/{totalPlayers}
        </p>
      </div>
    )
  }

  return (
    <div className="lock-panel">
      <p className="lock-panel-title">PICK YOUR 3-DIGIT CODE</p>
      <p className="lock-panel-subtitle">
        {secondsLeft}s · Locked: {lockedCount}/{totalPlayers}
      </p>

      <div className="lock-panel-digits">
        {digits.map((digit, i) => (
          <div key={i} className="lock-panel-digit">
            {digit || '_'}
          </div>
        ))}
      </div>

      <div className="lock-panel-pad">
        {DIGITS.map((d) => (
          <button
            key={d}
            type="button"
            className="lock-panel-key"
            onClick={() => handleKeyPress(d)}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          className="lock-panel-key lock-panel-key-action"
          onClick={handleBackspace}
        >
          ⌫
        </button>
      </div>

      <Button
        variant="primary"
        className="lock-panel-lock"
        disabled={!canLock}
        onClick={handleLock}
      >
        Lock It
      </Button>
    </div>
  )
}