import { describe, expect, it } from 'vitest'
import { localAudioPath, parseFromDirArg, ROME_AUDIO_PREFIX } from '../localAudioPaths.mjs'

describe('localAudioPaths', () => {
  it('maps manifest audio paths under a local rome/audio root', () => {
    expect(ROME_AUDIO_PREFIX).toBe('/rome/audio/')
    expect(localAudioPath('/rome/audio/narration/w01.mp3', '/tmp/rome/audio')).toBe(
      '/tmp/rome/audio/narration/w01.mp3'
    )
    expect(localAudioPath('/rome/audio/ambience_now.mp3', '/tmp/rome/audio')).toBe(
      '/tmp/rome/audio/ambience_now.mp3'
    )
  })

  it('parses --from-dir from argv', () => {
    expect(parseFromDirArg(['node', 'script', '--from-dir=/audio/root'])).toBe('/audio/root')
    expect(parseFromDirArg(['node', 'script'])).toBeNull()
  })
})
