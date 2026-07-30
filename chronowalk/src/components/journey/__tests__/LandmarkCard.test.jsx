import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import LandmarkCard from '../LandmarkCard'

const stop = {
  id: 'colosseum',
  number: 1,
  title: 'The Colosseum',
  shortTitle: 'Colosseum',
  subtitle: 'Ancient Rome awaits — choose how you want to explore.',
  heroImage: '/waypoints/colosseum/exterior/modern-poster.jpg',
  transcript: 'The Colosseum rises where emperors once commanded the city.',
}

describe('LandmarkCard', () => {
  it('renders immersion landmark photography and minimal introduction', () => {
    render(
      <LandmarkCard stop={stop} onBeginStory={vi.fn()} onSeeAncientRome={vi.fn()} />
    )

    expect(screen.getByTestId('landmark-card')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /colosseum/i })).toBeInTheDocument()
    expect(screen.getByText(stop.subtitle)).toBeInTheDocument()
    expect(screen.getByText('Stop 1')).toBeInTheDocument()
  })

  it('exposes the three landmark actions with minimal chrome', () => {
    const onBeginStory = vi.fn()
    const onSeeAncientRome = vi.fn()

    render(
      <LandmarkCard
        stop={stop}
        onBeginStory={onBeginStory}
        onSeeAncientRome={onSeeAncientRome}
      />
    )

    expect(screen.getByRole('button', { name: /begin story/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /see ancient rome/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Transcript' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /begin story/i }))
    fireEvent.click(screen.getByRole('button', { name: /see ancient rome/i }))

    expect(onBeginStory).toHaveBeenCalledTimes(1)
    expect(onSeeAncientRome).toHaveBeenCalledTimes(1)
  })

  it('opens transcript in a sheet', async () => {
    render(
      <LandmarkCard stop={stop} onBeginStory={vi.fn()} onSeeAncientRome={vi.fn()} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Transcript' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /colosseum/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(stop.transcript)).toBeInTheDocument()
    })
  })
})
