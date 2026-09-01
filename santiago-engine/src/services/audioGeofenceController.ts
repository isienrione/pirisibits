import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import {
  isHurryPace,
  isStationaryPace,
  normalizeInterests,
  ttsSpeedFromWalkingPace,
  type DiscoveryPostureId,
  type InterestId,
} from '@/src/data/algorithm';
import type { POIStop } from '@/src/data/pois';
import { narrativeScript } from '@/src/data/pois';
import type { TourStop } from '@/src/services/tourService';

export const GEOFENCE_TRIGGER_METERS = 25;
export const MODULE_A_MIN_MS = 20_000;
export const MODULE_A_MAX_MS = 30_000;
export const MODULE_C_LINGER_SECONDS = 15;

export type PlaybackModule =
  | 'idle'
  | 'module_a'
  | 'module_b'
  | 'module_c'
  | 'module_d'
  | 'completed';

export type NarrativeLens = {
  interests?: InterestId[];
  posture?: DiscoveryPostureId;
  nextTitle?: string;
  nextHint?: string;
};

export interface WalkState {
  currentStop: TourStop | null;
  currentModule: PlaybackModule;
  distanceToTargetMeters: number;
  userVelocityMps: number;
  isInsideTriggerZone: boolean;
  isStationary: boolean;
  isHurry: boolean;
  dwellSeconds: number;
  lingerRemainingSeconds: number;
  awaitingLinger: boolean;
  ttsRate: number;
  playing: boolean;
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function moduleBForLens(poi: POIStop, base: string, lens?: NarrativeLens): string {
  if (!lens) return base;
  const ids = normalizeInterests(lens.interests ?? []);
  const memory = ids.includes('memoria_ddhh');
  const civic = ids.includes('historia_civica');
  const arte = ids.includes('arte_visual');
  const parts = [base];
  if (memory && poi.quote) {
    parts.push(`Lente T1B · memoria. ${poi.quote.persona}: «${poi.quote.text}»`);
  } else if (civic && poi.archiveTranscript) {
    parts.push(`Lente T1A · historia cívica. ${poi.archiveTranscript}`);
  } else if (arte && poi.soundscapeLabel) {
    parts.push(`Lente estético: ${poi.soundscapeLabel}.`);
  }
  if (lens.posture === 'D2') {
    parts.push('Postura detective: qué no está en el mapa.');
  }
  return parts.join(' ');
}

function moduleDBridge(base: string, lens?: NarrativeLens): string {
  if (!lens?.nextTitle) return base;
  const hint = lens.nextHint ? ` ${lens.nextHint}` : '';
  return `${base} Puente al siguiente nodo: ${lens.nextTitle}.${hint}`;
}

export function poiToTourStop(poi: POIStop, orderIndex = 1, lens?: NarrativeLens): TourStop {
  const script = narrativeScript(poi);
  return {
    stop_id: poi.id,
    title: poi.title,
    order_index: orderIndex,
    latitude: poi.lat,
    longitude: poi.lng,
    radius_meters: poi.radius_meters ?? GEOFENCE_TRIGGER_METERS,
    module_a: script.A,
    module_b: moduleBForLens(poi, script.B, lens),
    module_c: script.C,
    module_d: moduleDBridge(script.D, lens),
  };
}

export function moduleTextFor(stop: TourStop | null, module: PlaybackModule): string {
  if (!stop) return '';
  if (module === 'module_b') return stop.module_b;
  if (module === 'module_c') return stop.module_c || '';
  if (module === 'module_d') return stop.module_d;
  if (module === 'module_a' || module === 'idle') return stop.module_a;
  return '';
}

export const MODULE_LABEL: Record<PlaybackModule, string> = {
  idle: 'En espera',
  module_a: 'Módulo A · Ancla visual',
  module_b: 'Módulo B · Núcleo narrativo',
  module_c: 'Módulo C · Detalle oculto',
  module_d: 'Módulo D · Puente espacial',
  completed: 'Narración completa',
};

function audioUrlFor(stop: TourStop, moduleName: PlaybackModule): string | undefined {
  if (moduleName === 'module_a') return stop.audio_a;
  if (moduleName === 'module_b') return stop.audio_b;
  if (moduleName === 'module_c') return stop.audio_c;
  if (moduleName === 'module_d') return stop.audio_d;
  return undefined;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ChronoAudioManager {
  private sound: Audio.Sound | null = null;
  private onStateChange: (state: Partial<WalkState>) => void;
  private dwellTimer: ReturnType<typeof setInterval> | null = null;
  private stationarySeconds = 0;
  private stop: TourStop | null = null;
  private velocityMps = 0;
  private currentModule: PlaybackModule = 'idle';
  private awaitingLinger = false;
  private moduleAStartedAt = 0;
  private session = 0;
  private aborted = false;

  constructor(onStateChange: (state: Partial<WalkState>) => void) {
    this.onStateChange = onStateChange;
  }

  setStop(stop: TourStop | null) {
    this.stop = stop;
    this.onStateChange({ currentStop: stop });
  }

  private ttsRate(v = this.velocityMps): number {
    return ttsSpeedFromWalkingPace(v);
  }

  updateVelocity(velocityMps: number) {
    this.velocityMps = velocityMps;
    const isStationary = isStationaryPace(velocityMps);
    const hurry = isHurryPace(velocityMps);
    if (!isStationary) this.stationarySeconds = 0;
    this.onStateChange({
      userVelocityMps: velocityMps,
      isStationary,
      isHurry: hurry,
      ttsRate: this.ttsRate(velocityMps),
    });
    if (this.sound) {
      void this.sound.setRateAsync(this.ttsRate(velocityMps), true);
    }
    if (this.awaitingLinger && (hurry || !isStationary)) {
      this.clearLinger();
      if (this.stop) void this.playModule(audioUrlFor(this.stop, 'module_d'), 'module_d', velocityMps);
    } else if (this.currentModule === 'module_c' && (hurry || !isStationary)) {
      if (this.stop) void this.playModule(audioUrlFor(this.stop, 'module_d'), 'module_d', velocityMps);
    }
  }

  async playModule(
    audioUrl: string | undefined,
    moduleName: PlaybackModule,
    velocityMps: number = this.velocityMps,
  ) {
    this.velocityMps = velocityMps;
    this.aborted = false;
    const session = ++this.session;
    this.currentModule = moduleName;
    this.awaitingLinger = false;
    Speech.stop();
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }

    this.onStateChange({
      currentModule: moduleName,
      playing: true,
      awaitingLinger: false,
      lingerRemainingSeconds: 0,
      ttsRate: this.ttsRate(velocityMps),
      isHurry: isHurryPace(velocityMps),
    });

    const text = moduleTextFor(this.stop, moduleName);
    const rate = this.ttsRate(velocityMps);

    if (audioUrl) {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, rate, shouldCorrectPitch: true },
        );
        if (session !== this.session || this.aborted) {
          await sound.unloadAsync();
          return;
        }
        this.sound = sound;
        this.sound.setOnPlaybackStatusUpdate(async (status) => {
          if (session !== this.session || this.aborted) return;
          if (status.isLoaded && status.didJustFinish) {
            this.onStateChange({ playing: false });
            await this.handleModuleFinish(moduleName, session);
          }
        });
        return;
      } catch (e) {
        console.warn(`Error reproduciendo ${moduleName}:`, e);
      }
    }

    if (!text) {
      this.onStateChange({ playing: false });
      await this.handleModuleFinish(moduleName, session);
      return;
    }

    Speech.speak(text, {
      language: 'es-CL',
      rate,
      onDone: () => {
        if (session !== this.session || this.aborted) return;
        this.onStateChange({ playing: false });
        void this.handleModuleFinish(moduleName, session);
      },
      onStopped: () => {
        if (session !== this.session) return;
        this.onStateChange({ playing: false });
      },
      onError: () => {
        if (session !== this.session || this.aborted) return;
        this.onStateChange({ playing: false });
        void this.handleModuleFinish(moduleName, session);
      },
    });
  }

  async playModuleA() {
    if (!this.stop) return;
    this.moduleAStartedAt = Date.now();
    await this.playModule(this.stop.audio_a, 'module_a', this.velocityMps);
  }

  private async handleModuleFinish(finishedModule: PlaybackModule, session: number) {
    if (!this.stop || this.aborted || session !== this.session) return;

    if (finishedModule === 'module_a') {
      const elapsed = Date.now() - this.moduleAStartedAt;
      const hold = Math.max(0, MODULE_A_MIN_MS - elapsed);
      if (hold > 0) {
        this.onStateChange({ playing: false, currentModule: 'module_a' });
        const until = Date.now() + hold;
        while (Date.now() < until) {
          if (this.aborted || session !== this.session) return;
          await wait(120);
        }
        if (this.aborted || session !== this.session) return;
      }
      await this.playModule(audioUrlFor(this.stop, 'module_b'), 'module_b', this.velocityMps);
      return;
    }

    if (finishedModule === 'module_b') {
      if (isHurryPace(this.velocityMps) || !isStationaryPace(this.velocityMps)) {
        await this.playModule(audioUrlFor(this.stop, 'module_d'), 'module_d', this.velocityMps);
        return;
      }
      this.startLingerDetection();
      return;
    }

    if (finishedModule === 'module_c') {
      await this.playModule(audioUrlFor(this.stop, 'module_d'), 'module_d', this.velocityMps);
      return;
    }

    if (finishedModule === 'module_d') {
      this.currentModule = 'completed';
      this.onStateChange({ currentModule: 'completed', playing: false, awaitingLinger: false });
    }
  }

  private clearLinger() {
    if (this.dwellTimer) clearInterval(this.dwellTimer);
    this.dwellTimer = null;
    this.awaitingLinger = false;
    this.stationarySeconds = 0;
  }

  private startLingerDetection() {
    this.clearLinger();
    if (isHurryPace(this.velocityMps) || !isStationaryPace(this.velocityMps)) {
      if (this.stop) void this.playModule(audioUrlFor(this.stop, 'module_d'), 'module_d', this.velocityMps);
      return;
    }

    this.awaitingLinger = true;
    this.stationarySeconds = 0;
    this.onStateChange({
      awaitingLinger: true,
      isStationary: true,
      dwellSeconds: 0,
      lingerRemainingSeconds: MODULE_C_LINGER_SECONDS,
      playing: false,
    });

    this.dwellTimer = setInterval(() => {
      if (!this.awaitingLinger || !this.stop) return;
      if (isHurryPace(this.velocityMps) || !isStationaryPace(this.velocityMps)) {
        this.clearLinger();
        void this.playModule(audioUrlFor(this.stop, 'module_d'), 'module_d', this.velocityMps);
        return;
      }
      this.stationarySeconds += 1;
      const remaining = Math.max(0, MODULE_C_LINGER_SECONDS - this.stationarySeconds);
      this.onStateChange({
        dwellSeconds: this.stationarySeconds,
        lingerRemainingSeconds: remaining,
        isStationary: true,
        awaitingLinger: true,
      });
      if (this.stationarySeconds >= MODULE_C_LINGER_SECONDS) {
        this.clearLinger();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        void this.playModule(audioUrlFor(this.stop, 'module_c'), 'module_c', this.velocityMps);
      }
    }, 1000);
  }

  async triggerArrival() {
    if (!this.stop) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.playModuleA();
  }

  async stopPlayback() {
    this.aborted = true;
    this.session += 1;
    this.clearLinger();
    this.currentModule = 'idle';
    Speech.stop();
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.onStateChange({
      currentModule: 'idle',
      playing: false,
      dwellSeconds: 0,
      lingerRemainingSeconds: 0,
      awaitingLinger: false,
    });
  }
}

const initialWalk: WalkState = {
  currentStop: null,
  currentModule: 'idle',
  distanceToTargetMeters: Number.POSITIVE_INFINITY,
  userVelocityMps: 0,
  isInsideTriggerZone: false,
  isStationary: false,
  isHurry: false,
  dwellSeconds: 0,
  lingerRemainingSeconds: 0,
  awaitingLinger: false,
  ttsRate: 1,
  playing: false,
};

export function useAudioGeofence(
  poi: POIStop | null,
  options?: {
    nextPoi?: POIStop | null;
    interests?: InterestId[];
    posture?: DiscoveryPostureId;
  },
) {
  const [walk, setWalk] = useState<WalkState>(initialWalk);
  const walkRef = useRef(walk);
  const managerRef = useRef<ChronoAudioManager | null>(null);
  const triggeredFor = useRef<string | null>(null);
  const nextTitle = options?.nextPoi?.title;
  const nextHint = options?.nextPoi?.directionHint;
  const interestsKey = (options?.interests ?? []).join(',');
  const posture = options?.posture;

  walkRef.current = walk;
  const stop = useMemo(
    () =>
      poi
        ? poiToTourStop(poi, 1, {
            interests: options?.interests,
            posture,
            nextTitle,
            nextHint,
          })
        : null,
    [poi, interestsKey, posture, nextTitle, nextHint],
  );
  const stopId = stop?.stop_id;
  const radius = GEOFENCE_TRIGGER_METERS;

  useEffect(() => {
    const manager = new ChronoAudioManager((partial) => {
      setWalk((prev) => ({ ...prev, ...partial }));
    });
    managerRef.current = manager;
    return () => {
      void manager.stopPlayback();
      managerRef.current = null;
    };
  }, []);

  useEffect(() => {
    managerRef.current?.setStop(stop ?? null);
  }, [stop]);

  useEffect(() => {
    triggeredFor.current = null;
    setWalk((prev) => ({
      ...prev,
      currentStop: stop ?? null,
      currentModule: 'idle',
      isInsideTriggerZone: false,
      dwellSeconds: 0,
      lingerRemainingSeconds: 0,
      awaitingLinger: false,
    }));
  }, [stopId]);

  const enterZone = useCallback(async () => {
    const current = walkRef.current;
    if (!stop || current.currentModule !== 'idle') return;
    if (triggeredFor.current === stop.stop_id) return;
    triggeredFor.current = stop.stop_id;
    setWalk((prev) => ({
      ...prev,
      isInsideTriggerZone: true,
      distanceToTargetMeters: Math.min(prev.distanceToTargetMeters, radius),
    }));
    await managerRef.current?.triggerArrival();
  }, [radius, stop]);

  useEffect(() => {
    if (!stop) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled || status !== 'granted') return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 3 },
        (loc) => {
          const distance = calculateDistanceMeters(
            loc.coords.latitude,
            loc.coords.longitude,
            stop.latitude,
            stop.longitude,
          );
          const speed = loc.coords.speed && loc.coords.speed > 0 ? loc.coords.speed : 0;
          managerRef.current?.updateVelocity(speed);
          const inside = distance <= radius;
          setWalk((prev) => ({
            ...prev,
            distanceToTargetMeters: distance,
            userVelocityMps: speed,
            isInsideTriggerZone: inside,
            isStationary: isStationaryPace(speed),
            isHurry: isHurryPace(speed),
            ttsRate: ttsSpeedFromWalkingPace(speed),
          }));
          if (inside && walkRef.current.currentModule === 'idle') {
            void enterZone();
          }
        },
      );
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enterZone, radius, stop?.latitude, stop?.longitude, stop?.stop_id]);

  const simulateArrival = useCallback(async () => {
    walkRef.current = {
      ...walkRef.current,
      currentModule: 'idle',
      distanceToTargetMeters: GEOFENCE_TRIGGER_METERS,
      isInsideTriggerZone: true,
    };
    triggeredFor.current = null;
    managerRef.current?.updateVelocity(0);
    setWalk((prev) => ({
      ...prev,
      currentModule: 'idle',
      distanceToTargetMeters: GEOFENCE_TRIGGER_METERS,
      isInsideTriggerZone: true,
      isStationary: true,
      isHurry: false,
    }));
    await enterZone();
  }, [enterZone]);

  return {
    walk,
    simulateArrival,
    enterZone,
    stopPlayback: () => managerRef.current?.stopPlayback(),
    moduleText: moduleTextFor(stop, walk.currentModule),
    moduleLabel: MODULE_LABEL[walk.currentModule],
  };
}
