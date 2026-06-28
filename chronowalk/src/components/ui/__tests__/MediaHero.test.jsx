import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MediaHero } from '../MediaHero'

vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

describe('MediaHero', () => {
  it('renders an image with readability gradient and zoom treatment', () => {
    const { container } = render(
      <MediaHero
        src="/tour-hero.jpg"
        alt="Rome skyline"
        aspect="16/10"
        rounded="bottom"
        gradient="strong"
        zoom
        fadeIn
      />
    )

    const image = screen.getByRole('img', { name: 'Rome skyline' })
    expect(image).toHaveAttribute('src', '/tour-hero.jpg')
    expect(image.className).toMatch(/animate-hero-ken-burns/)
    expect(container.firstChild.className).toMatch(/rounded-b-3xl/)
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('fades the image in after load', () => {
    const { container } = render(<MediaHero src="/tour-hero.jpg" alt="Rome" fadeIn />)

    const image = container.querySelector('img')
    expect(image.className).toMatch(/opacity-0/)

    fireEvent.load(image)

    expect(image.className).toMatch(/opacity-100/)
  })
})
