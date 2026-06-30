import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  COLOSSEUM_EXTERIOR_W01,
  COLOSSEUM_EXTERIOR_W01_AUDIO,
  COLOSSEUM_EXTERIOR_W01_TRANSCRIPT,
  countTranscriptWords,
} from '../colosseum-exterior-w01'
import { COLOSSEUM_WAYPOINT } from '../colosseum'
import { getWaypointTranscript, hasPublishedTranscript } from '../../utils/waypointTranscript'

const publicRoot = resolve(process.cwd(), 'public')

describe('colosseum exterior W01 content', () => {
  it('ships the v2 narration transcript at the expected word count', () => {
    const words = countTranscriptWords()
    expect(words).toBeGreaterThanOrEqual(1500)
    expect(words).toBeLessThanOrEqual(1540)
    expect(COLOSSEUM_EXTERIOR_W01_TRANSCRIPT).toMatch(/ground here used to be underwater/i)
    expect(COLOSSEUM_EXTERIOR_W01_TRANSCRIPT).toMatch(/floor is missing/i)
    expect(COLOSSEUM_EXTERIOR_W01.estimatedWordCount).toBe(1523)
  })

  it('wires W01 copy and audio into the colosseum waypoint seed', () => {
    expect(COLOSSEUM_WAYPOINT.script_id).toBe('W01')
    expect(COLOSSEUM_WAYPOINT.script_version).toBe('v2')
    expect(COLOSSEUM_WAYPOINT.arrival_immersive_url).toBe(COLOSSEUM_EXTERIOR_W01_AUDIO.arrivalImmersive)
    expect(COLOSSEUM_WAYPOINT.ambient_url).toBe(COLOSSEUM_EXTERIOR_W01_AUDIO.ambientCrowd)
    expect(COLOSSEUM_WAYPOINT.arrival_transcript).toBe(COLOSSEUM_EXTERIOR_W01_TRANSCRIPT)
    expect(COLOSSEUM_WAYPOINT.arrival_subtitle).toMatch(/flavian amphitheatre/i)
    expect(hasPublishedTranscript(COLOSSEUM_WAYPOINT)).toBe(true)
    expect(getWaypointTranscript(COLOSSEUM_WAYPOINT)).toMatch(/fifty thousand/i)
  })

  it('includes committed placeholder audio and script assets for local testing', () => {
    const assets = [
      COLOSSEUM_EXTERIOR_W01_AUDIO.arrivalImmersive,
      COLOSSEUM_EXTERIOR_W01_AUDIO.ambientCrowd,
      COLOSSEUM_EXTERIOR_W01_AUDIO.transcriptSource,
      COLOSSEUM_WAYPOINT.arrival_alert_url,
    ]

    for (const assetPath of assets) {
      const absolute = resolve(publicRoot, assetPath.replace(/^\//, ''))
      expect(existsSync(absolute), `missing ${assetPath}`).toBe(true)
    }

    const script = readFileSync(
      resolve(publicRoot, 'waypoints/colosseum/exterior/W01_Colosseum_Exterior_v2.md'),
      'utf8'
    )
    expect(script).toMatch(/waypoint_id:\s*W01/i)
    expect(script).toMatch(/The ground here used to be underwater/i)
  })
})
