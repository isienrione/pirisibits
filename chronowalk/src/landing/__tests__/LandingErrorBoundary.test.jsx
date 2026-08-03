import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../../lib/analytics.ts', () => ({
  trackReactErrorBoundary: vi.fn(() => true),
}))

import LandingErrorBoundary from '../LandingErrorBoundary.jsx'
import { trackReactErrorBoundary } from '../../lib/analytics.ts'

function Boom() {
  throw new Error('landing_boom')
}

describe('LandingErrorBoundary', () => {
  it('tracks react_error_boundary and shows a reload fallback', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <LandingErrorBoundary>
        <Boom />
      </LandingErrorBoundary>,
    )

    expect(trackReactErrorBoundary).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: 'landing_boom',
        componentStackHead: expect.any(String),
      }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i)
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()

    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    })
    fireEvent.click(screen.getByRole('button', { name: /reload/i }))
    expect(reload).toHaveBeenCalled()

    spy.mockRestore()
  })
})
