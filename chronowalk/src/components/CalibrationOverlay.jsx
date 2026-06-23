import React from 'react';
import { DEFAULT_CALIBRATION } from '../utils/calibrationStorage';

const OFFSET_MIN = -120;
const OFFSET_MAX = 120;
const ROTATE_MIN = -20;
const ROTATE_MAX = 20;

const CalibrationOverlay = ({ calibration, onChange, onLock, onReset }) => {
  const values = calibration ?? DEFAULT_CALIBRATION;

  const updateField = (field, nextValue) => {
    onChange?.({
      ...values,
      [field]: Number(nextValue),
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-amber-400/30 bg-stone-950/80 p-4">
      <div className="mb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          Ghost alignment
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-300">
          Line up the ancient reconstruction with the modern facade, then lock your alignment.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-xs text-stone-300">
          <span className="mb-2 flex items-center justify-between">
            <span>Horizontal offset</span>
            <span className="font-mono text-amber-200">{values.offsetX}px</span>
          </span>
          <input
            type="range"
            min={OFFSET_MIN}
            max={OFFSET_MAX}
            step={1}
            value={values.offsetX}
            onChange={(event) => updateField('offsetX', event.target.value)}
            className="w-full accent-amber-400"
          />
        </label>

        <label className="block text-xs text-stone-300">
          <span className="mb-2 flex items-center justify-between">
            <span>Vertical offset</span>
            <span className="font-mono text-amber-200">{values.offsetY}px</span>
          </span>
          <input
            type="range"
            min={OFFSET_MIN}
            max={OFFSET_MAX}
            step={1}
            value={values.offsetY}
            onChange={(event) => updateField('offsetY', event.target.value)}
            className="w-full accent-amber-400"
          />
        </label>

        <label className="block text-xs text-stone-300">
          <span className="mb-2 flex items-center justify-between">
            <span>Rotation</span>
            <span className="font-mono text-amber-200">{values.rotate}°</span>
          </span>
          <input
            type="range"
            min={ROTATE_MIN}
            max={ROTATE_MAX}
            step={0.5}
            value={values.rotate}
            onChange={(event) => updateField('rotate', event.target.value)}
            className="w-full accent-amber-400"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onLock}
          className="flex-1 rounded-full bg-amber-500 px-4 py-3 text-sm font-bold text-gray-900 transition hover:bg-amber-400"
        >
          Lock alignment
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-stone-600 px-4 py-3 text-sm font-medium text-stone-300 transition hover:border-amber-400/40 hover:text-amber-100"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default CalibrationOverlay;
