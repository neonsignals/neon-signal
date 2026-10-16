import { useState, useRef } from 'react'
import { usePhaseCountdown } from '@/client/hooks/usePhaseCountdown'
import { Button } from '../Button'
import './BluffPanel.css'

type BluffPanelProps = {
  submitted: boolean
  myBluff: string | null
  submittedCount: number
  totalPlayers: number
  durationMs?: number
  deadlineAt?: number
  onBluff: (text: string) => void
}

const MAX_LENGTH = 40

export function BluffPanel({
  submitted,
  myBluff,
  submittedCount,
  totalPlayers,
  durationMs = 20000,
  deadlineAt,
  onBluff,
}: BluffPanelProps) {
  const [text, setText] = useState('')
  const textRef = useRef(text)
  const onBluffRef = useRef(onBluff)
  textRef.current = text
  onBluffRef.current = onBluff
  const secondsLeft = usePhaseCountdown(
    deadlineAt,
    durationMs,
    () => onBluffRef.current(textRef.current.trim()),
    !submitted
  )


  function handleSubmit() {
    if (submitted) return
    onBluff(text.trim())
  }

  if (submitted) {
    return (
      <div className="bluff-panel bluff-panel-submitted">
        <p className="bluff-panel-title">🎭 BLUFF SUBMITTED</p>
        <p className="bluff-panel-subtitle">
          Waiting for others… {submittedCount}/{totalPlayers}
        </p>
        {myBluff && myBluff.length > 0 ? (
          <p className="bluff-panel-mybluff">"{myBluff}"</p>
        ) : (
          <p className="bluff-panel-mybluff bluff-panel-mybluff-empty">
            (you sent no clue)
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bluff-panel">
      <p className="bluff-panel-title">🎭 SUBMIT YOUR BLUFF</p>
      <p className="bluff-panel-subtitle">
        {secondsLeft}s · Submitted: {submittedCount}/{totalPlayers}
      </p>

      <p className="bluff-panel-instruction">
        Type a clue about your own 3-digit code. It can be true or a lie.
      </p>

      <div className="bluff-panel-input-wrap">
        <input
          id="bluff-input"
          name="bluff-input"
          className="bluff-panel-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="e.g. starts with a 7"
          maxLength={MAX_LENGTH}
          autoFocus
        />
        <span className="bluff-panel-counter">
          {text.length}/{MAX_LENGTH}
        </span>
      </div>

      <Button
        variant="secondary"
        className="bluff-panel-submit"
        onClick={handleSubmit}
      >
        Submit Clue
      </Button>

      <p className="bluff-panel-hint">
        You can submit empty if you want to give no clue.
      </p>
    </div>
  )
}