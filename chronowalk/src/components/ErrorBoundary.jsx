import { Component } from 'react'
import { Button, GlassPanel, cn, ctaInCard } from './ui'

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
    this.props.onRetry?.()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const title = this.props.title ?? 'Something went wrong'
    const message =
      this.props.message ??
      'This part of the tour could not load. You can try again or continue with the rest of the app.'

    return (
      <div
        className={
          this.props.fullScreen
            ? 'flex h-full min-h-[12rem] w-full items-center justify-center bg-warm-white p-6'
            : 'w-full p-4'
        }
        role="alert"
      >
        <GlassPanel className="max-w-md p-6 text-center">
          <p className="font-display text-xl font-semibold text-deep-slate">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-soft-slate">{message}</p>
          <Button className={cn(ctaInCard, 'mt-5')} onClick={this.handleRetry}>
            Try again
          </Button>
        </GlassPanel>
      </div>
    )
  }
}

export default ErrorBoundary
