import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import JourneyMemoriesScreen from '../JourneyMemoriesScreen'
import { MEMORY_SECTIONS } from '../../../content/launchJourneyMemories'

const archive = {
  title: 'Memories',
  subtitle: 'A personal archive of the path you walked, heard, and kept.',
  places: [{ id: 'colosseum', title: 'Colosseum', line: 'Where an empire once held its breath.' }],
  stories: [
    {
      id: 'colosseum',
      title: 'Colosseum',
      audioUrl: '/audio.mp3',
      listenedLabel: 'July 4',
    },
  ],
  photos: [{ id: 'colosseum', title: 'Colosseum', capturedLabel: 'July 4' }],
  journal: [
    {
      id: 'pantheon',
      title: 'Pantheon',
      text: 'For nearly two thousand years, this dome remained the largest on Earth.',
      recordedLabel: 'July 4',
    },
  ],
}

vi.mock('../../../hooks/useStoryAudio', () => ({
  useStoryAudio: () => ({
    isPlaying: false,
    duration: 120,
    currentTime: 0,
    progress: 0,
    toggle: vi.fn(),
    seekToProgress: vi.fn(),
  }),
}))

describe('JourneyMemoriesScreen', () => {
  it('renders the four archive sections with warm editorial styling', () => {
    render(
      <JourneyMemoriesScreen
        title={archive.title}
        subtitle={archive.subtitle}
        places={archive.places}
        stories={archive.stories}
        photos={archive.photos}
        journal={archive.journal}
        onBack={vi.fn()}
      />
    )

    expect(screen.getByTestId('journey-memories-screen')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Places' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Stories' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Photos' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Journal' })).toBeInTheDocument()
    expect(screen.getByTestId('memory-place-colosseum')).toBeInTheDocument()
  })

  it('switches sections and opens story replay', () => {
    render(
      <JourneyMemoriesScreen
        title={archive.title}
        subtitle={archive.subtitle}
        places={archive.places}
        stories={archive.stories}
        photos={archive.photos}
        journal={archive.journal}
        onBack={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Stories' }))
    fireEvent.click(screen.getByRole('button', { name: /replay/i }))
    expect(screen.getByTestId('memory-story-replay-colosseum')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Journal' }))
    expect(screen.getByTestId('memory-journal-pantheon')).toBeInTheDocument()
    expect(screen.queryByTestId(`memory-place-colosseum`)).not.toBeInTheDocument()
  })

  it('returns to explore more', () => {
    const onBack = vi.fn()

    render(
      <JourneyMemoriesScreen
        title={archive.title}
        subtitle={archive.subtitle}
        places={[]}
        stories={[]}
        photos={[]}
        journal={[]}
        onBack={onBack}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /back to explore more/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(screen.getByText(emptyMessageFor(MEMORY_SECTIONS.PLACES))).toBeInTheDocument()
  })
})

function emptyMessageFor(section) {
  const messages = {
    places: 'Places you arrive at will gather here.',
    stories: 'Stories you finish will stay here for replay.',
    photos: 'Photos you capture will appear in this archive.',
    journal: 'Reflections from your journey will line these pages.',
  }
  return messages[section]
}
