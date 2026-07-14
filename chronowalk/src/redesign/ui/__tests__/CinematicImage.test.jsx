import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CinematicImage } from '../CinematicImage.jsx'
import {
  IMAGE_ASPECT,
  IMAGE_GRADE,
  IMAGE_OVERLAY,
  IMAGE_POSITION,
  IMAGE_RADIUS,
  IMAGE_SHADOW,
} from '../cinematicImage.js'

describe('cinematicImage tokens', () => {
  it('defines radius, aspect, grade, overlay, position, and shadow scales', () => {
    expect(IMAGE_RADIUS.md).toBe(12)
    expect(IMAGE_ASPECT.landscape).toBe('4 / 3')
    expect(IMAGE_ASPECT.cinema).toContain('2.39')
    expect(IMAGE_GRADE.film).toContain('saturate')
    expect(IMAGE_OVERLAY.soft).toBe('soft')
    expect(IMAGE_POSITION.landmark).toContain('28%')
    expect(IMAGE_SHADOW.still).toContain('rgba')
  })

  it('keeps film grade below tourist vibrance', () => {
    expect(IMAGE_GRADE.film).toMatch(/saturate\(0\.[0-8]/)
    expect(IMAGE_GRADE.dusk).toMatch(/brightness\(0\.[0-8]/)
  })
})

describe('CinematicImage', () => {
  it('renders a cinematic frame with skeleton and media', () => {
    render(<CinematicImage src="/photo.jpg" alt="Forum" />)
    const frame = screen.getByTestId('cinematic-image')
    expect(frame).toHaveClass('cw-cine-image')
    expect(frame).toHaveClass('cw-cine-image--overlay-soft')
    expect(frame).toHaveClass('cw-cine-image--loading')
    expect(screen.getByAltText('Forum')).toBeInTheDocument()
  })

  it('fades in after load', () => {
    const { container } = render(<CinematicImage src="/photo.jpg" alt="" />)
    const img = container.querySelector('.cw-cine-image__media')
    fireEvent.load(img)
    expect(screen.getByTestId('cinematic-image')).toHaveClass('cw-cine-image--loaded')
  })

  it('applies radius and shadow from tokens', () => {
    render(<CinematicImage src="/photo.jpg" radius="lg" shadow="deep" />)
    const frame = screen.getByTestId('cinematic-image')
    expect(frame.style.borderRadius).toBe(`${IMAGE_RADIUS.lg}px`)
    expect(frame.style.boxShadow).toBe(IMAGE_SHADOW.deep)
  })
})
