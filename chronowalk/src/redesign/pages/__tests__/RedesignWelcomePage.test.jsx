import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import { grantTestAccess } from '../../../test/grantTestAccess.js'
import { clearLocalAccessState } from '../../../lib/accessSession.js'
import {
  clearGuestSession,
  hasCompletedGuestOnboarding,
  readGuestSession,
} from '../../../lib/guestSession.js'
import RedesignWelcomePage from '../RedesignWelcomePage.jsx'

const capacitor = vi.hoisted(() => ({
  platform: 'web',
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => capacitor.platform,
    isNativePlatform: () => capacitor.platform !== 'web',
  },
}))

function renderWelcome() {
  return render(
    <MemoryRouter initialEntries={['/welcome']}>
      <I18nProvider>
        <Routes>
          <Route path="/welcome" element={<RedesignWelcomePage />} />
          <Route path="/setup" element={<div>SETUP CONTEXT</div>} />
          <Route path="/access" element={<div>ACCESS</div>} />
          <Route path="/home" element={<div>HOME</div>} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('native Welcome', () => {
  beforeEach(() => {
    capacitor.platform = 'web'
    localStorage.clear()
    clearLocalAccessState()
    clearGuestSession()
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue()
    HTMLMediaElement.prototype.pause = vi.fn()
  })

  it('keeps web /welcome as a hop into existing setup', () => {
    renderWelcome()
    expect(screen.getByText('SETUP CONTEXT')).toBeInTheDocument()
    expect(screen.queryByTestId('native-welcome')).not.toBeInTheDocument()
  })

  it('paints native first-run Welcome without pricing, email, or access forms', () => {
    capacitor.platform = 'ios'
    renderWelcome()

    expect(screen.getByTestId('native-welcome')).toBeInTheDocument()
    expect(screen.getByTestId('native-welcome-start')).toHaveTextContent(/start exploring/i)
    expect(screen.getByTestId('native-welcome-access')).toHaveTextContent(/already have access/i)
    expect(screen.queryByText(/paddle/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/transaction/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument()
  })

  it('Start exploring initializes guest state and enters existing Context/setup', () => {
    capacitor.platform = 'ios'
    renderWelcome()

    fireEvent.click(screen.getByTestId('native-welcome-start'))

    expect(hasCompletedGuestOnboarding()).toBe(true)
    expect(readGuestSession()?.id).toMatch(/^cw_guest_/)
    expect(screen.getByText('SETUP CONTEXT')).toBeInTheDocument()
  })

  it('I already have access keeps /access reachable', () => {
    capacitor.platform = 'ios'
    renderWelcome()

    fireEvent.click(screen.getByTestId('native-welcome-access'))

    expect(screen.getByText('ACCESS')).toBeInTheDocument()
    expect(hasCompletedGuestOnboarding()).toBe(false)
  })

  it('skips Welcome for an entitled native traveler', () => {
    capacitor.platform = 'ios'
    grantTestAccess()
    renderWelcome()

    expect(screen.getByText('HOME')).toBeInTheDocument()
    expect(screen.queryByTestId('native-welcome')).not.toBeInTheDocument()
  })
})
