import { PixelIcon } from './PixelIcon'

interface ErrorScreenProps {
  /** Short, in the device's voice. "No signal", not "Request failed". */
  title: string
  /** What happened and what the reader can do, in plain words. */
  detail: string
  /** Shown as a code line, so a bug report can carry something exact. */
  code?: string | undefined
  onRetry?: (() => void) | undefined
  onBack?: (() => void) | undefined
  retryLabel?: string
}

/**
 * A failure, rendered as a screen rather than a notification.
 *
 * Deliberately not a toast. A toast announces a problem and then removes the
 * evidence a few seconds later, which is exactly wrong here: if the dex cannot
 * load there is nothing else on the screen to look at, the reader may not have
 * been watching when it appeared, and there is an action to take. Toasts also
 * land badly for screen reader and switch users, who have to catch a live
 * region before it disappears.
 *
 * So the error takes the screen, stays until it is dealt with, and offers the
 * two things that ever help — try again, or go back.
 */
export function ErrorScreen({
  title,
  detail,
  code,
  onRetry,
  onBack,
  retryLabel = 'Try again',
}: ErrorScreenProps) {
  return (
    <div className="errscreen" role="alert" aria-labelledby="err-title">
      <span className="errscreen__mark" aria-hidden="true">
        <PixelIcon name="close" />
      </span>

      <h1 className="errscreen__title" id="err-title">
        {title}
      </h1>
      <p className="errscreen__detail">{detail}</p>

      {code && <p className="errscreen__code">{code}</p>}

      <div className="errscreen__actions">
        {onRetry && (
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            {retryLabel}
          </button>
        )}
        {onBack && (
          <button type="button" className="btn" onClick={onBack}>
            Back
          </button>
        )}
      </div>
    </div>
  )
}
