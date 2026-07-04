import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AncientReconstructionExplorer from '../AncientReconstructionExplorer'

const hotspots = [
  {
    id: 'velarium',
    x: 0.5,
    y: 0.2,
    label: 'Velarium',
    title: 'The velarium',
    era: 'c. 80 AD',
    body: 'A vast awning shielded spectators from the Roman sun.',
  },
]

describe('AncientReconstructionExplorer', () => {
  it('renders a full-screen ancient reconstruction canvas', () => {
    render(
      <AncientReconstructionExplorer
        stopTitle="Colosseum"
        imageUrl="/ancient.jpg"
        hotspots={hotspots}
        onContinue={vi.fn()}
      />
    )

    expect(screen.getByTestId('ancient-reconstruction-explorer')).toBeInTheDocument()
    expect(screen.getByAltText(/ancient reconstruction of colosseum/i)).toBeInTheDocument()
    expect(screen.getByText(/pinch to explore/i)).toBeInTheDocument()
  })

  it('opens a context card when a hotspot is selected', () => {
    render(
      <AncientReconstructionExplorer
        stopTitle="Colosseum"
        imageUrl="/ancient.jpg"
        hotspots={hotspots}
        onContinue={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /the velarium/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /the velarium/i })).toBeInTheDocument()
    expect(screen.getByText(/vast awning/i)).toBeInTheDocument()
  })

  it('requests continue when the journey button is pressed', () => {
    const onContinue = vi.fn()

    render(
      <AncientReconstructionExplorer
        stopTitle="Colosseum"
        imageUrl="/ancient.jpg"
        hotspots={hotspots}
        onContinue={onContinue}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /continue journey/i }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
