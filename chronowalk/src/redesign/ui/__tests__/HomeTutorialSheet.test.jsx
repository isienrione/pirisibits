import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import HomeTutorialSheet from '../HomeTutorialSheet.jsx'

describe('HomeTutorialSheet', () => {
  it('walks through colorful coaching steps', () => {
    const onClose = vi.fn()

    render(
      <MemoryRouter>
        <I18nProvider>
          <HomeTutorialSheet open onClose={onClose} />
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('home-tutorial')).toBeInTheDocument()
    expect(screen.getByText(/follow the route line|sigue la línea/i)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('home-tutorial-next'))
    expect(screen.getByText(/i.?m here|estoy aquí/i)).toBeInTheDocument()
  })
})
