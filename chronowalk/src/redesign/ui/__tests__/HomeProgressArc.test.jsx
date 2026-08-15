import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import HomeProgressArc from '../HomeProgressArc.jsx'

function renderArc(props) {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <HomeProgressArc {...props} />
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('HomeProgressArc', () => {
  it('shows stop count, circular percent, and skipped beads without phase labels', () => {
    renderArc({
      completed: 5,
      total: 21,
      percent: 48,
      currentStopTitle: 'Pantheon',
      stops: [
        ...Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, status: 'completed' })),
        { id: 'skip', status: 'skipped' },
        { id: 'cur', status: 'current' },
        ...Array.from({ length: 15 }, (_, i) => ({ id: `u${i}`, status: 'upcoming' })),
      ],
    })

    expect(screen.getByText(/5 of 21 stops|5 de 21 paradas|5 of 19 stops|5 de 19 paradas/i)).toBeInTheDocument()
    expect(screen.getByTestId('home-progress-percent')).toHaveTextContent('48%')
    expect(screen.getByText(/now at pantheon|ahora en pantheon/i)).toBeInTheDocument()
    expect(screen.queryByText(/just beginning|recién|middle|mitad|ending|final/i)).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-status="skipped"]')).toHaveLength(1)
  })

  it('renders zero progress cleanly', () => {
    renderArc({ completed: 0, total: 21, percent: 0, stops: [] })
    expect(screen.getByText(/0 of 21 stops|0 de 21 paradas/i)).toBeInTheDocument()
    expect(screen.getByTestId('home-progress-percent')).toHaveTextContent('0%')
  })

  it('scratches skipped beads', () => {
    renderArc({
      completed: 3,
      total: 21,
      percent: 20,
      stops: [
        { id: 'c1', status: 'completed' },
        { id: 'c2', status: 'completed' },
        { id: 'c3', status: 'completed' },
        { id: 'skip', status: 'skipped' },
        { id: 'cur', status: 'current' },
        ...Array.from({ length: 16 }, (_, i) => ({ id: `u${i}`, status: 'upcoming' })),
      ],
    })
    const skipped = document.querySelector('[data-status="skipped"]')
    expect(skipped).toBeTruthy()
    expect(skipped.style.opacity).toBe('0.45')
  })
})
