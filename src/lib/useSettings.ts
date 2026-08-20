import { useCallback, useEffect, useState } from 'react'
import type { Settings } from './types'

const KEY = 'twindex:settings:v1'

const DEFAULTS: Settings = {
  // Device
  shell: true,
  scanlines: true,
  glow: true,
  transitions: true,
  // Settings
  sound: false,
  haptics: false,
  typeface: 'digital',
  textSize: 'normal',
  contrast: false,
  reduceMotion: false,
  // `saveData` is set by Android's Data Saver and most metered settings, so a
  // capped phone opts itself in.
  lowBandwidth: navigator.connection?.saveData ?? false,
}

/**
 * Merged over the defaults rather than trusted wholesale, so a key added later
 * is present in an old saved blob and a truncated value cannot strand the app.
 */
function load(): Settings {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Settings>) }
  } catch {
    return { ...DEFAULTS }
  }
}

/**
 * `typeface` is grouped under Accessibility rather than Device: swapping prose
 * to the system stack is a legibility control, not a look.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings))
  }, [settings])

  // Generic in the key so `set('glow', 'yes')` is a compile error rather than
  // a setting that silently stops working.
  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setSettings({ ...DEFAULTS }), [])

  return { settings, set, reset }
}
