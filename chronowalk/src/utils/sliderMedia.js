export const getModernSliderUrl = (waypoint) =>
  waypoint?.modern_video_url || waypoint?.modern_image_url || null;

export const getAncientSliderUrl = (waypoint) =>
  waypoint?.ancient_video_url || waypoint?.ancient_image_url || null;

export const hasModernSliderMedia = (waypoint) => Boolean(getModernSliderUrl(waypoint));

/** Seconds into the clip where both videos freeze (full Colosseum framing). Override with ?freezeAt= */
export const resolveSliderFreezeAtSec = (waypointValue) => {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('freezeAt');
    if (param != null && param !== '') {
      const parsed = Number(param);
      if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }
  }

  if (typeof waypointValue === 'number' && Number.isFinite(waypointValue) && waypointValue >= 0) {
    return waypointValue;
  }

  return null;
};

export const getModernPosterUrl = (waypoint) => waypoint?.modern_poster_url || null;

export const getAncientPosterUrl = (waypoint) => waypoint?.ancient_poster_url || null;
