import { describe, expect, it } from 'vitest'
import { loadRomeManifest, getWaypoint } from '../../../content/manifest.js'
import { buildImmersivePlayerProps } from '../waypointImmersiveProps.js'
import {
  hasImmersiveThreshold,
  inferredReconstructionLoopPath,
} from '../waypointPresentation.js'

describe('waypointImmersiveProps', () => {
  const manifest = loadRomeManifest()

  it('enables immersive threshold for visit stops except scripted rest and static-photo stops', () => {
    for (const waypoint of manifest.waypoints) {
      if (waypoint.scripted_rest || waypoint.threshold === false) {
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
      '/waypoints/forum-cluster/forum-arch-severus/ancient-poster.jpg',
    )
  })

  it('uses static Pantheon interior photos with no threshold on w23', () => {
    const waypoint = getWaypoint(manifest, 'w23')
    expect(waypoint.threshold).toBe(false)
    expect(waypoint.reconstruction).toBeUndefined()
    expect(hasImmersiveThreshold(waypoint)).toBe(false)

    const domeProps = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w23',
      manifest,
      chapterIndex: 0,
    })
    // ch2 (index 1) = empire under feet - photo is tomb (user-assigned)
    const empireProps = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w23',
      manifest,
      chapterIndex: 1,
    })
    // ch3 (index 2) = tombs chapter - photo is general interior oculus
    const tombsProps = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w23',
      manifest,
      chapterIndex: 2,
    })

    expect(domeProps.hasReconstruction).toBe(false)
    expect(domeProps.thenLoop).toBeNull()
    expect(domeProps.photo).toContain('/waypoints/pantheon/interior/interior-oculus.jpg')
    expect(empireProps.photo).toContain(
      '/waypoints/pantheon/interior/interior-tomb-vittorio-emanuele.jpg',
    )
    expect(tombsProps.photo).toContain('/waypoints/pantheon/interior/interior-oculus.jpg')
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
    expect(curiaProps.title).toMatch(/Curia Julia/i)
    expect(severusProps.title).toMatch(/Septimius Severus|Arch of Septimius/i)
  })

  it('keeps Arch of Titus hero title free of chapter numerals', () => {
    const waypoint = getWaypoint(manifest, 'w03')
    const ch1 = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w03',
      manifest,
      chapterIndex: 0,
    })
    const ch2 = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w03',
      manifest,
      chapterIndex: 1,
    })

    expect(ch1.title).toBe('Arch of Titus')
    expect(ch2.title).toBe('Arch of Titus')
    expect(ch1.title).not.toMatch(/\b[IVXLC\d]+\b/)
    expect(ch1.tagline).toMatch(/Arch of Titus I/i)
  })

  it('titles Titus outro chapter as Enter the valley', () => {
    const waypoint = getWaypoint(manifest, 'w03')
    const outro = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w03',
      manifest,
      chapterIndex: 2,
      audio: { chapterCount: 3 },
    })
    expect(outro.chapterTitle).toBe('Enter the valley')
    expect(outro.title).toBe('Enter the valley')
    expect(outro.tagline).toBe('Enter the valley')
  })

  it('uses Circus Maximus (English title, not Circo Massimo)', () => {
    const waypoint = getWaypoint(manifest, 'w04')
    const circus = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w04',
      manifest,
      chapterIndex: 1,
    })
    expect(circus.chapterTitle).toBe('Circus Maximus')
    expect(circus.chapterTitle).not.toMatch(/Circo Massimo/i)
  })

  it('titles Pantheon interior tombs chapter as the tombs', () => {
    const waypoint = getWaypoint(manifest, 'w23')
    const props = buildImmersivePlayerProps({
      waypoint,
      waypointId: 'w23',
      manifest,
      chapterIndex: 2,
    })
    expect(props.chapterTitle).toMatch(/the tombs/i)
    expect(props.chapterTitle).not.toMatch(/Resilience and Purpose/i)
  })
})
