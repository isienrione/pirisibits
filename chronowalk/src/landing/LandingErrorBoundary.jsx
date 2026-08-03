import { Component } from 'react'
import { trackReactErrorBoundary } from '../lib/analytics.ts'
import { stackHead } from '../lib/errorVisibility.js'

/**
 * Landing-root error boundary — never leave a white screen.
 * Fires track('react_error_boundary') and shows a Reload CTA.
 */
export default class LandingErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: String(error?.message || error || '').slice(0, 240),
    }
  }

  componentDidCatch(error, info) {
    console.error('[landing] React error boundary', error, info)
    trackReactErrorBoundary({
      errorMessage: String(error?.message || error || '').slice(0, 240),
      componentStackHead: stackHead(info?.componentStack, 8),
    })
  }

  handleReload = () => {
    if (typeof window === 'undefined') return
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main
        role="alert"
        className="cw-landing-error"
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: '1.5rem',
          background: '#16130f',
          color: '#f5efe3',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '22rem', width: '100%' }}>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 650 }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0.85rem 0 0', lineHeight: 1.5, opacity: 0.85 }}>
            ChronoWalk hit an unexpected error on this page. Reload to try again — your
            access and progress stay on this device.
          </p>
          {this.state.errorMessage ? (
            <p
              style={{
                margin: '0.85rem 0 0',
                fontSize: '0.75rem',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                opacity: 0.55,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {this.state.errorMessage}
            </p>
          ) : null}
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              marginTop: '1.35rem',
              minHeight: 44,
              width: '100%',
              border: 0,
              borderRadius: 999,
              padding: '0.75rem 1.1rem',
              background: '#e8a13c',
              color: '#2a1206',
              fontWeight: 700,
              font: 'inherit',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </main>
    )
  }
}
