import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import LandingPersonas from '../v4/LandingPersonas.jsx'

describe('LandingPersonas real-moment carousel', () => {
  it('renders situation slides in a horizontal carousel', () => {
    render(<LandingPersonas />)

    expect(screen.getByRole('heading', { level: 2, name: /reliable companion/i })).toBeInTheDocument()
    const scroller = document.querySelector('.cw-v4-personas__scroller')
    expect(scroller).toBeTruthy()
    expect(scroller?.getAttribute('aria-roledescription')).toBe('carousel')
    expect(document.querySelectorAll('.cw-v4-persona-slide').length).toBe(5)
    expect(
      document.querySelector('.cw-v4-persona-slide__image[src="/landing/real-moment/wander.jpg"]'),
    ).toBeTruthy()
    expect(
      document.querySelector(
        '.cw-v4-persona-slide__image[src="/waypoints/fontana-di-trevi/modern-poster.jpg"]',
      ),
    ).toBeTruthy()
  })

  it('keeps the preview CTA wired for the history slide', () => {
    const onPreview = vi.fn()
    render(<LandingPersonas onPreview={onPreview} />)

    fireEvent.click(screen.getByRole('button', { name: /sneak peek|free/i }))
    expect(onPreview).toHaveBeenCalledTimes(1)
  })

  it('preserves the who-its-for deeplink id', () => {
    render(<LandingPersonas />)
    expect(document.getElementById('who-its-for')).toBeTruthy()
  })
})
