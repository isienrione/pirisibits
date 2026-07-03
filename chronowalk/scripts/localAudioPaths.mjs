import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'

export const ROME_AUDIO_PREFIX = '/rome/audio/'

export function localAudioPath(manifestPath, audioRoot) {
  if (!manifestPath?.startsWith(ROME_AUDIO_PREFIX)) return null
  return join(audioRoot, manifestPath.slice(ROME_AUDIO_PREFIX.length))
}

export function parseFromDirArg(argv = process.argv) {
  const entry = argv.find((arg) => arg.startsWith('--from-dir='))
  if (!entry) return null
  return entry.slice('--from-dir='.length)
}

export async function assertReadableFile(path) {
  await access(path, constants.R_OK)
  return path
}
