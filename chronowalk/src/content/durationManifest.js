import { audioKeyFromManifestPath } from './durationVerification.js'

export function buildDurationsMap(entries) {
  const map = {}

  for (const entry of entries) {
    const durationSeconds = entry.durationSeconds ?? entry.duration
    if (!entry.path || !Number.isFinite(durationSeconds) || durationSeconds <= 0) continue
    map[audioKeyFromManifestPath(entry.path)] = roundDuration(durationSeconds)
  }

  return map
}

export function roundDuration(durationSeconds) {
  return Math.round(durationSeconds * 10) / 10
}

export function seedDurationsFromTransits(manifest) {
  const seeds = {}

  for (const transit of Object.values(manifest.transits ?? {})) {
    if (!transit?.duration_s) continue

    if (transit.audio) {
      seeds[transit.audio] = transit.duration_s
    }

    for (const variant of Object.values(transit.variants ?? {})) {
      seeds[variant] = transit.duration_s
    }
  }

  return seeds
}

export function mergeDurationMaps(...maps) {
  return Object.assign({}, ...maps)
}

export function durationCoverage(manifest, audioPaths) {
  const durations = manifest.durations ?? {}
  const covered = audioPaths.filter((path) => durations[audioKeyFromManifestPath(path)] != null)
  return {
    total: audioPaths.length,
    covered: covered.length,
    missing: audioPaths
      .filter((path) => durations[audioKeyFromManifestPath(path)] == null)
      .map((path) => audioKeyFromManifestPath(path)),
  }
}
