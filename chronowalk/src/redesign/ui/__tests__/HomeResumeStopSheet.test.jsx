import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import HomeResumeStopSheet from '../HomeResumeStopSheet.jsx'

vi.mock('../../../lib/startFromNearestStop.js', () => ({
  resolveNearestTourStop: vi.fn(async () => ({
    status: 'ok',
    id: 'near',
    distanceM: 120,
    position: { lat: 41.89, lng: 12.49 },
  })),
  formatWalkDistance: (_meters, t) => t('home.resume.distanceM', { meters: 120 }),
}))

vi.mock('../../../content/myTourPlan.js', () => ({
  getTourWaypointIds: () => ['near', 'far'],
}))

vi.mock('../../../content/manifest.js', () => ({
  getWaypoint: (_manifest, id) =>
    ({
      near: { id: 'near', title: 'Near Stop', photo: '/near.jpg', geofence: { lat: 1, lng: 1 } },
      far: { id: 'far', title: 'Far Stop', photo: '/far.jpg', geofence: { lat: 2, lng: 2 } },
    })[id],
}))

vi.mock('../../lib/waypointPresentation.js', () => ({
  photoForWaypoint: (waypoint) => waypoint?.photo ?? null,
  titleForWaypoint: (waypoint) => waypoint?.title ?? 'Stop',
}))

import { resolveNearestTourStop } from '../../../lib/startFromNearestStop.js'

describe('HomeResumeStopSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the nearest stop and can open the alternate picker', async () => {
    const onChooseStop = vi.fn()
    render(
      <MemoryRouter>
        <I18nProvider>
          <HomeResumeStopSheet
            open
            onClose={() => {}}
            manifest={{}}
            context={{}}
            onChooseStop={onChooseStop}
          />
        </I18nProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(resolveNearestTourStop).toHaveBeenCalled())
    expect(await screen.findByTestId('home-resume-nearest')).toBeInTheDocument()
    expect(screen.getAllByText(/near stop/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByTestId('home-resume-yes'))
    expect(onChooseStop).toHaveBeenCalledWith('near')

    fireEvent.click(screen.getByTestId('home-resume-different'))
    expect(screen.getByTestId('home-resume-picker')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('home-resume-stop-far'))
    fireEvent.click(screen.getByTestId('home-resume-confirm-pick'))
    expect(onChooseStop).toHaveBeenCalledWith('far')
  })
})
