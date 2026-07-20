import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import StoryTranscriptReader from '../StoryTranscriptReader'

const paragraphs = [
  { id: 'p1', text: 'You are standing before the Colosseum.', startProgress: 0 },
  { id: 'p2', text: 'Fifty thousand spectators could take their seats.', startProgress: 0.5 },
]

describe('StoryTranscriptReader', () => {
  it('renders an editorial transcript with highlighted current paragraph', () => {
    render(
      <StoryTranscriptReader
        stopTitle="Colosseum"
        paragraphs={paragraphs}
        currentParagraphIndex={1}
        bookmarkedIds={['p1']}
        onToggleBookmark={vi.fn()}
        onBack={vi.fn()}
      />
    )

    expect(screen.getByTestId('story-transcript-reader')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /colosseum/i })).toBeInTheDocument()
    expect(screen.getByText('Bookmarks')).toBeInTheDocument()
    expect(screen.getByText(paragraphs[1].text)).toBeInTheDocument()
    expect(screen.getByText(paragraphs[1].text).closest('[aria-current="true"]')).toBeTruthy()
  })

  it('supports bookmark toggles', () => {
    const onToggleBookmark = vi.fn()

    render(
      <StoryTranscriptReader
        stopTitle="Colosseum"
        paragraphs={paragraphs}
        currentParagraphIndex={0}
        bookmarkedIds={[]}
        onToggleBookmark={onToggleBookmark}
        onBack={vi.fn()}
      />
    )

    fireEvent.click(screen.getAllByRole('button', { name: /bookmark paragraph/i })[0])
    expect(onToggleBookmark).toHaveBeenCalledWith('p1')
  })
})
