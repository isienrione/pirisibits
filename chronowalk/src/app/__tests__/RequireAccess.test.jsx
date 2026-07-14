import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RequireAccess from '../RequireAccess.jsx'
import { ACCESS_KEY } from '../../lib/config.js'

describe('RequireAccess', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('blocks unpaid visitors from tour routes', () => {
    render(
      <MemoryRouter initialEntries={['/tour']}>
        <Routes>
          <Route
            path="/tour"
            element={
              <RequireAccess>
                <div>Tour unlocked</div>
              </RequireAccess>
            }
          />
          <Route path="/purchase" element={<div>Purchase gate</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Purchase gate')).toBeInTheDocument()
    expect(screen.queryByText('Tour unlocked')).not.toBeInTheDocument()
  })

  it('allows purchased visitors through', () => {
    localStorage.setItem(ACCESS_KEY, 'true')

    render(
      <MemoryRouter initialEntries={['/tour']}>
        <Routes>
          <Route
            path="/tour"
            element={
              <RequireAccess>
                <div>Tour unlocked</div>
              </RequireAccess>
            }
          />
          <Route path="/purchase" element={<div>Purchase gate</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Tour unlocked')).toBeInTheDocument()
  })
})
