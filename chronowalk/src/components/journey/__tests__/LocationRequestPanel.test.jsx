import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import LocationRequestPanel from '../LocationRequestPanel'
import { LOCATION_STATUS } from '../../../hooks/useGeoLocation'

describe('LocationRequestPanel', () => {
  it('shows the initial prompt before location is requested', () => {
    render(<LocationRequestPanel status={null} onRequest={vi.fn()} />)

    expect(screen.getByText(/enable location for guided walking/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /allow location/i })).toBeInTheDocument()
  })

  it('calls onRequest from the prompt action', () => {
    const onRequest = vi.fn()
    render(<LocationRequestPanel status={null} onRequest={onRequest} />)

    fireEvent.click(screen.getByRole('button', { name: /allow location/i }))
    expect(onRequest).toHaveBeenCalledTimes(1)
  })

  it('shows granted confirmation', () => {
    render(<LocationRequestPanel status={LOCATION_STATUS.GRANTED} onRequest={vi.fn()} />)
    expect(screen.getByText(/location ready/i)).toBeInTheDocument()
  })
})
