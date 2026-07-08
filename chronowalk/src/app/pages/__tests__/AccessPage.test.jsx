import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccessPage } from '../AccessPage'
import { ACCESS_KEY } from '../../../lib/config'
import { JOURNEY_STATES, transitionJourney } from '../../../state/journey'

const validateMock = vi.fn()

vi.mock('../../../lib/access', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    validateAccessToken: (...args) => validateMock(...args),
  }
})

function renderAccessPage(initialEntry = '/access') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/access" element={<AccessPage />} />
        <Route path="/welcome" element={<div>Welcome route</div>} />
        <Route path="/begin" element={<div>Begin route</div>} />
        <Route path="/journey" element={<div>Journey route</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AccessPage', () => {
  beforeEach(() => {
    localStorage.clear()
    transitionJourney(JOURNEY_STATES.IDLE)
    validateMock.mockReset()
  })

  it('sends owners without saved progress into onboarding at welcome', () => {
    localStorage.setItem(ACCESS_KEY, 'true')

    renderAccessPage()

    expect(screen.getByText('Welcome route')).toBeInTheDocument()
  })

  it('offers resume to owners with a real in-progress journey', () => {
    localStorage.setItem(ACCESS_KEY, 'true')
    transitionJourney(JOURNEY_STATES.WALKING, { currentSequenceIndex: 3 })

    renderAccessPage()

    expect(screen.getByText('Begin route')).toBeInTheDocument()
  })

  it('grants access and sends first-time purchasers to welcome', async () => {
    validateMock.mockResolvedValue({ ok: true, source: 'dev' })

    renderAccessPage('/access?token=dev')

    await waitFor(() => {
      expect(screen.getByText('Welcome route')).toBeInTheDocument()
    })

    expect(localStorage.getItem(ACCESS_KEY)).toBe('true')
  })

  it('shows restore UI when token validation fails', async () => {
    validateMock.mockResolvedValue({ ok: false, reason: 'invalid_format' })

    renderAccessPage('/access?token=bad-token')

    expect(await screen.findByText(/this link is not valid/i)).toBeInTheDocument()
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
  })
})
