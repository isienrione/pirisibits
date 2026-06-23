import { describe, expect, it, beforeEach } from 'vitest';
import {
  DEFAULT_CALIBRATION,
  buildCalibrationTransform,
  composeLayerTransform,
  getCalibrationStorageKey,
  loadCalibration,
  normalizeCalibration,
  resetCalibration,
  saveCalibration,
} from '../calibrationStorage';

describe('calibrationStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('builds a calibration transform from offsets and rotation', () => {
    expect(buildCalibrationTransform({ offsetX: 12, offsetY: -4, rotate: 2 })).toBe(
      'translate3d(12px, -4px, 0) rotate(2deg)'
    );
  });

  it('returns undefined for the default calibration', () => {
    expect(buildCalibrationTransform(DEFAULT_CALIBRATION)).toBeUndefined();
  });

  it('composes calibration before parallax transforms', () => {
    expect(
      composeLayerTransform(
        { offsetX: 10, offsetY: 0, rotate: 1 },
        'perspective(900px) rotateX(2deg) translate3d(4px, 0, 0)'
      )
    ).toBe(
      'translate3d(10px, 0px, 0) rotate(1deg) perspective(900px) rotateX(2deg) translate3d(4px, 0, 0)'
    );
  });

  it('loads, saves, and resets waypoint-specific calibration', () => {
    const key = getCalibrationStorageKey('colosseum');
    const saved = { offsetX: 6, offsetY: -3, rotate: 1.5 };

    expect(loadCalibration('colosseum')).toEqual(DEFAULT_CALIBRATION);
    expect(saveCalibration('colosseum', saved)).toBe(true);
    expect(window.localStorage.getItem(key)).toBe(JSON.stringify(normalizeCalibration(saved)));
    expect(loadCalibration('colosseum')).toEqual(normalizeCalibration(saved));
    expect(resetCalibration('colosseum')).toEqual(DEFAULT_CALIBRATION);
    expect(window.localStorage.getItem(key)).toBeNull();
  });
});
