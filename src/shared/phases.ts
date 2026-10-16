export const PHASES = [
  'lock',
  'peek',
  'bluff',
  'challenge',
  'guess',
  'reveal',
] as const

export type Phase = (typeof PHASES)[number]

export const PHASE_COLORS: Record<Phase, string> = {
  lock: 'var(--color-cyan)',
  peek: 'var(--color-purple)',
  bluff: 'var(--color-magenta)',
  challenge: 'var(--color-red)',
  guess: 'var(--color-amber)',
  reveal: 'var(--color-green)',
}

export const PHASE_LABELS: Record<Phase, string> = {
  lock: 'LOCK',
  peek: 'PEEK',
  bluff: 'BLUFF',
  challenge: 'CHALLENGE',
  guess: 'GUESS',
  reveal: 'REVEAL',
}

export function nextPhase(current: Phase): Phase {
  const index = PHASES.indexOf(current)
  return PHASES[(index + 1) % PHASES.length]!
}