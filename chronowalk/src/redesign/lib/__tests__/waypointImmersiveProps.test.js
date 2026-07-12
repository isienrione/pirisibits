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
})
