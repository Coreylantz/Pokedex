import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorScreen } from './ErrorScreen'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render errors so a bug in one screen cannot blank the whole device.
 *
 * Without this, any thrown error unmounts the React tree and leaves an empty
 * page — no shell, no way back, nothing to report. A class component because
 * `componentDidCatch` still has no hook equivalent.
 *
 * The boundary sits inside the device frame, so a broken screen still looks
 * like a Pokedex with a fault rather than a broken website.
 *
 * There is no reset logic here on purpose. The boundary renders inside App's
 * keyed `.screen__page` wrapper, so a route change unmounts and replaces it
 * with fresh state. Resetting from `componentDidUpdate` would duplicate that
 * and cost a second render on every navigation.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept to the console rather than sent anywhere: this app has no backend,
    // and quietly shipping a reader's stack traces somewhere is not a thing to
    // do by default.
    console.error('Screen failed to render:', error, info.componentStack)
  }

  override render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <ErrorScreen
        title="Dex fault"
        detail="This screen stopped working. Going back usually clears it; if it keeps happening, the entry may be malformed."
        code={error.message}
        retryLabel="Reload"
        onRetry={() => location.reload()}
        onBack={() => history.back()}
      />
    )
  }
}
