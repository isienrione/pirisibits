/**
 * Promise helpers for bounded GPS acquisition.
 * Never leave callers waiting forever — WebViews can ignore geolocation timeout.
 */

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} timeoutMs
 * @param {() => Error} [createError]
 * @returns {Promise<T>}
 */
export function withTimeout(promise, timeoutMs, createError) {
  let timer = null
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(
        createError
          ? createError()
          : Object.assign(new Error('Location request timed out'), {
              code: 3,
              name: 'TimeoutError',
            }),
      )
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer != null) clearTimeout(timer)
  })
}

/**
 * @param {number} timeoutMs
 * @param {(success: PositionCallback, error?: PositionErrorCallback, options?: PositionOptions) => void} getCurrentPosition
 * @param {PositionOptions} [options]
 * @returns {Promise<GeolocationPosition>}
 */
export function getCurrentPositionPromise(getCurrentPosition, options = {}, timeoutMs = 9000) {
  const nativeOptions = {
    enableHighAccuracy: true,
    maximumAge: options.maximumAge ?? 30_000,
    timeout: Math.min(timeoutMs, options.timeout ?? timeoutMs),
    ...options,
  }

  const positionPromise = new Promise((resolve, reject) => {
    try {
      getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err ?? Object.assign(new Error('Location error'), { code: 2 })),
        nativeOptions,
      )
    } catch (error) {
      reject(error)
    }
  })

  // Outer race: some WebViews ignore PositionOptions.timeout entirely.
  return withTimeout(positionPromise, timeoutMs + 250)
}
