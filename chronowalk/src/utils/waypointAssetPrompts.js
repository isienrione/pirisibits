import { getModernPosterUrl, getModernSliderUrl } from './sliderMedia';

const DEFAULT_POSTER_SEC = 3;
const DEFAULT_LOOP_MS = 10000;
const DEFAULT_VIDEO_DURATION_SEC = 5;

export const resolveAbsoluteAssetUrl = (url, origin) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (origin) return `${origin.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
  return url;
};

export const getModernReferenceUrl = (waypoint) =>
  waypoint?.modern_image_url || getModernPosterUrl(waypoint) || getModernSliderUrl(waypoint);

export const buildViewpointContext = (waypoint) => {
  const viewpoint = waypoint?.viewpoint ?? {};

  return {
    id: waypoint?.id ?? 'waypoint',
    title: waypoint?.title ?? 'Landmark',
    standLat: viewpoint.lat ?? null,
    standLng: viewpoint.lng ?? null,
    heading: viewpoint.heading ?? null,
    pitch: viewpoint.pitch ?? null,
    landmarkLat: waypoint?.lat ?? null,
    landmarkLng: waypoint?.lng ?? null,
    orientationHint: waypoint?.immersive_orientation_hint ?? '',
    posterSec: waypoint?.slider_poster_at_sec ?? DEFAULT_POSTER_SEC,
    loopMs: waypoint?.slider_post_animation_loop_ms ?? DEFAULT_LOOP_MS,
  };
};

export const buildStreetViewUrl = (waypoint) => {
  const { standLat, standLng, heading, pitch } = buildViewpointContext(waypoint);
  if (standLat == null || standLng == null) return null;

  const params = new URLSearchParams({
    api: '1',
    map_action: 'pano',
    viewpoint: `${standLat},${standLng}`,
  });

  if (heading != null) params.set('heading', String(heading));
  if (pitch != null) params.set('pitch', String(pitch));

  return `https://www.google.com/maps/@?${params.toString()}`;
};

const formatCoords = (waypoint) => {
  const ctx = buildViewpointContext(waypoint);
  if (ctx.standLat == null || ctx.standLng == null) return 'ground-level tourist viewpoint (set viewpoint.lat/lng in seed)';

  const heading = ctx.heading != null ? `${ctx.heading}° heading` : 'heading TBD';
  const pitch = ctx.pitch != null ? `${ctx.pitch}° pitch` : 'pitch TBD';

  return `stand at ${ctx.standLat}, ${ctx.standLng}, camera ${heading}, ${pitch}`;
};

const sharedCameraRules = (waypoint) => {
  const ctx = buildViewpointContext(waypoint);

  return [
    `Matched viewpoint for ChronoWalk slider at ${ctx.title}.`,
    `Camera POV: ${formatCoords(waypoint)}.`,
    ctx.orientationHint ? `Visitor orientation: ${ctx.orientationHint}` : null,
    'Tripod-locked camera — no pan, tilt, zoom, or dolly during clip.',
    '16:9 landscape, full landmark facade visible, center-weighted composition.',
    'No text, watermarks, UI, or borders in frame.',
  ]
    .filter(Boolean)
    .join(' ');
};

/** Prompt to animate the exported modern still into moderncolosseum.mp4-style clip. */
export const buildModernAnimatedVideoPrompt = (waypoint) => {
  const ctx = buildViewpointContext(waypoint);

  return [
    `Cinematic locked-off ground-level video of ${ctx.title} today, ${formatCoords(waypoint)}.`,
    'Use the provided modern reference photo as the exact camera angle and framing.',
    `Duration ${DEFAULT_VIDEO_DURATION_SEC} seconds, 16:9, 24fps feel.`,
    'Only subtle ambient motion: light cloud drift, tiny pedestrian movement, soft daylight shimmer.',
    'Architecture stays perfectly fixed — no camera movement, no warp, no morph.',
    `Hero compare frame should work at ~${ctx.posterSec}s (full facade, minimal foreground clutter).`,
    'Photorealistic, natural color, Rome street atmosphere.',
  ].join(' ');
};

/** Midjourney / still-image model prompt for ancient-reconstruction.jpg. */
export const buildAncientStillPrompt = (waypoint) => {
  const ctx = buildViewpointContext(waypoint);

  return [
    `Ancient Rome reconstruction of ${ctx.title}, exact same camera position as reference modern photo.`,
    formatCoords(waypoint),
    'Same field of view, same facade angle, same horizon line — only the era changes to ~125 AD.',
    'Historically plausible architecture, warm Mediterranean daylight, photorealistic archaeological visualization.',
    'No modern buildings, cars, tourists, signs, scaffolding, or anachronisms.',
    'Full height of monument visible, 16:9 composition, sharp detail on stone and arches.',
    '--style raw photorealistic architectural visualization',
  ].join(' ');
};

/** Runway / Pika / video-gen prompt for ancient-reconstruction.mp4. */
export const buildAncientAnimatedVideoPrompt = (waypoint) => {
  const ctx = buildViewpointContext(waypoint);

  return [
    `Ancient Rome reconstruction video of ${ctx.title}, locked tripod camera, ${formatCoords(waypoint)}.`,
    'Match the motion timing and framing of the modern reference video — same duration and crop.',
    `Duration ${DEFAULT_VIDEO_DURATION_SEC} seconds, 16:9.`,
    'Only subtle era-appropriate motion: banners, dust, crowds as silhouettes, warm light flicker.',
    'Monument structure remains fixed — no camera move, no geometry drift between frames.',
    `Hero poster frame at ~${ctx.posterSec}s with complete facade for before/after compare.`,
    'Photorealistic Rome Reborn quality, cinematic but documentary.',
  ].join(' ');
};

/** DaVinci Resolve / editorial brief for syncing exports. */
export const buildDaVinciResolveBrief = (waypoint) => {
  const ctx = buildViewpointContext(waypoint);
  const id = ctx.id;

  return [
    `# ChronoWalk export brief — ${ctx.title} (${id})`,
    '',
    '## Timeline',
    `- Modern clip: ${DEFAULT_VIDEO_DURATION_SEC}s @ 16:9`,
    `- Ancient clip: same duration, frame-matched`,
    `- Poster stills: export at ${ctx.posterSec}s from each timeline`,
    `- App loop hold after first play: ${ctx.loopMs}ms`,
    '',
    '## Match rules',
    '- Identical resolution and fps between modern and ancient timelines',
    '- Disable reframing — pixel-align facades',
    '- Ancient poster: pad to 16:9 if source is square (preserve full height)',
    '',
    '## Deliverables',
    `public/waypoints/${id}/modern-exterior.jpg`,
    `public/waypoints/${id}/moderncolosseum.mp4 (or modern.mp4)`,
    `public/waypoints/${id}/modern-poster.jpg`,
    `public/waypoints/${id}/ancient-reconstruction.jpg`,
    `public/waypoints/${id}/ancient-reconstruction.mp4`,
    `public/waypoints/${id}/ancient-poster.jpg`,
    `public/waypoints/${id}/depth-map.png (optional)`,
    '',
    '## Viewpoint metadata (embed in seed)',
    `lat/lng center: ${ctx.landmarkLat}, ${ctx.landmarkLng}`,
    `viewpoint: ${ctx.standLat}, ${ctx.standLng}, heading ${ctx.heading}, pitch ${ctx.pitch}`,
  ].join('\n');
};

export const buildToolingNotes = (waypoint, modernReferenceUrl) => {
  const ctx = buildViewpointContext(waypoint);
  const id = ctx.id;

  return {
    midjourney: {
      title: 'Midjourney — ancient still',
      steps: [
        'Export modern ground-level photo from Street View (or shoot on site).',
        `Upload modern reference: ${modernReferenceUrl ?? 'modern-exterior.jpg'}`,
        'Use /describe on the modern photo, then blend with the ancient still prompt below.',
        'Prefer image prompt weight on the modern photo for angle lock.',
        `Save as public/waypoints/${id}/ancient-reconstruction.jpg`,
        `Export poster frame → ancient-poster.jpg (pad to 16:9)`,
      ],
    },
    runway: {
      title: 'Runway / Pika — modern + ancient video',
      steps: [
        `Image-to-video: modern still → ${DEFAULT_VIDEO_DURATION_SEC}s clip (locked camera).`,
        'Use motion brush only on sky/crowds — lock architecture mask.',
        `Image-to-video: ancient still → same duration, copy motion amount from modern clip.`,
        'Alternatively: motion-sync from modern video with ancient first frame.',
        `Save moderncolosseum.mp4 + ancient-reconstruction.mp4`,
      ],
    },
    davinci: {
      title: 'DaVinci Resolve — sync & posters',
      steps: [
        'Stack modern and ancient clips; align using facade corners.',
        `Mark ${ctx.posterSec}s as hero frame on both timelines.`,
        'Export poster JPGs and verify 16:9 cover in app (?posterAt= tune on phone).',
      ],
    },
  };
};

export const buildWaypointAssetPromptPack = (waypoint, origin) => {
  const modernReferenceUrl = resolveAbsoluteAssetUrl(getModernReferenceUrl(waypoint), origin);
  const ctx = buildViewpointContext(waypoint);

  return {
    waypointId: ctx.id,
    title: ctx.title,
    modernReferenceUrl,
    streetViewUrl: buildStreetViewUrl(waypoint),
    viewpoint: buildViewpointContext(waypoint),
    sharedCameraRules: sharedCameraRules(waypoint),
    prompts: {
      modernAnimatedVideo: buildModernAnimatedVideoPrompt(waypoint),
      ancientStill: buildAncientStillPrompt(waypoint),
      ancientAnimatedVideo: buildAncientAnimatedVideoPrompt(waypoint),
      davinciResolveBrief: buildDaVinciResolveBrief(waypoint),
    },
    tooling: buildToolingNotes(waypoint, modernReferenceUrl),
    fileManifest: [
      `public/waypoints/${ctx.id}/modern-exterior.jpg`,
      `public/waypoints/${ctx.id}/moderncolosseum.mp4`,
      `public/waypoints/${ctx.id}/modern-poster.jpg`,
      `public/waypoints/${ctx.id}/ancient-reconstruction.jpg`,
      `public/waypoints/${ctx.id}/ancient-reconstruction.mp4`,
      `public/waypoints/${ctx.id}/ancient-poster.jpg`,
    ],
  };
};
