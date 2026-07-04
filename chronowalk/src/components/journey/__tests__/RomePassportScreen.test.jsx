import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import RomePassportScreen from '../RomePassportScreen'

const stamps = [
  { id: 'colosseum', title: 'Colosseum', inscription: 'Arena of Empire', order: 1 },
  { id: 'pantheon', title: 'Pantheon', inscription: 'Dome of Light', order: 2 },
]

describe('RomePassportScreen', () => {
  it('renders an embossed passport spread with collected stamps', () => {
    render(
      <RomePassportScreen
        title="Rome Passport"
        subtitle="A keepsake of the monuments you visited on foot."
        holderName="Livia"
        edition="Ancient Rome · ChronoWalk"
        stamps={stamps}
        onBack={vi.fn()}
      />
    )

    expect(screen.getByTestId('rome-passport-screen')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /rome passport/i })).toBeInTheDocument()
    expect(screen.getByText('Livia')).toBeInTheDocument()
    expect(screen.getByTestId('passport-stamp-colosseum')).toBeInTheDocument()
    expect(screen.getByTestId('passport-stamp-pantheon')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('returns to the timeline and shows an empty collection state', () => {
    const onBack = vi.fn()

    const { rerender } = render(
      <RomePassportScreen
        title="Rome Passport"
        subtitle="A keepsake of the monuments you visited on foot."
        holderName="Marco"
        edition="Ancient Rome · ChronoWalk"
        stamps={stamps}
        onBack={onBack}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /back to your timeline/i }))
    expect(onBack).toHaveBeenCalledTimes(1)

    rerender(
      <RomePassportScreen
        title="Rome Passport"
        subtitle="A keepsake of the monuments you visited on foot."
        holderName="Marco"
        edition="Ancient Rome · ChronoWalk"
        stamps={[]}
        onBack={onBack}
      />
    )

    expect(screen.getByText(/passport is ready/i)).toBeInTheDocument()
  })
})
