import React, { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  finishTimeFromBudget,
  selectCurrentPoi,
  selectRemainingMinutes,
  selectSolverPayload,
  selectUserProfile,
  useChronoStore,
} from '@/src/store/useChronoStore';

export function WalkProvider({ children }: { children: React.ReactNode }) {
  const hasHydrated = useChronoStore((s) => s.hasHydrated);

  useEffect(() => {
    const persistApi = useChronoStore.persist;
    const finish = persistApi.onFinishHydration(() => {
      useChronoStore.getState().setHasHydrated(true);
    });
    if (persistApi.hasHydrated()) {
      useChronoStore.getState().setHasHydrated(true);
    }
    return finish;
  }, []);

  if (!hasHydrated) return null;
  return <>{children}</>;
}

export function useHasCompletedOnboarding() {
  return useChronoStore((s) => s.onboardingComplete);
}

/** Narrow subscription for onboarding interest chips — avoids full-store re-renders. */
export function useInterestSelection() {
  return useChronoStore(
    useShallow((s) => ({
      interests: s.interests,
      toggleInterest: s.toggleInterest,
    })),
  );
}

export function useTimeBudget() {
  return useChronoStore(
    useShallow((s) => ({
      timeBudgetMinutes: s.timeBudgetMinutes,
      setTimeBudgetMinutes: s.setTimeBudgetMinutes,
      rhythm: s.rhythm,
      finishLabel: finishTimeFromBudget(s.timeBudgetMinutes),
    })),
  );
}

export function useWalk() {
  const store = useChronoStore();
  const tour = store.activeTour;
  return {
    ...store,
    hasCompletedOnboarding: store.onboardingComplete,
    currentStopIndex: tour?.currentStopIndex ?? 0,
    userProfile: selectUserProfile(store),
    solverPayload: selectSolverPayload(store),
    finishLabel: finishTimeFromBudget(store.timeBudgetMinutes),
    currentPoi: selectCurrentPoi(store),
    remainingMinutes: selectRemainingMinutes(store),
    tourStops: tour?.stops ?? [],
  };
}

export type { ExplorerRhythm, InterestId, DiscoveryPostureId, MobilityArchetypeId } from '@/src/data/algorithm';
