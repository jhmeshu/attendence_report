import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * ErrorBoundary — catches render-time errors so the app never shows a blank
 * screen (doc Phase 14: error handling). Falls back to a friendly panel with a
 * reload action.
 */
export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Surfaced in console for diagnosis; production could forward to a sink.
    console.error('[ErrorBoundary]', error, info)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-subtle p-6">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-surface p-8 text-center shadow-card">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-danger">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink-muted">
            An unexpected error occurred while rendering the dashboard. Reload
            to continue, then try uploading your CSV files again.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary