const storageKey = (tourId) => `chronowalk:tour-progress:${tourId}`

const defaultProgress = () => ({
  /** Index of the stop the visitor is navigating toward */
  targetStopIndex: 0,
  /** Stop ids the visitor has already reached */
  arrivedStopIds: [],
  /** True while walking the leg toward targetStopIndex (after leaving prior stop) */
  transitLegActive: false,
  /**
   * Durable narration offsets by stop id.
   * @type {Record<string, { positionMs: number, itemIndex?: number, completed?: boolean, updatedAt?: string }>}
   */
  audioByStopId: {},
})

function mirrorProgressToIndexedDb(tourId, progress) {
  if (typeof window === 'undefined' || !tourId || !progress) return

  void import('../offline/offlineRepository')
    .then(({ saveOfflineUserProgress }) => saveOfflineUserProgress(tourId, progress))
    .catch((error) => {
      console.warn('tourProgressStorage: IndexedDB mirror failed.', error)
    })
}

export const loadTourProgress = (tourId) => {
  if (typeof window === 'undefined' || !tourId) return defaultProgress()

  try {
    const raw = window.localStorage.getItem(storageKey(tourId))
    if (!raw) return defaultProgress()

    const parsed = JSON.parse(raw)
    return {
      ...defaultProgress(),
      ...parsed,
      arrivedStopIds: Array.isArray(parsed.arrivedStopIds) ? parsed.arrivedStopIds : [],
      audioByStopId:
        parsed.audioByStopId && typeof parsed.audioByStopId === 'object'
          ? parsed.audioByStopId
          : {},
    }
  } catch {
    return defaultProgress()
  }
}

export const loadTourProgressAsync = async (tourId) => {
  const localProgress = loadTourProgress(tourId)
  const hasStoredProgress =
    localProgress.targetStopIndex > 0 ||
    localProgress.transitLegActive ||
    localProgress.arrivedStopIds.length > 0

  if (hasStoredProgress) return localProgress

  try {
    const { loadOfflineUserProgress } = await import('../offline/offlineRepository')
    const offlineProgress = await loadOfflineUserProgress(tourId)

    if (!offlineProgress) return localProgress

    return {
      ...defaultProgress(),
      targetStopIndex: offlineProgress.targetStopIndex ?? 0,
      transitLegActive: Boolean(offlineProgress.transitLegActive),
      arrivedStopIds: Array.isArray(offlineProgress.arrivedStopIds)
        ? offlineProgress.arrivedStopIds
        : [],
      audioByStopId:
        offlineProgress.audioByStopId && typeof offlineProgress.audioByStopId === 'object'
          ? offlineProgress.audioByStopId
          : {},
    }
  } catch (error) {
    console.warn('tourProgressStorage: IndexedDB fallback failed.', error)
    return localProgress
  }
}

export const saveTourProgress = (tourId, progress) => {
  if (typeof window === 'undefined' || !tourId || !progress) return

  try {
    window.localStorage.setItem(storageKey(tourId), JSON.stringify(progress))
    mirrorProgressToIndexedDb(tourId, progress)
  } catch (error) {
    console.warn('tourProgressStorage: failed to save progress.', error)
  }
}

export const resetTourProgress = (tourId) => {
  if (typeof window === 'undefined' || !tourId) return defaultProgress()

  try {
    window.localStorage.removeItem(storageKey(tourId))
    mirrorProgressToIndexedDb(tourId, defaultProgress())
  } catch {
    // ignore
  }

  return defaultProgress()
}
