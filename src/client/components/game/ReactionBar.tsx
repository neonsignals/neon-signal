import { ALLOWED_REACTIONS } from '@/shared/reactions'
import './ReactionBar.css'

type ReactionBarProps = {
  onSend: (emoji: string) => void
}

export function ReactionBar({ onSend }: ReactionBarProps) {
  return (
    <div className="reaction-bar" aria-label="Send a reaction">
      {ALLOWED_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="reaction-btn"
          onClick={() => onSend(emoji)}
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}