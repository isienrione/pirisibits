import { DEFAULT_CALIBRATION } from '../utils/calibrationStorage';
import { Button, SectionHeader } from './ui';

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
    <div className="bg-ink900 rounded-card mt-4 border-ember/25 bg-ink800/30 p-4">
      <SectionHeader
        className="mb-4"
        eyebrow="Ghost alignment"
        subtitle="Line up the ancient reconstruction with the modern facade, then lock your alignment."
      />

      <div className="space-y-4">
        <label className="block text-xs text-muted">
          <span className="mb-2 flex items-center justify-between">
            <span>Horizontal offset</span>
            <span className="font-mono text-ember">{values.offsetX}px</span>
          </span>
          <input
            type="range"
            min={OFFSET_MIN}
            max={OFFSET_MAX}
            step={1}
            value={values.offsetX}
            onChange={(event) => updateField('offsetX', event.target.value)}
            className="w-full"
          />
        </label>

        <label className="block text-xs text-muted">
          <span className="mb-2 flex items-center justify-between">
            <span>Vertical offset</span>
            <span className="font-mono text-ember">{values.offsetY}px</span>
          </span>
          <input
            type="range"
            min={OFFSET_MIN}
            max={OFFSET_MAX}
            step={1}
            value={values.offsetY}
            onChange={(event) => updateField('offsetY', event.target.value)}
            className="w-full"
          />
        </label>

        <label className="block text-xs text-muted">
          <span className="mb-2 flex items-center justify-between">
            <span>Rotation</span>
            <span className="font-mono text-ember">{values.rotate}°</span>
          </span>
          <input
            type="range"
            min={ROTATE_MIN}
            max={ROTATE_MAX}
            step={0.5}
            value={values.rotate}
            onChange={(event) => updateField('rotate', event.target.value)}
            className="w-full"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1 rounded-full" onClick={onLock}>
          Lock alignment
        </Button>
        <Button variant="quiet" className="rounded-full" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
};

export default CalibrationOverlay;
