import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { ttsSpeedFromWalkingPace } from '@/src/data/algorithm';
import { narrativeScript, type POIStop } from '@/src/data/pois';

export type AudioModuleId = 'idle' | 'A' | 'B' | 'C' | 'D' | 'done';

export function ttsRateFromWalkingSpeed(metersPerSecond: number): number {
  return ttsSpeedFromWalkingPace(metersPerSecond);
}

type ControllerOptions = {
  poi: POIStop | null;
  walkingPaceMs: number;
  autoStart?: boolean;
  onModuleChange?: (module: AudioModuleId) => void;
};

export function useDynamicAudio({
  poi,
  walkingPaceMs,
  autoStart = false,
  onModuleChange,
}: ControllerOptions) {
  const [module, setModule] = useState<AudioModuleId>('idle');
  const [playing, setPlaying] = useState(false);
  const [awaitingLinger, setAwaitingLinger] = useState(false);
  const lingerRef = useRef(0);
  const poiId = poi?.id;

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      Speech.stop();
      const rate = ttsRateFromWalkingSpeed(walkingPaceMs);
      Speech.speak(text, {
        language: 'es-CL',
        rate,
        onStart: () => setPlaying(true),
        onDone: () => {
          setPlaying(false);
          onDone?.();
        },
        onStopped: () => setPlaying(false),
        onError: () => {
          setPlaying(false);
          onDone?.();
        },
      });
    },
    [walkingPaceMs],
  );

  const go = useCallback(
    (next: AudioModuleId) => {
      setModule(next);
      onModuleChange?.(next);
    },
    [onModuleChange],
  );

  const playD = useCallback(() => {
    if (!poi) return;
    setAwaitingLinger(false);
    go('D');
    speak(narrativeScript(poi).D, () => go('done'));
  }, [go, poi, speak]);

  const start = useCallback(() => {
    if (!poi) return;
    const script = narrativeScript(poi);
    lingerRef.current = 0;
    setAwaitingLinger(false);
    go('A');
    speak(script.A, () => {
      go('B');
      speak(script.B, () => {
        lingerRef.current = 0;
        if (walkingPaceMs >= 0.35) {
          playD();
          return;
        }
        setAwaitingLinger(true);
      });
    });
  }, [go, playD, poi, speak, walkingPaceMs]);

  useEffect(() => {
    if (autoStart && poi) start();
    return () => {
      Speech.stop();
    };
  }, [autoStart, poiId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!awaitingLinger || playing) return;
    if (walkingPaceMs >= 0.35) {
      setAwaitingLinger(false);
      playD();
      return;
    }
    const id = setInterval(() => {
      if (walkingPaceMs < 0.35) lingerRef.current += 250;
      else lingerRef.current = 0;
      if (lingerRef.current >= 15000 && poi) {
        clearInterval(id);
        setAwaitingLinger(false);
        go('C');
        speak(narrativeScript(poi).C, () => playD());
      }
    }, 250);
    return () => clearInterval(id);
  }, [awaitingLinger, go, playing, playD, poi, speak, walkingPaceMs]);

  const skipToNext = useCallback(() => {
    if (!poi) return;
    if (module === 'A') {
      go('B');
      speak(narrativeScript(poi).B, () => go('idle'));
      return;
    }
    if (module === 'B' || module === 'idle' || awaitingLinger) {
      setAwaitingLinger(false);
      playD();
      return;
    }
    if (module === 'C') {
      playD();
    }
  }, [go, module, playD, poi, speak]);

  const stop = useCallback(() => {
    Speech.stop();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      stop();
      return;
    }
    if (module === 'idle' || module === 'done') start();
    else if (poi && (module === 'A' || module === 'B' || module === 'C' || module === 'D')) {
      speak(narrativeScript(poi)[module]);
    }
  }, [module, playing, poi, speak, start, stop]);

  return {
    module: module === 'idle' && !playing ? (poi ? 'idle' : 'idle') : module,
    playing,
    start,
    stop,
    toggle,
    skipToNext,
    playD,
    rate: ttsRateFromWalkingSpeed(walkingPaceMs),
  };
}

export const DynamicAudioController = {
  ttsRateFromWalkingSpeed,
  stop: () => Speech.stop(),
};
