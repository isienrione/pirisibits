import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import SplashScreen from '../SplashScreen'

describe('SplashScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders logo and tagline', () => {
    render(<SplashScreen onComplete={vi.fn()} />)

    expect(screen.getByLabelText(/loading chronowalk/i)).toBeInTheDocument()
    expect(screen.getByText(/walk through time/i)).toBeInTheDocument()
    const logo = document.querySelector('img[src="/brand/chronowalk-logo.png"]')
    expect(logo).toBeInTheDocument()
  })

  it('calls onComplete after splash duration', () => {
    const onComplete = vi.fn()
    render(<SplashScreen onComplete={onComplete} />)

    act(() => {
      vi.advanceTimersByTime(2650)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
