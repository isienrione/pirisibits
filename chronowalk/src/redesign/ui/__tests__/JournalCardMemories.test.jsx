import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import JournalCardMemories from '../JournalCardMemories.jsx'
import {
  forceJournalMemoryFallbackForTests,
  resetJournalMemoryStorageForTests,
  saveJournalNote,
  saveJournalPhoto,
} from '../../../utils/journalMemoryStorage.js'
describe('JournalCardMemories', () => {
  beforeEach(async () => {
    await resetJournalMemoryStorageForTests()
    forceJournalMemoryFallbackForTests()
  })

  it('saves a note on the monument card and shows it again', async () => {
    render(
      <I18nProvider>
        <JournalCardMemories waypointId="colosseum" stopName="The Colosseum" />
      </I18nProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('journal-memory-colosseum')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('journal-note-toggle-colosseum'))
    fireEvent.change(screen.getByTestId('journal-note-input-colosseum'), {
      target: { value: 'Crowds thin at dusk.' },
    })
    fireEvent.click(screen.getByTestId('journal-note-save-colosseum'))

    await waitFor(() => {
      expect(screen.getByTestId('journal-note-preview-colosseum')).toHaveTextContent(
        'Crowds thin at dusk.',
      )
    })
  })

  it('reloads a previously stored note and photo', async () => {
    await saveJournalNote('palatine', 'Hill wind.')
    await saveJournalPhoto('palatine', new Blob(['img'], { type: 'image/jpeg' }), {
      saveToDevice: false,
    })

    render(
      <I18nProvider>
        <JournalCardMemories waypointId="palatine" stopName="Palatine" />
      </I18nProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('journal-note-preview-palatine')).toHaveTextContent('Hill wind.')
      expect(screen.getByTestId('journal-photo-preview-palatine')).toBeInTheDocument()
    })
  })

  it('exposes library and camera pickers', async () => {
    render(
      <I18nProvider>
        <JournalCardMemories waypointId="forum" stopName="Forum" />
      </I18nProvider>,
    )

    await waitFor(() => screen.getByTestId('journal-memory-forum'))
    fireEvent.click(screen.getByTestId('journal-photo-toggle-forum'))
    expect(screen.getByTestId('journal-photo-library-forum')).toBeInTheDocument()
    expect(screen.getByTestId('journal-photo-camera-forum')).toBeInTheDocument()
  })

  it('toggles saved note and photo visibility per stop', async () => {
    await saveJournalNote('colosseum', 'Crowds thin at dusk.')

    render(
      <I18nProvider>
        <JournalCardMemories waypointId="colosseum" stopName="The Colosseum" />
      </I18nProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('journal-note-preview-colosseum')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('journal-memory-expand-colosseum'))
    expect(screen.queryByTestId('journal-memory-content-colosseum')).not.toBeInTheDocument()
    expect(screen.queryByTestId('journal-note-preview-colosseum')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('journal-memory-expand-colosseum'))
    expect(screen.getByTestId('journal-note-preview-colosseum')).toBeInTheDocument()
  })
})
