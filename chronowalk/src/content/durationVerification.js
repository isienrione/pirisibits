const MIN_BYTES_PER_SECOND = 5_000

export function audioKeyFromManifestPath(manifestPath) {
  return manifestPath.split('/').pop()
}

export function getExpectedDurationSeconds(manifest, manifestPath) {
  const filename = audioKeyFromManifestPath(manifestPath)
  return manifest.durations?.[filename] ?? manifest.durations?.[manifestPath] ?? null
}

export function minimumBytesForDuration(durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) return 0
  return Math.floor(durationSeconds * MIN_BYTES_PER_SECOND)
}

export function isBlobPlausibleForDuration(blobSize, durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) return true
  return blobSize >= minimumBytesForDuration(durationSeconds)
}

export function findDurationMismatches(manifest, entries) {
  const mismatches = []

  for (const { path, blobSize } of entries) {
    const expectedDuration = getExpectedDurationSeconds(manifest, path)
    if (expectedDuration == null) continue

    if (!isBlobPlausibleForDuration(blobSize, expectedDuration)) {
      mismatches.push({
        path,
        blobSize,
        expectedDuration,
        minimumBytes: minimumBytesForDuration(expectedDuration),
      })
    }
  }

  return mismatches
}
