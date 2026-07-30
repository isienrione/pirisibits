/** Expansion stops outside forum-cluster - scaffold until assets ship. */
export const EXPANSION_STOP_META = {
  'palatine-hill-cluster': {
    title: 'Palatine Hill',
    lat: 41.8886,
    lng: 12.4872,
    viewpoint: { lat: 41.88845, lng: 12.48705, heading: 140, pitch: 16 },
    subtitle: 'Emperors’ palaces above the Forum - where legend says Rome was born.',
    assetRoot: 'palatine-hill-cluster',
  },
  'trajan-market': {
    title: "Trajan's Market",
    lat: 41.8956,
    lng: 12.48595,
    viewpoint: { lat: 41.89545, lng: 12.48555, heading: 200, pitch: 18 },
    subtitle: 'Brick arcades and shops - ancient Rome’s multi-level market hall.',
    assetRoot: 'trajan-market',
  },
  'circus-maximus': {
    title: 'Circus Maximus',
    lat: 41.8859,
    lng: 12.4857,
    viewpoint: { lat: 41.8857, lng: 12.48545, heading: 85, pitch: 12 },
    subtitle: 'The chariot circus - a quarter million Romans cheering from the banks.',
    assetRoot: 'circus-maximus',
  },
  'appian-way': {
    title: 'Appian Way',
    lat: 41.85655,
    lng: 12.51185,
    viewpoint: { lat: 41.85655, lng: 12.51185, heading: 250, pitch: 10 },
    subtitle: 'The queen of roads - basalt paving and tombs leading out of the city.',
    assetRoot: 'via-appia',
  },
  'spanish-steps': {
    title: 'Spanish Steps',
    lat: 41.90597,
    lng: 12.48259,
    viewpoint: { lat: 41.9059, lng: 12.4827, heading: 200, pitch: 12 },
    subtitle: 'The Scalinata - Rome’s great outdoor salon between Trinità dei Monti and the piazza.',
    assetRoot: 'spanish-steps',
    // Ship only assets that exist under public/waypoints/spanish-steps/.
    shipAssets: true,
    media: {
      modern_image_url: 'modern-exterior.jpg',
      modern_poster_url: 'modern-poster.jpg',
      ancient_video_url: 'ancient-reconstruction.mp4',
    },
  },
}

export const EXPANSION_STOP_IDS = Object.keys(EXPANSION_STOP_META)

const buildExpansionWaypoint = (id) => {
  const meta = EXPANSION_STOP_META[id]
  const base = `/waypoints/${meta.assetRoot}`
  const media = meta.media
    ? Object.fromEntries(
        Object.entries(meta.media).map(([key, file]) => [
          key,
          String(file).startsWith('/') ? file : `${base}/${file}`,
        ]),
      )
    : {
        modern_image_url: `${base}/modern-exterior.jpg`,
        modern_video_url: `${base}/modern.mp4`,
        modern_poster_url: `${base}/modern-poster.jpg`,
        ancient_image_url: `${base}/ancient-reconstruction.jpg`,
        ancient_video_url: `${base}/ancient-reconstruction.mp4`,
        ancient_poster_url: `${base}/ancient-poster.jpg`,
        ambient_url: `${base}/Audio_sample.mp3`,
        transit_narrative_url: `${base}/Audio_sample.mp3`,
        arrival_immersive_url: `${base}/Audio_sample.mp3`,
        arrival_alert_url: `${base}/geocache-arrival-alert.wav`,
      }

  return {
    id,
    title: meta.title,
    // Default scaffold stops stay non-shipping until assets land; Spanish Steps ships real files.
    ship_assets: meta.shipAssets === true ? true : false,
    media_cache_version: 1,
    arrival_headline: `You've reached ${meta.title}!`,
    arrival_subtitle: meta.subtitle,
    immersive_orientation_hint: `Stand facing ${meta.title}, then begin the immersive view.`,
    lat: meta.lat,
    lng: meta.lng,
    viewpoint: meta.viewpoint,
    ...media,
    slider_poster_at_sec: 3,
    slider_post_animation_loop_ms: 10000,
    slider_freeze_at_sec: 3,
  }
}

export const EXPANSION_WAYPOINTS_BY_ID = Object.fromEntries(
  EXPANSION_STOP_IDS.map((id) => [id, buildExpansionWaypoint(id)])
)

export const getExpansionWaypoint = (id) => EXPANSION_WAYPOINTS_BY_ID[id] ?? null
