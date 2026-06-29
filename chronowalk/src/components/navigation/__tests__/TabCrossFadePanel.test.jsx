import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { TabCrossFadePanel } from '../TabCrossFadePanel'

const { useReducedMotionMock } = vi.hoisted(() => ({
  useReducedMotionMock: vi.fn(() => false),
}))

vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => useReducedMotionMock(),
}))

describe('TabCrossFadePanel', () => {
  beforeEach(() => {
    useReducedMotionMock.mockReturnValue(false)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('cross-fades active tab content in with motion-safe classes', async () => {
    render(
      <TabCrossFadePanel active className="min-h-full">
        <p>Tour overview</p>
      </TabCrossFadePanel>
    )

    const panel = screen.getByText('Tour overview').parentElement
    expect(panel).toHaveClass('tab-panel-motion')
    expect(panel).toHaveClass('tab-panel-motion--active')
  })

  it('keeps mounted panels in the tree while inactive', () => {
    const { rerender } = render(
      <TabCrossFadePanel active keepMounted id="main-tour-content">
        <p>Map layer</p>
      </TabCrossFadePanel>
    )

    expect(screen.getByText('Map layer')).toBeInTheDocument()

    rerender(
      <TabCrossFadePanel active={false} keepMounted id="main-tour-content">
        <p>Map layer</p>
      </TabCrossFadePanel>
    )

    const panel = screen.getByText('Map layer').parentElement
    expect(panel).toHaveClass('tab-panel-motion--inactive')
    expect(panel).toHaveAttribute('aria-hidden', 'true')
  })

  it('unmounts non-keep-mounted panels immediately when reduced motion is enabled', async () => {
    useReducedMotionMock.mockReturnValue(true)
    vi.spyOn(window, 'setTimeout').mockImplementation((callback) => {
      callback()
      return 1
    })

    const { rerender } = render(
      <TabCrossFadePanel active>
        <p>Settings</p>
      </TabCrossFadePanel>
    )

    expect(screen.getByText('Settings')).toBeInTheDocument()

    await act(async () => {
      rerender(
        <TabCrossFadePanel active={false}>
          <p>Settings</p>
        </TabCrossFadePanel>
      )
    })

    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })
})
