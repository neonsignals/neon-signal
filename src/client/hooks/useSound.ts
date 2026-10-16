import { useCallback, useEffect, useRef, useState } from 'react'

const MUTE_KEY = 'neon-signal:muted'

type ToneName =
  | 'tick'
  | 'challenge'
  | 'correct'
  | 'wrong'
  | 'reveal'
  | 'fanfare'
  | 'join'
  | 'select'
  | 'timesup'

/**
 * Plays procedural sounds using Web Audio and speaks announcements
 * using the browser's speech synthesis (Big-Brother-style narrator).
 */
export function useSound() {
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === '1'
    } catch {
      return false
    }
  })

  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch {
      // ignore
    }
  }, [muted])

  const getCtx = useCallback(() => {
    if (ctxRef.current) return ctxRef.current
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      ctxRef.current = new Ctor()
    } catch {
      ctxRef.current = null
    }
    return ctxRef.current
  }, [])

  const tone = useCallback(
    (
      freq: number,
      durationMs: number,
      type: OscillatorType = 'sine',
      gainValue = 0.15,
      when = 0
    ) => {
      if (muted) return
      const ctx = getCtx()
      if (!ctx) return
      const start = ctx.currentTime + when / 1000
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(gainValue, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + durationMs / 1000)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + durationMs / 1000 + 0.02)
    },
    [muted, getCtx]
  )

  const play = useCallback(
    (name: ToneName) => {
      if (muted) return
      switch (name) {
        case 'tick':
          tone(880, 80, 'square', 0.08)
          break
        case 'select':
          tone(660, 60, 'triangle', 0.12)
          break
        case 'join':
          tone(523, 120, 'triangle', 0.15, 0)
          tone(659, 120, 'triangle', 0.15, 120)
          tone(784, 220, 'triangle', 0.15, 240)
          break
        case 'challenge':
          tone(220, 220, 'sawtooth', 0.18)
          tone(180, 260, 'sawtooth', 0.15, 120)
          break
        case 'correct':
          tone(659, 100, 'triangle', 0.15, 0)
          tone(880, 200, 'triangle', 0.15, 100)
          break
        case 'wrong':
          tone(200, 180, 'square', 0.15, 0)
          tone(150, 240, 'square', 0.14, 100)
          break
        case 'reveal':
          tone(440, 180, 'sine', 0.13, 0)
          tone(554, 180, 'sine', 0.13, 140)
          tone(659, 320, 'sine', 0.14, 280)
          break
        case 'fanfare':
          tone(523, 160, 'triangle', 0.18, 0)
          tone(659, 160, 'triangle', 0.18, 140)
          tone(784, 160, 'triangle', 0.18, 280)
          tone(1046, 400, 'triangle', 0.2, 420)
          break
        case 'timesup':
          tone(300, 400, 'sine', 0.18)
          tone(240, 500, 'sine', 0.16, 200)
          break
        default:
          break
      }
    },
    [muted, tone]
  )

  const speak = useCallback(
    (text: string) => {
      if (muted) return
      try {
        const synth = window.speechSynthesis
        if (!synth) return
        // Cancel any in-flight utterance so the newest line wins
        synth.cancel()
        const utter = new SpeechSynthesisUtterance(text)
        utter.rate = 1.05
        utter.pitch = 0.95
        utter.volume = 1
        // Prefer a deeper, more authoritative voice if available
        const voices = synth.getVoices()
        const preferred =
          voices.find((v) => /en-GB|en_GB/i.test(v.lang)) ||
          voices.find((v) => /en-/i.test(v.lang)) ||
          voices[0]
        if (preferred) utter.voice = preferred
        synth.speak(utter)
      } catch {
        // ignore
      }
    },
    [muted]
  )

  const toggleMute = useCallback(() => {
    setMuted((m) => !m)
  }, [])

  return { play, speak, muted, toggleMute }
}