type MuteButtonProps = {
  muted: boolean
  onToggle: () => void
}

export function MuteButton({ muted, onToggle }: MuteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      title={muted ? 'Unmute sound' : 'Mute sound'}
      style={{
        background: 'transparent',
        border: '1px solid var(--color-border-bright)',
        color: muted ? 'var(--color-text-dim)' : 'var(--color-cyan)',
        borderRadius: '9999px',
        padding: '4px 10px',
        fontSize: 14,
        cursor: 'pointer',
        transition: 'color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}