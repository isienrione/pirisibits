import { Component } from 'react'
import { EmptyState } from './ui'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.preset === 'studioUnavailable') {
      window.location.reload()
      return
    }
    this.props.onRetry?.()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const shellClass = this.props.fullScreen
      ? 'flex h-full min-h-[12rem] w-full items-center justify-center bg-gradient-to-b from-sand/30 via-warm-white to-limestone/20 p-6'
      : 'w-full p-4'

    if (this.props.preset) {
      return (
        <div className={shellClass} role="alert">
          <EmptyState
            preset={this.props.preset}
            onAction={this.handleRetry}
            className="mx-auto max-w-md"
          />
        </div>
      )
    }

    return (
      <div className={shellClass} role="alert">
        <EmptyState
          title={this.props.title ?? 'Something went wrong'}
          body={
            this.props.message ??
            'This part of the tour could not load. You can try again or continue with the rest of the app.'
          }
          actionLabel="Try again"
          onAction={this.handleRetry}
          className="mx-auto max-w-md"
        />
      </div>
    )
  }
}

export default ErrorBoundary
