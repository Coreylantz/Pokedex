import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorScreen } from './ErrorScreen'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * A class because `componentDidCatch` still has no hook equivalent. Sits inside
 * the device frame, so a broken screen looks like a Pokedex with a fault rather
 * than a broken website.
 *
 * No reset logic on purpose: it renders inside App's keyed `.screen__page`, so
 * a route change already unmounts it with fresh state.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Console only: there is no backend, and quietly shipping a reader's stack
    // traces somewhere is not a default worth having.
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
