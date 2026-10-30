import { useMemo, useRef, useState } from 'react'
import { usePhaseCountdown } from '@/client/hooks/usePhaseCountdown'
import { buildClueText, type ClueKind } from '@/shared/clues'
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

const DIGITS = Array.from({ length: 9 }, (_, index) => String(index + 1))
const CLUE_TYPES: { value: ClueKind; label: string }[] = [
  { value: 'first', label: 'My first digit' },
  { value: 'middle', label: 'My middle digit' },
  { value: 'last', label: 'My last digit' },
  { value: 'contains', label: 'My code contains this digit' },
  { value: 'sum', label: 'The sum of my digits' },
]

export function BluffPanel({
  submitted,
  myBluff,
  submittedCount,
  totalPlayers,
  durationMs = 20000,
  deadlineAt,
  onBluff,
}: BluffPanelProps) {
  const [clueKind, setClueKind] = useState<ClueKind | ''>('')
  const [value, setValue] = useState('7')
  const onBluffRef = useRef(onBluff)
  onBluffRef.current = onBluff

  const valueOptions = useMemo(
    () => clueKind === 'sum'
      ? Array.from({ length: 25 }, (_, index) => String(index + 3))
      : DIGITS,
    [clueKind]
  )
  const draftClue = clueKind ? buildClueText(clueKind, Number(value)) : ''
  const draftRef = useRef(draftClue)
  draftRef.current = draftClue

  const secondsLeft = usePhaseCountdown(
    deadlineAt,
    durationMs,
    () => onBluffRef.current(draftRef.current),
    !submitted
  )

  function handleKindChange(nextKind: ClueKind | '') {
    setClueKind(nextKind)
    setValue(nextKind === 'sum' ? '15' : '7')
  }

  function handleSubmit() {
    if (submitted || !draftClue) return
    onBluff(draftClue)
  }

  function handleSkip() {
    if (submitted) return
    onBluff('')
  }

  if (submitted) {
    return (
      <div className="bluff-panel bluff-panel-submitted">
        <p className="bluff-panel-title">🎭 CLUE SUBMITTED</p>
        <p className="bluff-panel-subtitle">
          Waiting for others… {submittedCount}/{totalPlayers}
        </p>
        {myBluff && myBluff.length > 0 ? (
          <p className="bluff-panel-mybluff">“{myBluff}”</p>
        ) : (
          <p className="bluff-panel-mybluff bluff-panel-mybluff-empty">
            (you submitted no clue)
          </p>
        )}
        <p className="bluff-panel-hint">Other players can challenge your statement. The game checks whether it is true.</p>
      </div>
    )
  }

  return (
    <div className="bluff-panel">
      <p className="bluff-panel-title">🎭 MAKE YOUR CLUE</p>
      <p className="bluff-panel-subtitle">
        {secondsLeft}s · Submitted: {submittedCount}/{totalPlayers}
      </p>

      <p className="bluff-panel-instruction">
        Choose a sentence about your secret code. You may tell the truth or try to fool the other players.
      </p>

      <div className="bluff-panel-fields">
        <label className="bluff-panel-label" htmlFor="clue-kind">1. Choose what to say</label>
        <select
          id="clue-kind"
          className="bluff-panel-select"
          value={clueKind}
          onChange={(event) => handleKindChange(event.target.value as ClueKind | '')}
        >
          <option value="">Choose a clue type…</option>
          {CLUE_TYPES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>

        {clueKind && (
          <>
            <label className="bluff-panel-label" htmlFor="clue-value">
              2. Choose the number
            </label>
            <select
              id="clue-value"
              className="bluff-panel-select"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            >
              {valueOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="bluff-panel-preview" aria-live="polite">
        <span className="bluff-panel-preview-label">WHAT OTHER PLAYERS WILL SEE</span>
        <strong>{draftClue || 'Choose a clue type to see your sentence.'}</strong>
      </div>

      <Button
        variant="secondary"
        className="bluff-panel-submit"
        disabled={!draftClue}
        onClick={handleSubmit}
      >
        Submit Clue
      </Button>
      <Button
        variant="ghost"
        className="bluff-panel-skip"
        onClick={handleSkip}
      >
        Submit without a clue
      </Button>

      <p className="bluff-panel-hint">
        A clue can be true or false. The game checks it automatically when the round is revealed. If time runs out, your selected clue is submitted; if you selected nothing, you submit no clue.
      </p>
    </div>
  )
}
