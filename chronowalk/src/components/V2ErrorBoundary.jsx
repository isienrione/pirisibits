import { Component } from 'react'
import { recoverStaleClient } from '../pwa/staleChunkRecovery.js'

export default class V2ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, recovering: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('V2ErrorBoundary caught an error:', error, info)
  }

  handleRetry = () => {
    if (this.state.recovering) return
    this.setState({ recovering: true })

    const custom = this.props.onRetry
    if (typeof custom === 'function') {
      Promise.resolve(custom())
        .catch(() => {})
        .finally(() => {
          this.setState({ hasError: false, recovering: false })
        })
      return
    }

    // Default: real stale-build recovery (purge SW caches + reload once).
    // Does not clear credentials, progress, or IndexedDB tour state.
    void recoverStaleClient({ force: true }).finally(() => {
      // If reload was blocked in tests, allow another click.
      this.setState({ hasError: true, recovering: false })
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
            {this.props.title ?? 'Something went wrong'}
          </p>
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 'var(--fs-secondary)',
              lineHeight: 1.55,
              color: 'color-mix(in srgb, var(--ink) 65%, var(--bone))',
            }}
          >
            {this.props.message ??
              'This screen could not load. Try again to refresh the app shell — your access and progress stay on this device.'}
          </p>
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
        </div>
      </main>
    )
  }
}
