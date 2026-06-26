import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '../ui/EmptyState'
import { EMPTY_STATE_PRESETS } from '../ui/emptyStatePresets'

const CORE_PRESETS = [
  'noGps',
  'noInternet',
  'noAudio',
  'mediaUnavailable',
  'routeUnavailable',
  'tourCompleted',
]

describe('EmptyState', () => {
  it.each(CORE_PRESETS)('renders icon, body, and action for %s', (preset) => {
    const copy = EMPTY_STATE_PRESETS[preset]
    render(<EmptyState preset={preset} onAction={vi.fn()} onSecondaryAction={vi.fn()} />)

    expect(screen.getByText(copy.title)).toBeInTheDocument()
    expect(screen.getByText(copy.body)).toBeInTheDocument()

    if (copy.actionLabel) {
      expect(screen.getByRole('button', { name: copy.actionLabel })).toBeInTheDocument()
    }
  })

  it('renders compact mode with icon and short copy', () => {
    render(<EmptyState preset="gpsWaiting" compact onAction={vi.fn()} />)

    expect(screen.getByText(/finding your location/i)).toBeInTheDocument()
    expect(screen.getByText(/hang tight/i)).toBeInTheDocument()
  })

  it('supports custom secondary actions from presets', () => {
    render(
      <EmptyState preset="tourCompleted" onAction={vi.fn()} onSecondaryAction={vi.fn()} />
    )

    expect(screen.getByRole('button', { name: /return to map/i })).toBeInTheDocument()
  })
})
