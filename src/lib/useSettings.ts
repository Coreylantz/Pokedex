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
  // Defaults to whatever the device asks for. `saveData` is set by Android's
  // Data Saver and by most metered-connection settings, so a phone on a capped
  // plan opts itself in rather than waiting to be told.
  lowBandwidth: navigator.connection?.saveData ?? false,
}

/**
 * Stored settings are merged over the defaults rather than trusted wholesale,
 * so a key added in a later version is present even in an old saved blob, and
 * a hand-edited or truncated value cannot leave the app without a setting.
 */
function load(): Settings {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Settings>) }
  } catch {
    return { ...DEFAULTS }
  }
}

/**
 * Device and preference settings, persisted so the unit comes back the way you
 * left it.
 *
 * Grouped on one Settings screen: Accessibility, Sound & feel, Device, and the
 * offline download. `typeface` counts as accessibility rather than device
 * styling, because swapping prose to the system stack is a legibility control
 * and not a look.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings))
  }, [settings])

  // Generic in the key so the value has to match that key's type: `set('glow',
  // 'yes')` is a compile error rather than a setting that silently stops working.
  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setSettings({ ...DEFAULTS }), [])

  return { settings, set, reset }
}
