export const getModernSliderUrl = (waypoint) =>
  waypoint?.modern_video_url || waypoint?.modern_image_url || null;

export const getAncientSliderUrl = (waypoint) =>
  waypoint?.ancient_video_url || waypoint?.ancient_image_url || null;

export const hasModernSliderMedia = (waypoint) => Boolean(getModernSliderUrl(waypoint));
