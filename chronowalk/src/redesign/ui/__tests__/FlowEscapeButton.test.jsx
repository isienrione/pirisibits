import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import FlowEscapeButton from '../FlowEscapeButton.jsx'
import { JOURNEY_STATES, resetJourney, transitionJourney } from '../../../state/journey.js'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../../lib/config.js', () => ({
  hasAccess: () => true,
}))

function renderOn(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<FlowEscapeButton />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FlowEscapeButton', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    resetJourney()
    transitionJourney(JOURNEY_STATES.IDLE)
  })

  it('hides on native-owned product flows that use NativePageHeader', () => {
    for (const path of ['/welcome', '/context', '/plan', '/route', '/walk', '/arrive', '/next']) {
      const { unmount } = renderOn(path)
      expect(screen.queryByTestId('flow-escape-back')).not.toBeInTheDocument()
      unmount()
    }
  })

  it('hides on Home / Tour / Map / Journal tab roots so it cannot cover those headers', () => {
    for (const path of ['/home', '/tour', '/map', '/journal']) {
      const { unmount } = renderOn(path)
      expect(screen.queryByTestId('flow-escape-back')).not.toBeInTheDocument()
      unmount()
    }
  })

  it('renders a compact icon-only control on begin', () => {
    renderOn('/begin')
    const button = screen.getByTestId('flow-escape-back')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'Go back')
    expect(button.textContent.trim()).toBe('')
  })

  it('goes to the previous history entry from the walk screen instead of forcing Home', () => {
    transitionJourney(JOURNEY_STATES.WALKING)
    const lengthDescriptor = Object.getOwnPropertyDescriptor(window.history, 'length')
    Object.defineProperty(window.history, 'length', { configurable: true, value: 3 })

    renderOn('/journey')
    fireEvent.click(screen.getByTestId('flow-escape-back'))

    expect(mockNavigate).toHaveBeenCalledWith(-1)
    expect(mockNavigate).not.toHaveBeenCalledWith('/home', expect.anything())

    if (lengthDescriptor) Object.defineProperty(window.history, 'length', lengthDescriptor)
    else delete window.history.length
  })

  it('falls back to Home only when there is no history to rewind', () => {
    transitionJourney(JOURNEY_STATES.WALKING)
    const lengthDescriptor = Object.getOwnPropertyDescriptor(window.history, 'length')
    Object.defineProperty(window.history, 'length', { configurable: true, value: 1 })

    renderOn('/journey')
    fireEvent.click(screen.getByTestId('flow-escape-back'))

    expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true })

    if (lengthDescriptor) Object.defineProperty(window.history, 'length', lengthDescriptor)
    else delete window.history.length
  })
})
