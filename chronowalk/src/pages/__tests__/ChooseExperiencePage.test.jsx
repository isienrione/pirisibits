import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ChooseExperiencePage from '../ChooseExperiencePage'
import { ROUTES } from '../../routes/paths'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

function renderRomeExperience() {
  return render(
    <MemoryRouter initialEntries={['/begin/rome/experience']}>
      <Routes>
        <Route path="/begin/:destinationId/experience" element={<ChooseExperiencePage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ChooseExperiencePage', () => {
  beforeEach(() => {
    navigate.mockClear()
  })

  it('renders three immersive experience cards', () => {
    renderRomeExperience()

    expect(screen.getByRole('heading', { level: 1, name: /choose your experience/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /the classic split/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /the heroic day/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /your own pace/i })).toBeInTheDocument()
    expect(screen.getByText('2 days')).toBeInTheDocument()
    expect(screen.getByText('8 hours')).toBeInTheDocument()
    expect(screen.getByText('No limit')).toBeInTheDocument()
  })

  it('selects an experience card without radio inputs', () => {
    renderRomeExperience()

    expect(screen.queryByRole('radio')).not.toBeInTheDocument()

    const heroicDay = screen.getByRole('button', { name: /the heroic day/i })
    fireEvent.click(heroicDay)
    expect(heroicDay).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /the classic split/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('continues to journey with selected experience', () => {
    renderRomeExperience()

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.journey, { replace: true })
  })
})
