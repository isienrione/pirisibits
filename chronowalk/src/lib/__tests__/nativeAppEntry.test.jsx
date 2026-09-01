import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { grantTestAccess } from '../../test/grantTestAccess.js'
import { RequireAccess, RequireAppShell } from '../requireAccess.jsx'
import { clearLocalAccessState } from '../accessSession.js'
import { clearGuestSession, completeCurrentNativeOnboarding, startNativeGuestExploration } from '../guestSession.js'
import {
  NativePublicLandingRoute,
  getNativeRootRedirect,
  resolveNativeRootEntry,
  shouldSkipNativeA2hs,
} from '../nativeAppEntry.jsx'

const capacitor = vi.hoisted(() => ({
  platform: 'web',
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => capacitor.platform,
    isNativePlatform: () => capacitor.platform !== 'web',
  },
}))

function renderNativeEntry(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/"
          element={
            <NativePublicLandingRoute>
              <div>MARKETING LANDING</div>
            </NativePublicLandingRoute>
          }
        />
        <Route
          path="/home"
          element={
            <RequireAppShell requireOnboardedGuest>
              <div>HOME</div>
            </RequireAppShell>
          }
        />
        <Route path="/welcome" element={<div>WELCOME</div>} />
        <Route path="/access" element={<div>ACCESS</div>} />
        <Route
          path="/setup"
          element={
            <RequireAppShell>
              <div>SETUP</div>
            </RequireAppShell>
          }
        />
        <Route
          path="/context"
          element={
            <RequireAppShell>
              <div>CONTEXT</div>
            </RequireAppShell>
          }
        />
        <Route
          path="/journey"
          element={
            <RequireAppShell requireOnboardedGuest>
              <div>JOURNEY</div>
            </RequireAppShell>
          }
        />
        <Route
          path="/map"
          element={
            <RequireAppShell requireOnboardedGuest>
              <div>MAP</div>
            </RequireAppShell>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAppShell requireOnboardedGuest>
              <div>SETTINGS</div>
            </RequireAppShell>
          }
        />
        <Route
          path="/tour"
          element={
            <RequireAccess>
              <div>TOUR</div>
            </RequireAccess>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('native iOS product entry', () => {
  beforeEach(() => {
    capacitor.platform = 'web'
    localStorage.clear()
    clearLocalAccessState()
    clearGuestSession()
  })

  it('leaves web "/" on the marketing landing', () => {
    expect(getNativeRootRedirect()).toBeNull()
    expect(resolveNativeRootEntry()).toEqual({ path: null, reason: 'web' })
    renderNativeEntry('/')
    expect(screen.getByText('MARKETING LANDING')).toBeInTheDocument()
    expect(screen.queryByText('HOME')).not.toBeInTheDocument()
    expect(screen.queryByText('ACCESS')).not.toBeInTheDocument()
    expect(screen.queryByText('WELCOME')).not.toBeInTheDocument()
  })

  it('sends native iOS "/" with a valid entitlement to /home without painting marketing', () => {
    capacitor.platform = 'ios'
    grantTestAccess()

    expect(getNativeRootRedirect()).toBe('/home')
    expect(resolveNativeRootEntry().reason).toBe('entitled')
    renderNativeEntry('/')

    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
    expect(screen.getByText('HOME')).toBeInTheDocument()
  })

  it('sends native iOS first run "/" to /welcome without painting marketing', () => {
    capacitor.platform = 'ios'

    expect(getNativeRootRedirect()).toBe('/welcome')
    expect(resolveNativeRootEntry().reason).toBe('first-run')
    renderNativeEntry('/')

    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
    expect(screen.getByText('WELCOME')).toBeInTheDocument()
    expect(screen.queryByText('ACCESS')).not.toBeInTheDocument()
  })

  it('sends a returning native guest "/" to /home', () => {
    capacitor.platform = 'ios'
    startNativeGuestExploration()
    completeCurrentNativeOnboarding()

    expect(getNativeRootRedirect()).toBe('/home')
    expect(resolveNativeRootEntry().reason).toBe('guest')
    renderNativeEntry('/')

    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
    expect(screen.getByText('HOME')).toBeInTheDocument()
  })

  it('sends an old onboarded guest with incomplete current Context to /context', () => {
    capacitor.platform = 'ios'
    startNativeGuestExploration()
    const raw = JSON.parse(localStorage.getItem('cw_guest_v1'))
    raw.onboardingCompleted = true
    raw.onboardingFlowVersion = 1
    raw.context = { interestIds: ['architecture'], timeBudgetId: '30min' }
    localStorage.setItem('cw_guest_v1', JSON.stringify(raw))

    expect(getNativeRootRedirect()).toBe('/context')
    expect(resolveNativeRootEntry().reason).toBe('context')
  })

  it('resumes incomplete native Context instead of Welcome', () => {
    capacitor.platform = 'ios'
    startNativeGuestExploration()

    expect(getNativeRootRedirect()).toBe('/context')
    expect(resolveNativeRootEntry().reason).toBe('context')
    renderNativeEntry('/')
    expect(screen.getByText('CONTEXT')).toBeInTheDocument()
  })

  it('lets a native guest reach /home without a paid entitlement', async () => {
    capacitor.platform = 'ios'
    startNativeGuestExploration()
    completeCurrentNativeOnboarding({ session: { availableTimeNow: '1h' } })
    renderNativeEntry('/home')

    expect(await screen.findByText('HOME')).toBeInTheDocument()
    expect(screen.queryByText('ACCESS')).not.toBeInTheDocument()
    expect(screen.queryByText('JOURNEY')).not.toBeInTheDocument()
  })

  it('lets a native guest open Map and Settings', async () => {
    capacitor.platform = 'ios'
    startNativeGuestExploration()
    completeCurrentNativeOnboarding({ traveler: { positiveInterestIds: ['art'] }, session: { availableTimeNow: '2h' } })

    renderNativeEntry('/map')
    expect(await screen.findByText('MAP')).toBeInTheDocument()
    expect(screen.queryByText('ACCESS')).not.toBeInTheDocument()

    renderNativeEntry('/settings')
    expect(await screen.findByText('SETTINGS')).toBeInTheDocument()
    expect(screen.queryByText('ACCESS')).not.toBeInTheDocument()
  })

  it('lets an onboarded native guest enter /journey without a paid credential', async () => {
    capacitor.platform = 'ios'
    startNativeGuestExploration()
    completeCurrentNativeOnboarding()
    renderNativeEntry('/journey')

    expect(await screen.findByText('JOURNEY')).toBeInTheDocument()
    expect(screen.queryByText('ACCESS')).not.toBeInTheDocument()
  })

  it('keeps native /access directly reachable', () => {
    capacitor.platform = 'ios'
    renderNativeEntry('/access')

    expect(screen.getByText('ACCESS')).toBeInTheDocument()
    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
  })

  it('does not replace native internal routes; RequireAccess still gates /tour', async () => {
    capacitor.platform = 'ios'

    renderNativeEntry('/tour')

    await waitFor(() => {
      expect(screen.getByText('ACCESS')).toBeInTheDocument()
    })
    expect(screen.queryByText('TOUR')).not.toBeInTheDocument()
    expect(screen.queryByText('HOME')).not.toBeInTheDocument()
    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
  })

  it('lets an entitled native session stay on /map instead of forcing /home', async () => {
    capacitor.platform = 'ios'
    grantTestAccess()

    renderNativeEntry('/map')

    await waitFor(() => {
      expect(screen.getByText('MAP')).toBeInTheDocument()
    })
    expect(screen.queryByText('HOME')).not.toBeInTheDocument()
    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
  })

  it('skips A2HS only on native iOS', () => {
    capacitor.platform = 'web'
    expect(shouldSkipNativeA2hs()).toBe(false)

    capacitor.platform = 'ios'
    expect(shouldSkipNativeA2hs()).toBe(true)
  })

  it('does not apply guest-first routing on web even if a guest blob exists', () => {
    startNativeGuestExploration()
    capacitor.platform = 'web'

    expect(getNativeRootRedirect()).toBeNull()
    renderNativeEntry('/')
    expect(screen.getByText('MARKETING LANDING')).toBeInTheDocument()
  })

  it('keeps web /home behind paid access', async () => {
    capacitor.platform = 'web'
    renderNativeEntry('/home')

    await waitFor(() => {
      expect(screen.getByText('ACCESS')).toBeInTheDocument()
    })
    expect(screen.queryByText('HOME')).not.toBeInTheDocument()
  })
})
