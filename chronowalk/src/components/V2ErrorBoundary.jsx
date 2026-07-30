import { Component } from 'react'
import { isStaleChunkError, recoverStaleClient } from '../pwa/staleChunkRecovery.js'

export default class V2ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, recovering: false, autoRecovering: false, errorMessage: '' }
    this.autoRecoverAttempted = false
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: String(error?.message || error || '').slice(0, 240),
    }
  }

  componentDidCatch(error, info) {
    console.error('V2ErrorBoundary caught an error:', error, info)

    // Only auto-heal known stale-chunk / poisoned-shell failures. Auto-recovering
    // *any* error caused a loop: throw → reset-shell → /landing → same throw.
    if (this.autoRecoverAttempted) return
    this.autoRecoverAttempted = true

    const shouldAuto =
      isStaleChunkError(error) || this.props.autoRecoverOnAnyError === true

    if (!shouldAuto) return

    this.setState({ autoRecovering: true, recovering: true })
    void recoverStaleClient({ force: false, reason: 'error-boundary' }).then((result) => {
      if (!result?.reloading) {
        // Guard already spent - show Try again so the traveler can force it.
        this.setState({ autoRecovering: false, recovering: false })
      }
    })
  }

  handleRetry = () => {
    if (this.state.recovering) return
    this.setState({ recovering: true, autoRecovering: true })

    const custom = this.props.onRetry
    if (typeof custom === 'function') {
      Promise.resolve(custom())
        .catch(() => {})
        .finally(() => {
          this.setState({ hasError: false, recovering: false, autoRecovering: false })
        })
      return
    }

    // Default: real stale-build recovery (purge SW caches + reload once).
    // Does not clear credentials, progress, or IndexedDB tour state.
    void recoverStaleClient({ force: true, reason: 'manual-retry' }).finally(() => {
      // If reload was blocked in tests, allow another click.
      this.setState({ hasError: true, recovering: false, autoRecovering: false })
    })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: 'var(--edge)',
          background: 'var(--bone)',
          color: 'var(--ink)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '100%',
            padding: 24,
            borderRadius: 'var(--r-card)',
            border: '1px solid color-mix(in srgb, var(--ink) 10%, var(--bone))',
            background: 'color-mix(in srgb, var(--ink) 3%, var(--bone))',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-title)',
              fontWeight: 500,
            }}
          >
            {this.state.autoRecovering
              ? 'Updating ChronoWalk…'
              : (this.props.title ?? 'Something went wrong')}
          </p>
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 'var(--fs-secondary)',
              lineHeight: 1.55,
              color: 'color-mix(in srgb, var(--ink) 65%, var(--bone))',
            }}
          >
            {this.state.autoRecovering
              ? 'A newer version just shipped. Refreshing the app shell - your access and progress stay on this device.'
              : (this.props.message ??
                'This screen could not load. Try again to refresh the app shell - your access and progress stay on this device.')}
          </p>
          {!this.state.autoRecovering && this.state.errorMessage ? (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: '0.75rem',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                color: 'color-mix(in srgb, var(--ink) 45%, var(--bone))',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {this.state.errorMessage}
            </p>
          ) : null}
          <button
            type="button"
            onClick={this.handleRetry}
            disabled={this.state.recovering}
            style={{
              marginTop: 20,
              width: '100%',
              padding: '14px 18px',
              border: 'none',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--bone)',
              fontWeight: 600,
              cursor: this.state.recovering ? 'wait' : 'pointer',
              opacity: this.state.recovering ? 0.7 : 1,
            }}
          >
            {this.state.recovering ? 'Refreshing…' : 'Try again'}
          </button>
          {!this.state.autoRecovering ? (
            <p
              style={{
                margin: '16px 0 0',
                fontSize: 'var(--fs-secondary)',
                lineHeight: 1.5,
                color: 'color-mix(in srgb, var(--ink) 55%, var(--bone))',
              }}
            >
              Still stuck?{' '}
              <a
                href="/rome/reset-shell?force=1"
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                Refresh the app shell
              </a>
              {' '}
              - access stays on this device.
            </p>
          ) : null}
        </div>
      </main>
    )
  }
}
