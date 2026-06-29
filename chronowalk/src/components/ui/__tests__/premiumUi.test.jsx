import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EditorialTitle } from '../EditorialTitle'
import { ParchmentCard } from '../ParchmentCard'
import { BronzeButton } from '../BronzeButton'
import { TimeFractureHandle } from '../TimeFractureSlider'

describe('EditorialTitle', () => {
  it('renders headline with eyebrow and italic highlight', () => {
    render(
      <EditorialTitle eyebrow="ChronoWalk" italicHighlight="80 AD" subtitle="A subtitle">
        Pantheon
      </EditorialTitle>
    )

    expect(screen.getByText('ChronoWalk')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /pantheon 80 ad/i })).toBeInTheDocument()
    expect(screen.getByText('A subtitle')).toBeInTheDocument()
  })
})

describe('ParchmentCard', () => {
  it('renders children with museum-plaque surface', () => {
    render(<ParchmentCard>Exhibit label</ParchmentCard>)
    expect(screen.getByText('Exhibit label')).toBeInTheDocument()
  })
})

describe('BronzeButton', () => {
  it('renders as a button', () => {
    render(<BronzeButton>Start tour</BronzeButton>)
    expect(screen.getByRole('button', { name: /start tour/i })).toBeInTheDocument()
  })
})

describe('TimeFractureHandle', () => {
  it('renders compare handle affordance', () => {
    const { container } = render(<TimeFractureHandle />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
