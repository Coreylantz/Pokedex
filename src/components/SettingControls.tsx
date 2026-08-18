import { useId } from 'react'

/**
 * A labelled switch.
 *
 * The visible label is a `span` bound with `aria-labelledby`, not a second
 * `label` element. Two labels on one input get concatenated into the
 * accessible name, which announced this as "High contrast Off" — the state
 * baked into the name, on top of the checkbox's own checked state, and
 * changing every time you toggled it.
 */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  const labelId = `${id}-label`
  const hintId = `${id}-hint`

  return (
    <div className="setting">
      <span className="setting__label" id={labelId}>
        {label}
      </span>
      <p className="setting__hint" id={hintId}>
        {hint}
      </p>
      <label className="switch" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          aria-labelledby={labelId}
          aria-describedby={hintId}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch__track" aria-hidden="true" />
        <span className="switch__state">{checked ? 'On' : 'Off'}</span>
      </label>
    </div>
  )
}

/**
 * Generic in the option value, so the handler receives the union the caller
 * declared rather than a bare `string` it would have to re-narrow.
 */
export function Choice<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string
  hint: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const id = useId()
  const hintId = `${id}-hint`

  return (
    <div className="setting">
      <label className="setting__label" htmlFor={id}>
        {label}
      </label>
      {/* Described-by, so the explanation is reachable from the control rather
          than only visible beside it. */}
      <p className="setting__hint" id={hintId}>
        {hint}
      </p>
      <select
        id={id}
        className="setting__select"
        value={value}
        aria-describedby={hintId}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
