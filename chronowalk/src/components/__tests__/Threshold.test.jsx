import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Threshold from '../Threshold'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext'

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
  it('renders labels and the first-time hint', () => {
    localStorage.clear()
    renderThreshold()

    expect(screen.getByText('Now')).toBeInTheDocument()
    expect(screen.getByText('Then')).toBeInTheDocument()
    expect(screen.getByText('Press and hold to cross')).toBeInTheDocument()
    expect(screen.getByText('Evidence-based reconstruction')).toBeInTheDocument()
  })

  it('returns null without reconstruction data', () => {
    const { container } = render(
      <ThresholdChromeProvider>
        <Threshold waypoint={{ id: 'x', name: 'Test' }} active />
      </ThresholdChromeProvider>
    )

    expect(container).toBeEmptyDOMElement()
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
