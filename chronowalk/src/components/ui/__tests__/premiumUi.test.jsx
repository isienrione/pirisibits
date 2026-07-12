import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EditorialTitle } from '../EditorialTitle'
import { Button } from '../Button'

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

describe('Button', () => {
  it('renders primary variant', () => {
    render(<Button>Start tour</Button>)
    expect(screen.getByRole('button', { name: /start tour/i })).toBeInTheDocument()
  })

  it('renders quiet variant', () => {
    render(<Button variant="quiet">Cancel</Button>)
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })
})
