import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import RedesignWelcomePage from '../RedesignWelcomePage.jsx'

function renderWelcomeRoute(initialPath = '/welcome') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/welcome" element={<RedesignWelcomePage />} />
        <Route path="/setup" element={<main>Make it yours</main>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RedesignWelcomePage', () => {
  it('redirects /welcome to /setup', async () => {
    renderWelcomeRoute()

    expect(await screen.findByText('Make it yours')).toBeInTheDocument()
  })
})
