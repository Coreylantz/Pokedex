import { Choice, Toggle } from './SettingControls'
import type { Settings } from '../lib/types'
import type { useOfflineCache } from '../lib/useOfflineCache'

interface SettingsScreenProps {
  settings: Settings
  onSet: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  onReset: () => void
  onBack: () => void
  offline: ReturnType<typeof useOfflineCache>
}

/** Every preference in one place: accessibility, feel, the hardware, offline. */
export function SettingsScreen({ settings, onSet, onReset, onBack, offline }: SettingsScreenProps) {
  const percent = offline.total ? Math.round((offline.done / offline.total) * 100) : 0

  return (
    <div className="page">
      <div className="page__bar">
        <button type="button" className="btn" onClick={onBack}>
          Menu
        </button>
        <p className="page__crumb">Settings</p>
      </div>

      <h1 className="page__title">Settings</h1>

      <section aria-labelledby="a11y-head" className="settings-group">
        <h2 className="page__subhead" id="a11y-head">
          Accessibility
        </h2>

        <Choice
          label="Typeface"
          hint="Digital is the device's own pixel face. Readable swaps longer text to your system font, which is easier going at length."
          value={settings.typeface}
          options={[
            { value: 'digital', label: 'Digital' },
            { value: 'readable', label: 'Readable' },
          ]}
          onChange={(value) => onSet('typeface', value)}
        />

        <Choice
          label="Text size"
          hint="Scales everything on the screen together, so the layout keeps its proportions."
          value={settings.textSize}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'large', label: 'Large' },
            { value: 'largest', label: 'Largest' },
          ]}
          onChange={(value) => onSet('textSize', value)}
        />

        <Toggle
          label="High contrast"
          hint="Darkens muted text to full strength and drops the screen texture."
          checked={settings.contrast}
          onChange={(value) => onSet('contrast', value)}
        />

        <Toggle
          label="Reduce motion"
          hint="Stops the loading pulse, the screen wipes and every transition. Your system setting is followed already; this forces it on."
          checked={settings.reduceMotion}
          onChange={(value) => onSet('reduceMotion', value)}
        />
      </section>

      <section aria-labelledby="feel-head" className="settings-group">
        <h2 className="page__subhead" id="feel-head">
          Sound &amp; feel
        </h2>

        <Toggle
          label="Sound effects"
          hint="A square-wave blip when the cursor moves and when you open something. Synthesised on the spot, so it costs nothing to store."
          checked={settings.sound}
          onChange={(value) => onSet('sound', value)}
        />

        <Toggle
          label="Vibration"
          hint="A short buzz alongside the blips, on devices with a vibration motor."
          checked={settings.haptics}
          onChange={(value) => onSet('haptics', value)}
        />
      </section>

      <section aria-labelledby="device-head" className="settings-group">
        <h2 className="page__subhead" id="device-head">
          Device
        </h2>

        <Toggle
          label="Device frame"
          hint="Turn this off to show the screen alone, with no shell around it — so the device in your hand becomes the Pokédex. The D-pad goes with it; the arrow keys still work."
          checked={settings.shell}
          onChange={(value) => onSet('shell', value)}
        />

        <Toggle
          label="Scanlines"
          hint="The fine horizontal banding of the screen itself."
          checked={settings.scanlines}
          onChange={(value) => onSet('scanlines', value)}
        />

        <Toggle
          label="Screen glow"
          hint="The soft backlight bloom around the edge of the display."
          checked={settings.glow}
          onChange={(value) => onSet('glow', value)}
        />

        <Toggle
          label="Screen transitions"
          hint="The display fades to blank and back when you move between screens. Follows your reduce-motion preference regardless."
          checked={settings.transitions}
          onChange={(value) => onSet('transitions', value)}
        />
      </section>

      {/* Connectivity and the offline download live here rather than on the
          dex, which is where you go to read, not to administer the device. */}
      <section aria-labelledby="offline-head" className="settings-group">
        <h2 className="page__subhead" id="offline-head">
          Offline data
        </h2>

        <Toggle
          label="Data saver"
          hint="Skips shiny sprites when saving for offline, and fetches more gently. Entries you open are always kept, whether this is on or off."
          checked={settings.lowBandwidth}
          onChange={(value) => onSet('lowBandwidth', value)}
        />

        <div className="setting">
          <p className="setting__status" data-online={offline.online}>
            <span className="setting__dot" aria-hidden="true" />
            {offline.online ? 'Online' : 'Offline — showing saved dex'}
          </p>

          {offline.status === 'priming' && (
            <>
              <label className="setting__hint" htmlFor="prime-progress">
                Saving every entry for offline use
              </label>
              <progress id="prime-progress" max={offline.total} value={offline.done} />
              <p className="setting__hint">
                {offline.done} / {offline.total} ({percent}%)
              </p>
            </>
          )}

          {offline.status === 'ready' && (
            <p className="setting__hint">The full dex is available with no network.</p>
          )}

          {(offline.status === 'error' || (offline.status === 'idle' && !offline.online)) && (
            <p className="setting__hint">
              {offline.online
                ? 'The last download did not finish. Some entries are not saved.'
                : 'Entries you have already opened are available. Connect to save the rest.'}
            </p>
          )}

          {/* Nothing downloads on its own, so the idle state has to explain
              itself or it reads as something having failed. The size is stated
              because it is roughly thirty times the app and the reader may be
              paying for it. */}
          {offline.status === 'idle' && offline.online && (
            <p className="setting__hint">
              Entries are saved as you open them. Saving the full dex fetches all{' '}
              {offline.total} species — about 4 MB.
            </p>
          )}

          {offline.online && offline.status !== 'priming' && (
            <p className="setting__foot">
              <button type="button" className="btn" onClick={offline.prime}>
                {offline.status === 'ready' ? 'Refresh offline data' : 'Save for offline'}
              </button>
            </p>
          )}
        </div>
      </section>

      <p className="setting__foot">
        <button type="button" className="btn" onClick={onReset}>
          Restore defaults
        </button>
      </p>
    </div>
  )
}
