export type BeastName =
  | 'fox'
  | 'owl'
  | 'wolf'
  | 'serpent'
  | 'phoenix'
  | 'kraken'
  | 'stag'
  | 'moth'

const BEASTS: BeastName[] = [
  'fox',
  'owl',
  'wolf',
  'serpent',
  'phoenix',
  'kraken',
  'stag',
  'moth',
]

const BEAST_EMOJI: Record<BeastName, string> = {
  fox: '🦊',
  owl: '🦉',
  wolf: '🐺',
  serpent: '🐍',
  phoenix: '🦅',
  kraken: '🐙',
  stag: '🦌',
  moth: '🦋',
}

type BeastProps = {
  name: BeastName
  size?: number
  hue?: number // 0–360, used to shift the glow color
}

export function Beast({ name, size = 56, hue = 180 }: BeastProps) {
  const emoji = BEAST_EMOJI[name]
  const glowColor = `hsl(${hue}, 90%, 60%)`

  return (
    <div
      className="beast"
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 16px ${glowColor}, 0 0 32px ${glowColor}40`,
        borderColor: glowColor,
      }}
    >
      <span className="beast-emoji" style={{ fontSize: size * 0.55 }}>
        {emoji}
      </span>
    </div>
  )
}

// Helper: pick a beast based on the player's seat index
export function beastForSeat(index: number): BeastName {
  return BEASTS[index % BEASTS.length]!
}

// Helper: pick a hue based on the player's seat index
export function hueForSeat(index: number): number {
  const hues = [180, 320, 30, 260, 90, 200, 0, 140]
  return hues[index % hues.length]!
}