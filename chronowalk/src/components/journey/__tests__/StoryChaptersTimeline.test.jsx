import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import StoryChaptersTimeline from '../StoryChaptersTimeline'

const chapters = [
  { id: '1', number: 1, title: 'The Threshold', summary: 'Begin here.', status: 'complete' },
  { id: '2', number: 2, title: 'Crowds & Empire', summary: 'The roar.', status: 'current' },
  { id: '3', number: 3, title: 'The Architecture', summary: 'Stone and vault.', status: 'upcoming' },
  { id: '4', number: 4, title: 'Gladiators', summary: 'Combat.', status: 'upcoming' },
  { id: '5', number: 5, title: 'Beneath the Arena', summary: 'Below.', status: 'upcoming' },
  { id: '6', number: 6, title: 'What Remains', summary: 'Echoes.', status: 'upcoming' },
]

describe('StoryChaptersTimeline', () => {
  it('renders a vertical chapter timeline with six chapters', () => {
    render(
      <StoryChaptersTimeline
        stopTitle="Colosseum"
        chapters={chapters}
        currentChapterIndex={1}
        onSelectChapter={vi.fn()}
        onBack={vi.fn()}
      />
    )

    expect(screen.getByTestId('story-chapters-timeline')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /colosseum/i })).toBeInTheDocument()
    expect(screen.getAllByText(/chapter \d/i)).toHaveLength(6)
    expect(screen.getByText('Crowds & Empire')).toBeInTheDocument()
    expect(screen.getByText('Replay')).toBeInTheDocument()
  })

  it('supports quick replay and chapter selection', () => {
    const onSelectChapter = vi.fn()

    render(
      <StoryChaptersTimeline
        stopTitle="Colosseum"
        chapters={chapters}
        currentChapterIndex={1}
        onSelectChapter={onSelectChapter}
        onBack={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /the threshold/i }))
    expect(onSelectChapter).toHaveBeenCalledWith(chapters[0], 0)
  })
})
