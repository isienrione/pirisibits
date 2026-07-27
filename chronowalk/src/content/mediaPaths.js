/**
 * Visual media paths referenced by the Rome manifest (threshold reconstructions, heroes).
 */

/**
 * @param {import('./manifest.schema.js').romeManifestSchema['_output']} manifest
 */
export function collectManifestMediaPaths(manifest) {
  const paths = new Set()

  const add = (path) => {
    if (path) paths.add(path)
  }

  for (const waypoint of Object.values(manifest.waypoints ?? {})) {
    add(waypoint.photo)

    const reconstruction = waypoint.reconstruction
    if (reconstruction) {
      add(reconstruction.now)
      add(reconstruction.then)
      add(reconstruction.loop)
    }

    for (const chapter of waypoint.chapters ?? []) {
      if (!chapter || typeof chapter === 'string') continue
      add(chapter.photo)
      if (!chapter.reconstruction) continue
      add(chapter.reconstruction.now)
      add(chapter.reconstruction.then)
      add(chapter.reconstruction.loop)
    }
  }

  return [...paths].sort()
}
