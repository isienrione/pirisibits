/**
 * Wikimedia photography credits derived from the Rome manifest.
 * @param {import('./manifest.schema.js').romeManifestSchema['_output']} manifest
 */
export function collectWikimediaCredits(manifest) {
  if (!manifest?.waypoints) return []

  return Object.entries(manifest.waypoints)
    .map(([id, waypoint]) => ({
      id,
      title: waypoint.title ?? id,
      credit: waypoint.now_image?.credit ?? null,
      sourceUrl: waypoint.now_image?.source_url ?? null,
    }))
    .filter((entry) => manifest.waypoints[entry.id]?.now_image?.source === 'wikimedia')
    .sort((a, b) => a.title.localeCompare(b.title))
}

export const ABOUT_IMAGERY_COPY =
  "Present-day photographs are sourced from Wikimedia Commons under Creative Commons licenses (credited above) where available. Where a suitable licensed photograph wasn't available, present-day imagery was generated with AI tools, referenced against real historical photographs of each location. Historical reconstructions throughout the app are AI-generated interpretations informed by archaeological and historical research · see each waypoint's caption for source notes."
