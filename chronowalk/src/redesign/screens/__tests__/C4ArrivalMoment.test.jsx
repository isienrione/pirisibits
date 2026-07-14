import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import C4ArrivalMoment from '../C4ArrivalMoment.jsx'

const beatsState = {
  pause: true,
  dim: true,
  ambient: false,
  drift: true,
  seam: true,
  title: true,
  copy: true,
  cta: false,
  secondary: false,
}

vi.mock('../../motion/useCeremonyTimeline.js', () => ({
  useCeremonyTimeline: () => ({
    beats: beatsState,
    reducedMotion: false,
  }),
}))

vi.mock('../../motion/ceremonyTimelines.js', async (importOriginal) => {
  const actual = await importOriginal()
  return actual
})

describe('C4ArrivalMoment', () => {
  it('holds the CTA until the ceremonial cta beat', () => {
    beatsState.cta = false
    beatsState.secondary = false
    beatsState.ambient = false

    render(
      <C4ArrivalMoment
        title="The Pantheon"
        description="Look up."
        onBeginListening={vi.fn()}
      />,
    )

    expect(screen.getByTestId('arrival-ceremony')).toBeInTheDocument()
    expect(screen.getByText('The Pantheon')).toBeInTheDocument()
    expect(screen.getByTestId('gold-seam-arrival')).toBeInTheDocument()
    expect(screen.queryByTestId('arrival-begin-listening')).not.toBeInTheDocument()
  })

  it('reveals the delayed CTA and fires ambient once', () => {
    const onAtmosphereStart = vi.fn()
    const onBeginListening = vi.fn()
    beatsState.ambient = true
    beatsState.cta = true
    beatsState.secondary = true

    render(
      <C4ArrivalMoment
        title="The Pantheon"
        description="Look up."
        onBeginListening={onBeginListening}
        onAtmosphereStart={onAtmosphereStart}
        onTranscript={vi.fn()}
      />,
    )

    expect(onAtmosphereStart).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('arrival-begin-listening')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('arrival-begin-listening'))
    expect(onBeginListening).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /read instead/i })).toBeInTheDocument()
  })
})
