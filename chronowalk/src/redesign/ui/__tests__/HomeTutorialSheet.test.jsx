import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import HomeTutorialSheet, { HOME_TUTORIAL_PHASES } from '../HomeTutorialSheet.jsx'

describe('HomeTutorialSheet', () => {
  it('walks through colorful coaching steps with control cues', () => {
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
    expect(screen.getByTestId('home-tutorial-cue-walk')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('home-tutorial-next'))
    expect(screen.getByRole('heading', { name: /i.?m here|estoy aquí/i })).toBeInTheDocument()
    expect(screen.getByTestId('home-tutorial-cue-arrive')).toBeInTheDocument()
  })

  it('ends with a settings gear tip after the walk phases', () => {
    const onClose = vi.fn()
    expect(HOME_TUTORIAL_PHASES.at(-1)).toBe('settings')

    render(
      <MemoryRouter>
        <I18nProvider>
          <HomeTutorialSheet open onClose={onClose} />
        </I18nProvider>
      </MemoryRouter>,
    )

    for (let i = 0; i < HOME_TUTORIAL_PHASES.length - 1; i += 1) {
      fireEvent.click(screen.getByTestId('home-tutorial-next'))
    }

    expect(screen.getByText(/tap the gear|toca el engranaje/i)).toBeInTheDocument()
    expect(screen.getByTestId('home-tutorial-cue-settings')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('home-tutorial-next'))
    expect(onClose).toHaveBeenCalled()
  })
})
