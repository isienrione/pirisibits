import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import JourneyCompleteLetter from '../JourneyCompleteLetter.jsx'

vi.mock('../../../../hooks/useJourney.js', async (importOriginal) => {
  const { loadRomeManifest } = await import('../../../../content/manifest.js')
  return {
    ...(await importOriginal()),
    useTourManifest: () => ({
      manifest: loadRomeManifest(),
      loading: false,
      error: null,
    }),
  }
})

describe('JourneyCompleteLetter', () => {
  it('renders the spectrum letter route on obsidian', () => {
    render(
      <JourneyCompleteLetter
        tour={{ title: 'Rome' }}
        visitedCount={2}
        walkedMeters={900}
        startedAtMs={Date.now() - 60_000}
        arrivedStopIds={['w01', 'w02']}
      />
    )

    expect(screen.getByRole('heading', { name: /you walked rome/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /route through completed acts/i })).toBeInTheDocument()
    expect(document.querySelector('.animate-letter-route-draw')).toBeTruthy()
    expect(document.querySelector('.bg-obsidian')).toBeTruthy()
  })
})
