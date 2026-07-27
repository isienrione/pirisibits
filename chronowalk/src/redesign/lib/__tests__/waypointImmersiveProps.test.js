import { describe, expect, it } from 'vitest'
import { loadRomeManifest, getWaypoint } from '../../../content/manifest.js'
import { buildImmersivePlayerProps } from '../waypointImmersiveProps.js'
import {
  hasImmersiveThreshold,
  inferredReconstructionLoopPath,
} from '../waypointPresentation.js'

describe('waypointImmersiveProps', () => {
  const manifest = loadRomeManifest()

  it('enables immersive threshold for every visit stop except scripted rest', () => {
    for (const waypoint of manifest.waypoints) {
      if (waypoint.scripted_rest) {
        expect(hasImmersiveThreshold(waypoint)).toBe(false)
      } else {
        expect(hasImmersiveThreshold(waypoint)).toBe(true)
      }
    }
  })

  it('builds player props for any waypoint id', () => {
    const waypoint = getWaypoint(manifest, 'w17')
    const props = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w17',
      manifest,
      audio: { audioAvailable: true, narrationPlaying: true, currentTime: 10, duration: 100 },
    })
    expect(props.title).toMatch(/pantheon/i)
    expect(props.hasReconstruction).toBe(true)
    expect(props.waypointId).toBe('w17')
  })

  it('infers ancient loop path from photo folder', () => {
    const waypoint = getWaypoint(manifest, 'w01')
    expect(inferredReconstructionLoopPath(waypoint)).toBe(
      '/waypoints/colosseum/exterior/ancient-reconstruction.mp4',
    )
  })

  it('infers ancient loop path for forum-cluster Severus stop', () => {
    const waypoint = getWaypoint(manifest, 'w11_12')
    expect(inferredReconstructionLoopPath(waypoint)).toBe(
      '/waypoints/forum-cluster/forum-arch-severus/ancient-reconstruction.mp4',
    )
    expect(waypoint.reconstruction.loop).toBe(
      '/waypoints/forum-cluster/forum-arch-severus/ancient-reconstruction.mp4',
    )
    expect(waypoint.reconstruction.then).toBe(
      '/waypoints/forum-cluster/forum-arch-severus/ancient-reconstruction.jpg',
    )
  })

  it('uses Curia reconstruction media for the Curia chapter on w11_12', () => {
    const waypoint = getWaypoint(manifest, 'w11_12')
    const severusProps = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w11_12',
      manifest,
      chapterIndex: 0,
    })
    const curiaProps = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w11_12',
      manifest,
      chapterIndex: 1,
    })

    expect(severusProps.thenLoop).toContain(
      '/waypoints/forum-cluster/forum-arch-severus/ancient-reconstruction.mp4',
    )
    expect(curiaProps.thenLoop).toContain(
      '/waypoints/forum-cluster/forum-curia-julia/ancient-reconstruction.mp4',
    )
    expect(curiaProps.photo).toContain('/waypoints/forum-cluster/forum-curia-julia/modern-poster.jpg')
    expect(curiaProps.thenPhoto).toContain(
      '/waypoints/forum-cluster/forum-curia-julia/ancient-reconstruction.jpg',
    )
  })
})
