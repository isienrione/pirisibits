export const getModernSliderUrl = (waypoint) =>
  waypoint?.modern_video_url || waypoint?.modern_image_url || null;

export const getAncientSliderUrl = (waypoint) =>
  waypoint?.ancient_video_url || waypoint?.ancient_image_url || null;

export const hasModernSliderMedia = (waypoint) => Boolean(getModernSliderUrl(waypoint));

/** Hero frame used for poster stills after the animation finishes. Override with ?posterAt= or ?freezeAt= */
export const resolveSliderPosterAtSec = (waypointValue) => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    for (const key of ['posterAt', 'freezeAt']) {
      const param = params.get(key);
      if (param != null && param !== '') {
        const parsed = Number(param);
        if (Number.isFinite(parsed) && parsed >= 0) return parsed;
      }
    }
  }

  if (typeof waypointValue === 'number' && Number.isFinite(waypointValue) && waypointValue >= 0) {
    return waypointValue;
  }

  return null;
};

/** @deprecated Use resolveSliderPosterAtSec */
export const resolveSliderFreezeAtSec = resolveSliderPosterAtSec;

/** Extra loop time after the first animation playthrough before poster stills. Override with ?loopMs= */
export const resolveSliderPostAnimationLoopMs = (waypointValue) => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    for (const key of ['loopMs', 'holdMs']) {
      const param = params.get(key);
      if (param != null && param !== '') {
        const parsed = Number(param);
        if (Number.isFinite(parsed) && parsed >= 0) return parsed;
      }
    }
  }

  if (typeof waypointValue === 'number' && Number.isFinite(waypointValue) && waypointValue >= 0) {
    return waypointValue;
  }

  return 10000;
};

/** @deprecated Use resolveSliderPostAnimationLoopMs */
export const resolveSliderPostAnimationHoldMs = resolveSliderPostAnimationLoopMs;

export const getModernPosterUrl = (waypoint) => waypoint?.modern_poster_url || null;

export const getAncientPosterUrl = (waypoint) => waypoint?.ancient_poster_url || null;
