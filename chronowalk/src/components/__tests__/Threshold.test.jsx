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

  it('prevents default browser touch gestures on the surface', () => {
    renderThreshold()

    const root = document.querySelector('.threshold-root')
    const event = new Event('touchstart', { bubbles: true, cancelable: true })
    const preventDefault = vi.spyOn(event, 'preventDefault')
    root.dispatchEvent(event)
    expect(preventDefault).toHaveBeenCalled()
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

  it('hides era pills and source badges in immersive embedded mode', () => {
    renderThreshold({ embedded: true, immersive: true, thenLabel: 'ANCIENT ROME' })

    expect(screen.queryByText('Today')).not.toBeInTheDocument()
    expect(screen.queryByText('ANCIENT ROME')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /about this reconstruction/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('threshold-hold-hint')).not.toBeInTheDocument()
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
