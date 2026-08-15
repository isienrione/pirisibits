import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Threshold from '../Threshold'
import { AI_NOW_DISCLOSURE_COPY } from '../threshold/ThresholdSourceBadge.jsx'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext'

vi.mock('../../audio/thresholdAudio.js', () => ({
  ThresholdAudioCrossfade: class {
    start() {}
    stop() {}
    rampToThen() {}
    rampToNow() {}
  },
}))

const waypoint = {
  id: 'w13',
  name: 'The Pantheon',
  reconstruction: {
    now: '/now.jpg',
    then: '/then.jpg',
    caption: 'Evidence-based reconstruction',
  },
}

function renderThreshold(props = {}) {
  return render(
    <ThresholdChromeProvider>
      <Threshold waypoint={waypoint} active {...props} />
    </ThresholdChromeProvider>
  )
}

describe('Threshold', () => {
  it('renders labels and the persistent hold hint', () => {
    localStorage.clear()
    renderThreshold()

    expect(screen.getByText('Now')).toBeInTheDocument()
    expect(screen.getByText('Then')).toBeInTheDocument()
    expect(screen.getByTestId('threshold-hold-hint')).toBeInTheDocument()
    expect(screen.getByText('Press & hold to reveal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /about this reconstruction/i })).toBeInTheDocument()
  })

  it('marks the threshold surface as non-selectable', () => {
    renderThreshold()

    const root = document.querySelector('.threshold-root')
    expect(root).toHaveClass('cw-threshold-surface')
    expect(root).toHaveStyle({ touchAction: 'none', userSelect: 'none' })
  })

  it('blocks selection immediately on press and uses shared contain framing', () => {
    renderThreshold({ immersive: true })

    const root = document.querySelector('.threshold-root')
    fireEvent.pointerDown(root, { pointerId: 3, clientX: 120, clientY: 120 })
    expect(document.body).toHaveClass('cw-threshold-holding')

    const layers = root.querySelectorAll('.threshold-layer')
    expect(layers.length).toBeGreaterThanOrEqual(2)
    layers.forEach((layer) => {
      expect(layer).toHaveStyle({ objectFit: 'contain', objectPosition: 'center center' })
    })

    fireEvent.pointerUp(root, { pointerId: 3, clientX: 120, clientY: 120 })
  })

  it('prevents default browser touch gestures on the surface', () => {
    renderThreshold()

    const root = document.querySelector('.threshold-root')
    const event = new Event('touchstart', { bubbles: true, cancelable: true })
    const preventDefault = vi.spyOn(event, 'preventDefault')
    root.dispatchEvent(event)
    expect(preventDefault).toHaveBeenCalled()
  })

  it('does not pull back when the pointer leaves while capture is active', () => {
    vi.useFakeTimers()
    renderThreshold()

    const root = document.querySelector('.threshold-root')
    fireEvent.pointerDown(root, { pointerId: 7, clientX: 120, clientY: 120 })
    fireEvent.pointerLeave(root, { pointerId: 7, clientX: 0, clientY: 0 })

    expect(screen.queryByText('Tap to return to today')).not.toBeInTheDocument()

    vi.advanceTimersByTime(2100)
    fireEvent.pointerUp(root, { pointerId: 7, clientX: 0, clientY: 0 })

    expect(screen.getByText('Tap to return to today')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('returns null without reconstruction data', () => {
    const { container } = render(
      <ThresholdChromeProvider>
        <Threshold waypoint={{ id: 'x', name: 'Test' }} active />
      </ThresholdChromeProvider>
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('shows AI disclosure badge only for ai_generated now images', () => {
    renderThreshold({
      waypoint: {
        ...waypoint,
        now_image: { source: 'ai_generated' },
      },
    })

    expect(screen.getByRole('button', { name: /about this present-day view/i })).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(AI_NOW_DISCLOSURE_COPY.slice(0, 20)))).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /about this present-day view/i }))
    expect(screen.getByText(AI_NOW_DISCLOSURE_COPY)).toBeInTheDocument()
  })

  it('does not show AI disclosure badge for wikimedia now images', () => {
    renderThreshold({
      waypoint: {
        ...waypoint,
        now_image: { source: 'wikimedia' },
      },
    })

    expect(screen.queryByRole('button', { name: /about this present-day view/i })).not.toBeInTheDocument()
  })

  it('shows reconstruction honesty caption behind an info badge', () => {
    renderThreshold()

    expect(screen.getByRole('button', { name: /about this reconstruction/i })).toBeInTheDocument()
    expect(screen.queryByText('Evidence-based reconstruction')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /about this reconstruction/i }))
    expect(screen.getByText('Evidence-based reconstruction')).toBeInTheDocument()
  })

  it('shows tappable era pills as a fallback in immersive embedded mode', () => {
    renderThreshold({ embedded: true, immersive: true, thenLabel: 'ANCIENT ROME' })

    expect(screen.getByTestId('threshold-era-then')).toBeInTheDocument()
    expect(screen.getByTestId('threshold-era-today')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show ancient rome/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /show today/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /about this reconstruction/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('threshold-hold-hint')).not.toBeInTheDocument()
  })

  it('latches to Ancient via the era pill fallback', () => {
    const onHoldEnd = vi.fn()
    renderThreshold({
      embedded: true,
      immersive: true,
      thenLabel: 'ANCIENT ROME',
      onHoldEnd,
    })

    fireEvent.click(screen.getByTestId('threshold-era-then'))
    expect(screen.getByText('Tap to return to today')).toBeInTheDocument()
    expect(onHoldEnd).toHaveBeenCalledWith(expect.objectContaining({ latched: true, via: 'pill' }))
  })

  it('calls onDismiss from journey controls', () => {
    const onDismiss = vi.fn()
    renderThreshold({ onDismiss })

    fireEvent.click(screen.getByRole('button', { name: /return to story/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /close threshold/i }))
    expect(onDismiss).toHaveBeenCalledTimes(2)
  })
})
