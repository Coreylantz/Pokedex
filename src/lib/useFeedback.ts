import { useCallback, useRef } from 'react'
import type { Settings, Voice } from './types'

/** [frequency in Hz, start offset in seconds, duration in seconds] */
type Note = readonly [number, number, number]

/**
 * Synthesised with square-wave oscillators rather than shipped audio: bytes
 * instead of kilobytes, and a square wave is what the imitated hardware had.
 *
 * Each voice is a short note sequence, not one tone — a sustained tone reads as
 * an error beep rather than a menu. Off by default; the AudioContext cannot
 * start before a gesture anyway.
 */
const VOICES: Record<Voice, readonly Note[]> = {
  move: [[1480, 0, 0.022]],
  select: [
    [988, 0, 0.032],
    [1319, 0.034, 0.055],
  ],
  back: [
    [880, 0, 0.032],
    [587, 0.034, 0.055],
  ],
}

export function useFeedback(settings: Pick<Settings, 'sound' | 'haptics'>) {
  const ctxRef = useRef<AudioContext | null>(null)

  const play = useCallback(
    (voice: Voice) => {
      if (!settings.sound) return
      const notes = VOICES[voice] ?? VOICES.move
      try {
        ctxRef.current ??= new AudioContext()
        const ctx = ctxRef.current
        // Browsers suspend the context until a gesture; every caller here is one.
        if (ctx.state === 'suspended') void ctx.resume()

        for (const [freq, offset, dur] of notes) {
          const at = ctx.currentTime + offset
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'square'
          osc.frequency.setValueAtTime(freq, at)
          // Decayed rather than cut, which would click.
          gain.gain.setValueAtTime(0.035, at)
          gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
          osc.connect(gain).connect(ctx.destination)
          osc.start(at)
          osc.stop(at + dur)
        }
      } catch {
        // Silence is an acceptable outcome for a blip.
      }
    },
    [settings.sound],
  )

  const buzz = useCallback(
    (pattern: number | number[] = 8) => {
      if (!settings.haptics) return
      navigator.vibrate?.(pattern)
    },
    [settings.haptics],
  )

  /** The usual pairing: a blip and a tap for the same event. */
  return useCallback(
    (voice: Voice) => {
      play(voice)
      buzz(voice === 'select' ? 14 : 8)
    },
    [play, buzz],
  )
}
