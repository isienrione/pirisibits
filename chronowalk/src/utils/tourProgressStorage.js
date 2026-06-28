const storageKey = (tourId) => `chronowalk:tour-progress:${tourId}`

const defaultProgress = () => ({
  /** Index of the stop the visitor is navigating toward */
  targetStopIndex: 0,
  /** Stop ids the visitor has already reached */
  arrivedStopIds: [],
  /** True while walking the leg toward targetStopIndex (after leaving prior stop) */
  transitLegActive: false,
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
    }
  } catch {
    return defaultProgress()
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
