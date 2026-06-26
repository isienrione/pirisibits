import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LocationNotice from '../LocationNotice'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation'

describe('LocationNotice', () => {
  it('shows permission guidance when location is denied', () => {
    render(
      <LocationNotice status={LOCATION_STATUS.DENIED} onRetry={vi.fn()} />
    )

    expect(screen.getByText(/location access is off/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try location again/i })).toBeInTheDocument()
  })

  it('calls retry when the action button is pressed', () => {
    const onRetry = vi.fn()
    render(
      <LocationNotice status={LOCATION_STATUS.UNAVAILABLE} onRetry={onRetry} />
    )

    fireEvent.click(screen.getByRole('button', { name: /retry gps/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when location is granted', () => {
    const { container } = render(
      <LocationNotice status={LOCATION_STATUS.GRANTED} onRetry={vi.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
