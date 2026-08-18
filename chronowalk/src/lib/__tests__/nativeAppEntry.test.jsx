import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { grantTestAccess } from '../../test/grantTestAccess.js'
import { RequireAccess, RequireAppShell } from '../requireAccess.jsx'
import { clearLocalAccessState } from '../accessSession.js'
import { clearGuestSession, startNativeGuestExploration } from '../guestSession.js'
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
          path="/journey"
          element={
            <RequireAccess>
              <div>JOURNEY</div>
            </RequireAccess>
          }
        />
        <Route
          path="/map"
          element={
            <RequireAccess>
              <div>MAP</div>
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

    expect(getNativeRootRedirect()).toBe('/home')
    expect(resolveNativeRootEntry().reason).toBe('guest')
    renderNativeEntry('/')

    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
    expect(screen.getByText('HOME')).toBeInTheDocument()
  })

  it('lets a native guest reach /home without a paid entitlement', async () => {
    capacitor.platform = 'ios'
    startNativeGuestExploration()
    renderNativeEntry('/home')

    expect(await screen.findByText('HOME')).toBeInTheDocument()
    expect(screen.queryByText('ACCESS')).not.toBeInTheDocument()
    expect(screen.queryByText('JOURNEY')).not.toBeInTheDocument()
  })

  it('does not let a native guest consume /journey', async () => {
    capacitor.platform = 'ios'
    startNativeGuestExploration()
    renderNativeEntry('/journey')

    await waitFor(() => {
      expect(screen.getByText('HOME')).toBeInTheDocument()
    })
    expect(screen.queryByText('JOURNEY')).not.toBeInTheDocument()
  })

  it('keeps native /access directly reachable', () => {
    capacitor.platform = 'ios'
    renderNativeEntry('/access')

    expect(screen.getByText('ACCESS')).toBeInTheDocument()
    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
  })

  it('does not replace native internal routes; RequireAccess still gates /journey', async () => {
    capacitor.platform = 'ios'

    renderNativeEntry('/journey')

    await waitFor(() => {
      expect(screen.getByText('ACCESS')).toBeInTheDocument()
    })
    expect(screen.queryByText('JOURNEY')).not.toBeInTheDocument()
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
