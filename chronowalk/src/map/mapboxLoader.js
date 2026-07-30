let runtimePromise = null

function injectMapboxStylesheet(cssUrl) {
  if (typeof document === 'undefined') return
  if (document.querySelector('link[data-cw-mapbox-css="1"]')) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = cssUrl
  link.dataset.cwMapboxCss = '1'
  document.head.appendChild(link)
}

/**
 * Loads Mapbox GL only when a map view mounts · keeps the 1.8MB library off the landing boot path.
 */
export function loadMapboxRuntime() {
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      import('./mapboxClient.js'),
      import('mapbox-gl/dist/mapbox-gl.css?url'),
    ]).then(([{ default: mapboxgl }, { default: cssUrl }]) => {
      injectMapboxStylesheet(cssUrl)
      return mapboxgl
    })
  }
  return runtimePromise
}
