/** Walk order through public/waypoints/forum-cluster/ — matches expansion docs. */
export const ROMAN_FORUM_STOP_IDS = [
  'forum-arch-titus',
  'forum-basilica-maxentius',
  'forum-via-sacra',
  'forum-temple-vesta',
  'forum-rostra',
  'forum-temple-saturn',
  'forum-curia-julia',
  'forum-arch-severus',
]

const FORUM_CLUSTER_ROOT = 'forum-cluster'

const FORUM_STOP_META = {
  'forum-arch-titus': {
    title: 'Arch of Titus',
    lat: 41.8905,
    lng: 12.48835,
    viewpoint: { lat: 41.8905, lng: 12.48835, heading: 25, pitch: 18 },
    subtitle: 'Triumphal relief and the sack of Jerusalem — Rome’s victory arch in living stone.',
  },
  'forum-basilica-maxentius': {
    title: 'Basilica of Maxentius',
    lat: 41.89175,
    lng: 12.488,
    viewpoint: { lat: 41.89175, lng: 12.488, heading: 65, pitch: 20 },
    subtitle: 'Vaulted halls that once held law courts and the scale of late imperial Rome.',
  },
  'forum-via-sacra': {
    title: 'Via Sacra',
    lat: 41.89255,
    lng: 12.48535,
    viewpoint: { lat: 41.8924, lng: 12.4851, heading: 45, pitch: 12 },
    subtitle: 'The Sacred Way — processions, temples, and empire rolled through this pavement.',
  },
  'forum-temple-vesta': {
    title: 'Temple of Vesta',
    lat: 41.89182,
    lng: 12.48715,
    viewpoint: { lat: 41.8916, lng: 12.48705, heading: 50, pitch: 16 },
    subtitle: 'The eternal flame and the round temple that guarded Rome’s fate.',
  },
  'forum-rostra': {
    title: 'The Rostra',
    lat: 41.89282,
    lng: 12.48518,
    viewpoint: { lat: 41.89265, lng: 12.48495, heading: 30, pitch: 15 },
    subtitle: 'Where orators spoke from a platform decorated with captured warship prows.',
  },
  'forum-temple-saturn': {
    title: 'Temple of Saturn',
    lat: 41.89239,
    lng: 12.48498,
    viewpoint: { lat: 41.89218, lng: 12.48472, heading: 78, pitch: 16 },
    subtitle: 'Ionic columns and the state treasury beneath Rome’s oldest forum temple.',
  },
  'forum-curia-julia': {
    title: 'Curia Julia',
    lat: 41.89223,
    lng: 12.48528,
    viewpoint: { lat: 41.89205, lng: 12.48505, heading: 55, pitch: 18 },
    subtitle: 'The Senate house — marble doors and the chamber where Rome decided its fate.',
  },
  'forum-arch-severus': {
    title: 'Arch of Septimius Severus',
    lat: 41.89301,
    lng: 12.48442,
    viewpoint: { lat: 41.89275, lng: 12.48455, heading: 340, pitch: 17 },
    subtitle: 'A triple arch celebrating victories on the eastern frontier — gilded and intact.',
  },
}

const buildForumWaypoint = (id) => {
  const meta = FORUM_STOP_META[id]
  const base = `/waypoints/${FORUM_CLUSTER_ROOT}/${id}`

  return {
    id,
    title: meta.title,
    ship_assets: false,
    media_cache_version: 1,
    arrival_headline: `You've reached ${meta.title}!`,
    arrival_subtitle: meta.subtitle,
    immersive_orientation_hint: `Stand facing ${meta.title} from the Forum floor, then begin the immersive view.`,
    lat: meta.lat,
    lng: meta.lng,
    viewpoint: meta.viewpoint,
    modern_image_url: `${base}/modern-exterior.jpg`,
    modern_video_url: `${base}/modern.mp4`,
    modern_poster_url: `${base}/modern-poster.jpg`,
    ancient_image_url: `${base}/ancient-reconstruction.jpg`,
    ancient_video_url: `${base}/ancient-reconstruction.mp4`,
    ancient_poster_url: `${base}/ancient-poster.jpg`,
    slider_poster_at_sec: 3,
    slider_post_animation_loop_ms: 10000,
    slider_freeze_at_sec: 3,
    ambient_url: `${base}/Audio_sample.mp3`,
    transit_narrative_url: `${base}/Audio_sample.mp3`,
    arrival_immersive_url: `${base}/Audio_sample.mp3`,
    arrival_alert_url: `${base}/geocache-arrival-alert.wav`,
  }
}

export const FORUM_WAYPOINTS_BY_ID = Object.fromEntries(
  ROMAN_FORUM_STOP_IDS.map((id) => [id, buildForumWaypoint(id)])
)

export const getForumWaypoint = (id) => FORUM_WAYPOINTS_BY_ID[id] ?? null
