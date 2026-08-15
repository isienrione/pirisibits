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
  it('labels the middle of the tour symbolically', () => {
    renderArc({ completed: 5, total: 10, currentStopTitle: 'Pantheon' })
    expect(screen.getByText(/in the middle|a mitad/i)).toBeInTheDocument()
    expect(screen.getByText(/now at pantheon|ahora en pantheon/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/50 percent|50 por ciento/i)).toBeInTheDocument()
  })

  it('labels the beginning when nothing is completed', () => {
    renderArc({ completed: 0, total: 12 })
    expect(screen.getByText(/not started|sin empezar/i)).toBeInTheDocument()
  })
})
