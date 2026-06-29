import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomSheet } from '../BottomSheet'

vi.mock('../../hooks/useHapticTriggers', () => ({
  useOpenHaptic: vi.fn(),
}))

vi.mock('../../utils/haptics', () => ({
  triggerHaptic: vi.fn(),
  HAPTIC_KIND: { SOFT_TAP: 'soft_tap' },
}))

const { useReducedMotionMock } = vi.hoisted(() => ({
  useReducedMotionMock: vi.fn(() => false),
}))

vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => useReducedMotionMock(),
}))

describe('BottomSheet', () => {
  beforeEach(() => {
    useReducedMotionMock.mockReturnValue(false)
  })

  it('plays the sheet-rise animation when cinematic and open', () => {
    const { container, rerender } = render(
      <BottomSheet open={false} cinematic>
        <p>Waypoint content</p>
      </BottomSheet>
    )

    const sheet = container.firstChild
    expect(sheet).not.toHaveClass('animate-sheet-rise')

    rerender(
      <BottomSheet open cinematic>
        <p>Waypoint content</p>
      </BottomSheet>
    )

    expect(container.firstChild).toHaveClass('animate-sheet-rise')
  })

  it('skips sheet-rise animation when reduced motion is enabled', () => {
    useReducedMotionMock.mockReturnValue(true)

    render(
      <BottomSheet open cinematic>
        <p>Waypoint content</p>
      </BottomSheet>
    )

    expect(screen.getByRole('dialog')).toHaveClass('translate-y-0')
    expect(screen.getByRole('dialog')).not.toHaveClass('animate-sheet-rise')
  })
})
