import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const claimFamilySeat = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../../lib/familyWalk.js', async () => {
  const actual = await vi.importActual('../../../lib/familyWalk.js')
  return {
    ...actual,
    claimFamilySeat: (...args) => claimFamilySeat(...args),
  }
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../../lib/appEntry.js', () => ({
  getAppHomePath: () => '/journey',
  isAppEntryComplete: () => true,
}))

vi.mock('../../../state/journey.js', () => ({
  isResumableJourney: () => false,
}))

import { InvitePage } from '../InvitePage.jsx'

const LOWER_HEX = 'a1b2c3d4e5f6789012345678abcdef01'

function renderInvite(path = '/invite') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/invite" element={<InvitePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('InvitePage invite case handling', () => {
  beforeEach(() => {
    claimFamilySeat.mockReset()
    mockNavigate.mockReset()
    claimFamilySeat.mockResolvedValue({ ok: true })
  })

  it('loads URL invite without destructively uppercasing application state', () => {
    renderInvite(`/invite?code=${LOWER_HEX}`)
    const input = screen.getByPlaceholderText(/paste invite code/i)
    expect(input.value).toBe(LOWER_HEX)
    expect(input.value).not.toBe(LOWER_HEX.toUpperCase())
  })

  it('preserves typed case in state while CSS may style uppercase visually', () => {
    renderInvite('/invite')
    const input = screen.getByPlaceholderText(/paste invite code/i)
    fireEvent.change(input, { target: { value: 'AbCdEf0123456789abcdef0123456789' } })
    expect(input.value).toBe('AbCdEf0123456789abcdef0123456789')
    expect(getComputedStyle(input).textTransform).toBe('uppercase')
  })

  it('submits a canonical lowercase invite and never logs the secret', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    renderInvite(`/invite?code=${LOWER_HEX}`)
    fireEvent.click(screen.getByRole('button', { name: /join the walk/i }))

    await waitFor(() => {
      expect(claimFamilySeat).toHaveBeenCalledWith({
        inviteCode: LOWER_HEX,
        displayName: 'Walker',
      })
    })

    const joined = [...logSpy.mock.calls, ...warnSpy.mock.calls, ...infoSpy.mock.calls]
      .flat()
      .map(String)
      .join(' ')
    expect(joined).not.toContain(LOWER_HEX)
    expect(joined).not.toContain(LOWER_HEX.toUpperCase())

    logSpy.mockRestore()
    warnSpy.mockRestore()
    infoSpy.mockRestore()
  })

  it('canonicalizes mixed-case + whitespace on submit', async () => {
    renderInvite('/invite')
    const input = screen.getByPlaceholderText(/paste invite code/i)
    fireEvent.change(input, {
      target: { value: `  ${LOWER_HEX.toUpperCase().slice(0, 8)}${LOWER_HEX.slice(8)}  ` },
    })
    fireEvent.click(screen.getByRole('button', { name: /join the walk/i }))

    await waitFor(() => {
      expect(claimFamilySeat).toHaveBeenCalledWith({
        inviteCode: LOWER_HEX,
        displayName: 'Walker',
      })
    })
  })
})
