import { getDistance } from './distance';

/**
 * Reference values from the Colosseum modern-exterior.jpg that reads well in the slider.
 * Use as a quality bar for every new waypoint — not as exact numbers for every site.
 */
export const COLOSSEUM_FRAMING_REFERENCE = {
  id: 'colosseum',
  viewpointOffsetM: null, // computed below
  pitch: 18.1,
  heading: 153.2,
  landmark: { lat: 41.8902, lng: 12.4922 },
  viewpoint: { lat: 41.891275, lng: 12.491202, heading: 153.2, pitch: 18.1 },
  notes: [
    'Camera on the approach path, not the plaza center or building pin.',
    'Facade fills most of the frame — immersive “portal” not postcard.',
    'Pitch ~18° so pediment sits high without cutting the roofline.',
    'Hero poster at 3s — full height, minimal lampposts.',
  ],
};

COLOSSEUM_FRAMING_REFERENCE.viewpointOffsetM = Math.round(
  getDistance(
    COLOSSEUM_FRAMING_REFERENCE.landmark.lat,
    COLOSSEUM_FRAMING_REFERENCE.landmark.lng,
    COLOSSEUM_FRAMING_REFERENCE.viewpoint.lat,
    COLOSSEUM_FRAMING_REFERENCE.viewpoint.lng
  )
);

export const FRAMING_TARGETS = {
  large_approach: {
    minViewpointOffsetM: 25,
    idealViewpointOffsetM: [40, 120],
    maxViewpointOffsetM: 180,
  },
  compact_piazza: {
    minViewpointOffsetM: 12,
    idealViewpointOffsetM: [18, 45],
    maxViewpointOffsetM: 70,
  },
  idealPitch: [14, 22],
  minPitch: 12,
};

export const getFramingTargets = (waypoint) =>
  waypoint?.framingProfile === 'compact_piazza'
    ? FRAMING_TARGETS.compact_piazza
    : FRAMING_TARGETS.large_approach;

export const MODERN_FRAMING_CHECKLIST = [
  'Stand on the approach path facing the facade — not the geographic center of the square.',
  'Walk Street View forward until the monument fills ~60–75% of frame height.',
  'Set pitch so the pediment/roofline is visible (usually 14–22° up).',
  'Keep viewpoint lat/lng different from landmark center (typically 25–120 m closer along the approach).',
  'Export 16:9; crop so facade is centered — avoid tiny-building “postcard” framing.',
  'Reject shots with buses, scaffolding, or lampposts cutting the hero facade.',
  'Match ancient layer to this exact POV — only the era changes.',
];

export const getViewpointOffsetM = (waypoint) => {
  const vp = waypoint?.viewpoint;
  if (!vp?.lat || !vp?.lng || !waypoint?.lat || !waypoint?.lng) return null;

  return getDistance(waypoint.lat, waypoint.lng, vp.lat, vp.lng);
};

export const assessModernFraming = (waypoint) => {
  const warnings = [];
  const tips = [];
  const offsetM = getViewpointOffsetM(waypoint);
  const pitch = waypoint?.viewpoint?.pitch;
  const targets = getFramingTargets(waypoint);
  const profileLabel =
    waypoint?.framingProfile === 'compact_piazza' ? 'compact piazza' : 'large approach';

  if (offsetM != null && offsetM < targets.minViewpointOffsetM) {
    warnings.push(
      `Viewpoint is only ~${offsetM} m from landmark center (${profileLabel} sites need ≥${targets.minViewpointOffsetM} m). The building may look too small — walk Street View closer to the facade along the approach.`
    );
  }

  if (offsetM != null && offsetM > targets.maxViewpointOffsetM) {
    warnings.push(
      `Viewpoint is ~${offsetM} m from landmark center — may feel too distant for a ${profileLabel} site. Move closer on the approach path.`
    );
  }

  if (pitch != null && pitch < FRAMING_TARGETS.minPitch) {
    warnings.push(
      `Pitch is ${pitch}° — lower than Colosseum (${COLOSSEUM_FRAMING_REFERENCE.pitch}°). Raise tilt so the facade fills more of the frame.`
    );
  }

  if (
    pitch != null &&
    pitch >= FRAMING_TARGETS.idealPitch[0] &&
    pitch <= FRAMING_TARGETS.idealPitch[1]
  ) {
    tips.push(
      `Pitch ${pitch}° is in the Colosseum-style range (${FRAMING_TARGETS.idealPitch[0]}–${FRAMING_TARGETS.idealPitch[1]}°).`
    );
  }

  if (
    offsetM != null &&
    offsetM >= targets.idealViewpointOffsetM[0] &&
    offsetM <= targets.idealViewpointOffsetM[1]
  ) {
    tips.push(
      `Viewpoint offset ~${offsetM} m fits the ${profileLabel} band (${targets.idealViewpointOffsetM[0]}–${targets.idealViewpointOffsetM[1]} m). Colosseum uses ~${COLOSSEUM_FRAMING_REFERENCE.viewpointOffsetM} m as a large-site reference.`
    );
  }

  return {
    offsetM,
    pitch,
    framingProfile: waypoint?.framingProfile ?? 'large_approach',
    colosseumReferenceOffsetM: COLOSSEUM_FRAMING_REFERENCE.viewpointOffsetM,
    colosseumReferencePitch: COLOSSEUM_FRAMING_REFERENCE.pitch,
    warnings,
    tips,
    passes: warnings.length === 0,
  };
};
