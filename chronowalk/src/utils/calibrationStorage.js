export const DEFAULT_CALIBRATION = {
  offsetX: 0,
  offsetY: 0,
  rotate: 0,
};

const STORAGE_PREFIX = 'chronowalk:calibration:';

export const getCalibrationStorageKey = (waypointId) =>
  `${STORAGE_PREFIX}${waypointId}`;

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeCalibration = (value = {}) => ({
  offsetX: normalizeNumber(value.offsetX, DEFAULT_CALIBRATION.offsetX),
  offsetY: normalizeNumber(value.offsetY, DEFAULT_CALIBRATION.offsetY),
  rotate: normalizeNumber(value.rotate, DEFAULT_CALIBRATION.rotate),
});

export const buildCalibrationTransform = (calibration = DEFAULT_CALIBRATION) => {
  const { offsetX, offsetY, rotate } = normalizeCalibration(calibration);

  if (!offsetX && !offsetY && !rotate) return undefined;

  return `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotate}deg)`;
};

/** User calibration is applied first, then optional device-tilt parallax. */
export const composeLayerTransform = (calibration, parallaxTransform) => {
  const calibrationTransform = buildCalibrationTransform(calibration);
  const parts = [calibrationTransform, parallaxTransform].filter(Boolean);
  return parts.length ? parts.join(' ') : undefined;
};

export const loadCalibration = (waypointId) => {
  if (!waypointId || typeof window === 'undefined') {
    return { ...DEFAULT_CALIBRATION };
  }

  try {
    const raw = window.localStorage.getItem(getCalibrationStorageKey(waypointId));
    if (!raw) return { ...DEFAULT_CALIBRATION };

    return normalizeCalibration(JSON.parse(raw));
  } catch (error) {
    console.warn('calibrationStorage: failed to load calibration.', error);
    return { ...DEFAULT_CALIBRATION };
  }
};

export const saveCalibration = (waypointId, calibration) => {
  if (!waypointId || typeof window === 'undefined') return false;

  try {
    const normalized = normalizeCalibration(calibration);
    window.localStorage.setItem(
      getCalibrationStorageKey(waypointId),
      JSON.stringify(normalized)
    );
    return true;
  } catch (error) {
    console.warn('calibrationStorage: failed to save calibration.', error);
    return false;
  }
};

export const resetCalibration = (waypointId) => {
  if (!waypointId || typeof window === 'undefined') return { ...DEFAULT_CALIBRATION };

  try {
    window.localStorage.removeItem(getCalibrationStorageKey(waypointId));
  } catch (error) {
    console.warn('calibrationStorage: failed to reset calibration.', error);
  }

  return { ...DEFAULT_CALIBRATION };
};
