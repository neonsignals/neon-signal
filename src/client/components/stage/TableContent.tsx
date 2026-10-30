import type { Phase } from '@/shared/phases'

type TableContentProps = {
  phase: Phase
}

export function TableContent({ phase }: TableContentProps) {
  if (phase === 'lock') {
    return (
      <div className="table-phase">
        <p className="table-phase-title">LOCK</p>
        <p className="table-phase-hint">Pick your 3-digit code</p>
        <div className="table-preview-digits">
          <div className="table-preview-digit">?</div>
          <div className="table-preview-digit">?</div>
          <div className="table-preview-digit">?</div>
        </div>
      </div>
    )
  }

  if (phase === 'peek') {
    return (
      <div className="table-phase">
        <p className="table-phase-title">PEEK</p>
        <p className="table-phase-hint">You saw ZEPH's digit</p>
        <div className="table-preview-digits">
          <div className="table-preview-digit">?</div>
          <div className="table-preview-digit">4</div>
          <div className="table-preview-digit">?</div>
        </div>
      </div>
    )
  }

  if (phase === 'bluff') {
    return (
      <div className="table-phase">
        <p className="table-phase-title">BLUFF</p>
        <p className="table-phase-hint">Choose a true or false clue about your code</p>
        <div className="table-preview-input">starts with a 7…</div>
      </div>
    )
  }

  if (phase === 'challenge') {
    return (
      <div className="table-phase">
        <p className="table-phase-title">CHALLENGE</p>
        <p className="table-phase-hint">Challenge a clue you think is false</p>
        <div className="table-preview-challenge">⚡ CHOOSE ONE PLAYER</div>
      </div>
    )
  }

  if (phase === 'guess') {
    return (
      <div className="table-phase">
        <p className="table-phase-title">GUESS</p>
        <p className="table-phase-hint">Enter a 3-digit guess</p>
        <div className="table-preview-digits">
          <div className="table-preview-digit">7</div>
          <div className="table-preview-digit">4</div>
          <div className="table-preview-digit">?</div>
        </div>
      </div>
    )
  }

  return (
    <div className="table-phase">
      <p className="table-phase-title">REVEAL</p>
      <p className="table-phase-hint">All codes revealed</p>
      <div className="table-preview-reveal">
        <span>🦊 7 4 2</span>
        <span>🦉 2 9 1</span>
        <span>🐺 8 3 6</span>
      </div>
    </div>
  )
}