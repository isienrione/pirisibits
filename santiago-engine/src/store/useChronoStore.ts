import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  buildSolverPayload,
  DISCOVERY_POSTURES,
  MOBILITY_ARCHETYPES,
  normalizeInterests,
  snapTimeBudget,
  MAX_MICRO_INTERESTS,
  isMicroInterest,
  type DiscoveryPostureId,
  type ExplorerRhythm,
  type InterestId,
  type MobilityArchetypeId,
  type SolverPayload,
} from '@/src/data/algorithm';
import { getPoiById, type POIStop } from '@/src/data/pois';
import {
  generateItinerary,
  profileFromInputs,
  remainingMinutesForTour,
  type GeneratedTour,
  type UserProfile5D,
} from '@/src/services/routeEngine';
import { DEFAULT_TOUR_ID, manifestToTour, type TourStop } from '@/src/services/tourService';

export type WalkStatus = 'idle' | 'proposed' | 'active' | 'paused' | 'completed';

export type UserJournal = {
  date: string;
  headline: string;
  placesVisited: string[];
  totalDistanceKm: number;
  totalMinutes: number;
  steps: number;
  personalNotes: Record<string, string>;
};

export type SavedItems = {
  poiIds: string[];
  customRouteIds: string[];
};

export type OfflineDownloads = {
  santiagoDownloaded: boolean;
  progressPct: number;
};

type ChronoState = {
  hasHydrated: boolean;
  onboardingComplete: boolean;
  interests: InterestId[];
  rhythm: ExplorerRhythm;
  mobilityArchetype: MobilityArchetypeId;
  walkChunkMinutes: number;
  useMetro: boolean;
  avoidStairs: boolean;
  timeBudgetMinutes: number;
  stayDays: number;
  locationEnabled: boolean;
  memorySitesOptIn: boolean;
  language: 'ES' | 'EN';
  status: WalkStatus;
  audioPlaying: boolean;
  audioSeconds: number;
  walkingPaceMs: number;
  catalogPois: POIStop[];
  /** knapsack auto-rebuilds on profile change; curated/manual stay until the user asks. */
  itinerarySource: 'knapsack' | 'curated' | 'manual';
  activeTour: GeneratedTour | null;
  userJournal: UserJournal;
  savedItems: SavedItems;
  offlineDownloads: OfflineDownloads;
};

type ChronoActions = {
  setHasHydrated: (v: boolean) => void;
  toggleInterest: (id: InterestId) => void;
  setRhythm: (rhythm: ExplorerRhythm) => void;
  setDiscoveryPosture: (posture: DiscoveryPostureId) => void;
  setMobilityArchetype: (id: MobilityArchetypeId) => void;
  setWalkChunkMinutes: (n: number) => void;
  setUseMetro: (v: boolean) => void;
  setAvoidStairs: (v: boolean) => void;
  setTimeBudgetMinutes: (n: number) => void;
  setStayDays: (n: number) => void;
  setLocationEnabled: (v: boolean) => void;
  setMemorySitesOptIn: (v: boolean) => void;
  hydrateCatalog: (pois: POIStop[]) => void;
  setLanguage: (lang: 'ES' | 'EN') => void;
  setStatus: (s: WalkStatus) => void;
  setCurrentStopIndex: (n: number) => void;
  toggleAudio: () => void;
  setAudioPlaying: (v: boolean) => void;
  setAudioSeconds: (n: number) => void;
  setWalkingPaceMs: (n: number) => void;
  generateTour: () => GeneratedTour;
  applyTourManifest: (rows: TourStop[]) => void;
  startFromStop: (index: number) => void;
  completeOnboarding: (locationEnabled: boolean) => GeneratedTour;
  startTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  completeCurrentStop: () => { done: boolean; next?: POIStop };
  chooseBifurcation: (poiId: string) => void;
  addPoiToTour: (poiId: string) => boolean;
  applyCuratedStops: (poiIds: string[], title: string) => void;
  toggleSavedPoi: (poiId: string) => void;
  saveCurrentTour: () => void;
  addJournalNote: (text: string) => void;
  closeDay: (note?: string) => void;
  startOfflineDownload: () => void;
  setOfflineProgress: (pct: number) => void;
};

export type ChronoStore = ChronoState & ChronoActions;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyJournal(): UserJournal {
  return {
    date: todayIso(),
    headline: 'Caminé por un Santiago que no conocía',
    placesVisited: [],
    totalDistanceKm: 0,
    totalMinutes: 0,
    steps: 0,
    personalNotes: {},
  };
}

const initialState: ChronoState = {
  hasHydrated: false,
  onboardingComplete: false,
  interests: ['historia_civica', 'arq_monumental', 'arte_visual'],
  rhythm: 'equilibrado',
  mobilityArchetype: 'M3',
  walkChunkMinutes: 30,
  useMetro: true,
  avoidStairs: false,
  timeBudgetMinutes: 105,
  stayDays: 3,
  locationEnabled: false,
  memorySitesOptIn: false,
  language: 'ES',
  status: 'idle',
  audioPlaying: false,
  audioSeconds: 0,
  walkingPaceMs: 1.2,
  catalogPois: [],
  itinerarySource: 'knapsack',
  activeTour: null,
  userJournal: emptyJournal(),
  savedItems: { poiIds: [], customRouteIds: [] },
  offlineDownloads: { santiagoDownloaded: false, progressPct: 0 },
};

function userProfileFrom(s: ChronoState): UserProfile5D {
  return profileFromInputs({
    interests: s.interests,
    rhythm: s.rhythm,
    timeBudgetMinutes: s.timeBudgetMinutes,
    walkChunkMinutes: s.walkChunkMinutes,
    useMetro: s.useMetro,
    avoidStairs: s.avoidStairs,
    stayDays: s.stayDays,
    locationEnabled: s.locationEnabled,
    memorySitesOptIn: s.memorySitesOptIn,
    mobilityArchetype: s.mobilityArchetype,
  });
}

export const useChronoStore = create<ChronoStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      toggleInterest: (id) => {
        const prev = get().interests.filter((x) => isMicroInterest(x) || x === id);
        const unique = Array.from(new Set(prev));
        let next = unique;
        if (unique.includes(id)) next = unique.filter((x) => x !== id);
        else if (unique.length < MAX_MICRO_INTERESTS) next = [...unique, id];
        set({ interests: next });
      },
      setRhythm: (rhythm) => set({ rhythm }),
      setDiscoveryPosture: (posture) => set({ rhythm: DISCOVERY_POSTURES[posture].rhythm }),
      setMobilityArchetype: (id) => {
        const arch = MOBILITY_ARCHETYPES[id];
        set({
          mobilityArchetype: id,
          avoidStairs: arch.avoidStairs,
          walkChunkMinutes: arch.walkChunkMinutes,
          useMetro: arch.useMetro,
        });
      },
      setWalkChunkMinutes: (n) => set({ walkChunkMinutes: n }),
      setUseMetro: (v) => set({ useMetro: v }),
      setAvoidStairs: (v) => set({ avoidStairs: v }),
      setTimeBudgetMinutes: (n) => set({ timeBudgetMinutes: snapTimeBudget(n) }),
      setStayDays: (n) => set({ stayDays: n }),
      setLocationEnabled: (v) => set({ locationEnabled: v }),
      setMemorySitesOptIn: (v) => set({ memorySitesOptIn: v }),
      hydrateCatalog: (pois) => {
        const prev = get().catalogPois;
        if (prev.length === pois.length && prev.every((p, i) => p.id === pois[i]?.id)) return;
        set({ catalogPois: pois });
      },
      setLanguage: (language) => set({ language }),
      setStatus: (status) => {
        const tour = get().activeTour;
        if (status === 'paused' && tour) {
          set({ status, activeTour: { ...tour, isPaused: true } });
          return;
        }
        if (status === 'active' && tour) {
          set({
            status,
            activeTour: {
              ...tour,
              isPaused: false,
              startTime: tour.startTime || Date.now(),
            },
          });
          return;
        }
        set({ status });
      },
      setCurrentStopIndex: (n) => {
        const tour = get().activeTour;
        const max = Math.max(0, (tour?.stops.length ?? 1) - 1);
        const idx = Math.max(0, Math.min(max, n));
        set({
          activeTour: tour ? { ...tour, currentStopIndex: idx } : tour,
        });
      },
      toggleAudio: () => set({ audioPlaying: !get().audioPlaying }),
      setAudioPlaying: (v) => set({ audioPlaying: v }),
      setAudioSeconds: (n) => set({ audioSeconds: n }),
      setWalkingPaceMs: (n) => set({ walkingPaceMs: n }),
      generateTour: () => {
        const catalog = get().catalogPois.length ? get().catalogPois : undefined;
        const tour = generateItinerary(userProfileFrom(get()), undefined, catalog);
        set({ activeTour: tour, status: 'proposed', itinerarySource: 'knapsack' });
        return tour;
      },
      applyTourManifest: (rows) => {
        const next = manifestToTour(rows, DEFAULT_TOUR_ID);
        const prev = get().activeTour;
        const keep =
          prev &&
          prev.tourId === DEFAULT_TOUR_ID &&
          (get().status === 'active' || get().status === 'paused');
        set({
          activeTour: keep
            ? {
                ...next,
                currentStopIndex: Math.min(prev.currentStopIndex, Math.max(0, next.stops.length - 1)),
                completedStops: prev.completedStops,
                isPaused: prev.isPaused,
                startTime: prev.startTime,
              }
            : next,
          status: keep ? get().status : 'proposed',
        });
      },
      startFromStop: (index) => {
        const tour = get().activeTour;
        if (!tour || !tour.stops.length) return;
        const currentStopIndex = Math.max(0, Math.min(tour.stops.length - 1, index));
        set({
          status: 'active',
          activeTour: {
            ...tour,
            currentStopIndex,
            isPaused: false,
            startTime: tour.startTime || Date.now(),
          },
        });
      },
      completeOnboarding: (locationEnabled) => {
        set({
          onboardingComplete: true,
          locationEnabled,
          interests: normalizeInterests(get().interests),
          timeBudgetMinutes: snapTimeBudget(get().timeBudgetMinutes),
        });
        return get().generateTour();
      },
      startTour: () => {
        const tour = get().activeTour ?? get().generateTour();
        set({
          status: 'active',
          activeTour: {
            ...tour,
            isPaused: false,
            startTime: Date.now(),
          },
        });
      },
      pauseTour: () => {
        const tour = get().activeTour;
        if (!tour) return;
        set({ status: 'paused', activeTour: { ...tour, isPaused: true } });
      },
      resumeTour: () => {
        const tour = get().activeTour;
        if (!tour) return;
        set({ status: 'active', activeTour: { ...tour, isPaused: false } });
      },
      completeCurrentStop: () => {
        const tour = get().activeTour;
        if (!tour) return { done: true };
        const current = tour.stops[tour.currentStopIndex];
        const completedStops = current
          ? Array.from(new Set([...tour.completedStops, current.id]))
          : tour.completedStops;
        const journal = get().userJournal;
        const placesVisited = current
          ? Array.from(new Set([...journal.placesVisited, current.id]))
          : journal.placesVisited;
        const isLast = tour.currentStopIndex >= tour.stops.length - 1;
        const nextIndex = isLast ? tour.currentStopIndex : tour.currentStopIndex + 1;
        set({
          activeTour: { ...tour, completedStops, currentStopIndex: nextIndex },
          userJournal: {
            ...journal,
            date: todayIso(),
            placesVisited,
            totalDistanceKm: tour.distanceKm,
            totalMinutes: tour.totalMinutes,
            steps: Math.round(tour.distanceKm * 1350),
          },
          status: isLast ? 'completed' : get().status,
        });
        return {
          done: isLast,
          next: isLast ? undefined : tour.stops[nextIndex],
        };
      },
      chooseBifurcation: (poiId) => {
        const tour = get().activeTour;
        const poi = getPoiById(poiId);
        if (!tour || !poi) return;
        const idx = tour.currentStopIndex;
        const already = tour.stops.findIndex((s) => s.id === poiId);
        let stops = [...tour.stops];
        if (already >= 0) {
          const [picked] = stops.splice(already, 1);
          stops.splice(Math.min(idx + 1, stops.length), 0, picked);
        } else {
          stops.splice(idx + 1, 0, poi);
        }
        set({ activeTour: { ...tour, stops } });
      },
      addPoiToTour: (poiId) => {
        const catalog = get().catalogPois.length ? get().catalogPois : undefined;
        const poi = catalog?.find((p) => p.id === poiId) ?? getPoiById(poiId);
        if (!poi) return false;
        const tour = get().activeTour ?? get().generateTour();
        if (tour.stops.some((s) => s.id === poiId)) return false;
        const stops = [...tour.stops, poi];
        set({
          itinerarySource: 'manual',
          activeTour: {
            ...tour,
            stops,
            harmonic: {
              anchors: stops.filter((s) => s.kind === 'anchor').length,
              pockets: stops.filter((s) => s.kind === 'pocket').length,
              micros: stops.filter((s) => s.kind === 'micro').length,
            },
          },
          status: get().status === 'idle' ? 'proposed' : get().status,
        });
        return true;
      },
      applyCuratedStops: (poiIds, title) => {
        const catalog = get().catalogPois.length ? get().catalogPois : [];
        const stops = poiIds
          .map((id) => catalog.find((p) => p.id === id) ?? getPoiById(id))
          .filter((p): p is POIStop => Boolean(p));
        if (!stops.length) return;
        set({
          status: 'proposed',
          itinerarySource: 'curated',
          activeTour: {
            tourId: `curated-${title}`.slice(0, 72),
            title,
            currentStopIndex: 0,
            stops,
            completedStops: [],
            isPaused: false,
            startTime: 0,
            distanceKm: 2.8,
            totalMinutes: get().timeBudgetMinutes,
            harmonic: {
              anchors: stops.filter((s) => s.kind === 'anchor').length,
              pockets: stops.filter((s) => s.kind === 'pocket').length,
              micros: stops.filter((s) => s.kind === 'micro').length,
            },
          },
        });
      },
      toggleSavedPoi: (poiId) => {
        const ids = get().savedItems.poiIds;
        const poiIds = ids.includes(poiId) ? ids.filter((id) => id !== poiId) : [...ids, poiId];
        set({ savedItems: { ...get().savedItems, poiIds } });
      },
      saveCurrentTour: () => {
        const tour = get().activeTour;
        if (!tour) return;
        const ids = get().savedItems.customRouteIds;
        if (ids.includes(tour.tourId)) return;
        set({ savedItems: { ...get().savedItems, customRouteIds: [...ids, tour.tourId] } });
      },
      addJournalNote: (text) => {
        const journal = get().userJournal;
        set({
          userJournal: {
            ...journal,
            personalNotes: { ...journal.personalNotes, [todayIso()]: text },
          },
        });
      },
      closeDay: (note) => {
        const tour = get().activeTour;
        const journal = get().userJournal;
        set({
          status: 'completed',
          activeTour: tour ? { ...tour, isPaused: true } : tour,
          userJournal: {
            ...journal,
            date: todayIso(),
            headline: 'Caminé por un Santiago que no conocía',
            personalNotes: note
              ? { ...journal.personalNotes, [todayIso()]: note }
              : journal.personalNotes,
            totalDistanceKm: tour?.distanceKm ?? journal.totalDistanceKm,
            totalMinutes: tour?.totalMinutes ?? journal.totalMinutes,
            steps: Math.round((tour?.distanceKm ?? journal.totalDistanceKm) * 1350),
          },
        });
      },
      startOfflineDownload: () => {
        set({ offlineDownloads: { santiagoDownloaded: false, progressPct: 4 } });
      },
      setOfflineProgress: (pct) => {
        const done = pct >= 100;
        set({
          offlineDownloads: {
            santiagoDownloaded: done,
            progressPct: Math.min(100, pct),
          },
        });
      },
    }),
    {
      name: 'chrono-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        interests: s.interests,
        rhythm: s.rhythm,
        mobilityArchetype: s.mobilityArchetype,
        walkChunkMinutes: s.walkChunkMinutes,
        useMetro: s.useMetro,
        avoidStairs: s.avoidStairs,
        timeBudgetMinutes: s.timeBudgetMinutes,
        stayDays: s.stayDays,
        locationEnabled: s.locationEnabled,
        memorySitesOptIn: s.memorySitesOptIn,
        language: s.language,
        status: s.status,
        walkingPaceMs: s.walkingPaceMs,
        activeTour: s.activeTour,
        itinerarySource: s.itinerarySource,
        userJournal: s.userJournal,
        savedItems: s.savedItems,
        offlineDownloads: s.offlineDownloads,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ChronoState>;
        return {
          ...current,
          ...p,
          interests: normalizeInterests(p.interests ?? current.interests),
          timeBudgetMinutes: snapTimeBudget(p.timeBudgetMinutes ?? current.timeBudgetMinutes),
          itinerarySource: p.itinerarySource ?? current.itinerarySource,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function finishTimeFromBudget(minutes: number) {
  const end = new Date();
  end.setMinutes(end.getMinutes() + minutes);
  const hh = end.getHours().toString().padStart(2, '0');
  const mm = end.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function selectUserProfile(s: ChronoState): UserProfile5D {
  return userProfileFrom(s);
}

export function selectSolverPayload(s: ChronoState): SolverPayload {
  return buildSolverPayload({
    interests: s.interests,
    rhythm: s.rhythm,
    timeBudgetMinutes: s.timeBudgetMinutes,
    walkChunkMinutes: s.walkChunkMinutes,
    useMetro: s.useMetro,
    avoidStairs: s.avoidStairs,
    stayDays: s.stayDays,
    locationEnabled: s.locationEnabled,
    memorySitesOptIn: s.memorySitesOptIn,
    mobilityArchetype: s.mobilityArchetype,
  });
}

export function selectCurrentPoi(s: ChronoState): POIStop | null {
  const tour = s.activeTour;
  if (!tour) return null;
  return tour.stops[tour.currentStopIndex] ?? null;
}

export function selectRemainingMinutes(s: ChronoState): number {
  if (!s.activeTour) return s.timeBudgetMinutes;
  return remainingMinutesForTour(s.activeTour);
}
