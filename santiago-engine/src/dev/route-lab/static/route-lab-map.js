/* Gate 2E.1 — Mapbox geographic map for Route Lab (token via /api/config only). */
window.RouteLabMap = (function () {
  let map = null
  let mapboxReady = false
  let token = null
  const SOURCE_CANON = 'route-canonical'
  const SOURCE_DIAG = 'route-diagnostic'
  const SOURCE_METRO = 'route-metro'

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve()
      const s = document.createElement('script')
      s.src = src
      s.onload = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
  }

  function loadCss(href) {
    if (document.querySelector(`link[href="${href}"]`)) return
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = href
    document.head.appendChild(l)
  }

  async function ensureMapbox() {
    if (mapboxReady) return Boolean(token)
    loadCss('https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css')
    await loadScript('https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js')
    try {
      const res = await fetch('/api/config')
      const cfg = await res.json()
      token = cfg.mapboxToken || null
    } catch {
      token = null
    }
    mapboxReady = true
    return Boolean(token)
  }

  function coord(coords, id) {
    const c = coords[id]
    return c ? [c.lng, c.lat] : null
  }

  function buildFeatures(stops, geoSegments, coords, opts) {
    const canonical = []
    const diagnostic = []
    const metro = []
    const markers = []

    stops.forEach((s, i) => {
      const c = coord(coords, s.stgoId)
      if (!c) return
      const role = opts.roles?.find((r) => r.stgoId === s.stgoId)?.role || ''
      markers.push({
        type: 'Feature',
        properties: {
          stgoId: s.stgoId,
          n: i + 1,
          name: s.name,
          role,
          dwell: s.estimatedDwellMin,
          move: s.transitionTimeMin,
          selected: s.stgoId === opts.selectedStop,
          kind: opts.markerKind || 'selected',
          label: `#${i + 1}`,
        },
        geometry: { type: 'Point', coordinates: c },
      })
    })

    geoSegments.forEach((seg) => {
      if (seg.geometry?.coordinates?.length) {
        canonical.push({
          type: 'Feature',
          properties: { from: seg.fromStgoId, to: seg.toStgoId, status: seg.geometryStatus },
          geometry: { type: 'LineString', coordinates: seg.geometry.coordinates },
        })
      } else {
        const a = coord(coords, seg.fromStgoId)
        const b = coord(coords, seg.toStgoId)
        if (!a || !b) return
        const target = seg.geometryStatus === 'METRO_NO_GEOMETRY' ? metro : diagnostic
        target.push({
          type: 'Feature',
          properties: {
            from: seg.fromStgoId,
            to: seg.toStgoId,
            status: seg.geometryStatus,
            label: seg.geometryStatus === 'METRO_NO_GEOMETRY' ? 'METRO' : 'GEOMETRY NOT STORED',
          },
          geometry: { type: 'LineString', coordinates: [a, b] },
        })
      }
    })

    return { canonical, diagnostic, metro, markers }
  }

  function upsertSource(id, data) {
    if (map.getSource(id)) map.getSource(id).setData(data)
    else map.addSource(id, { type: 'geojson', data })
  }

  function ensureLayers() {
    if (!map.getLayer('canonical-line')) {
      map.addLayer({
        id: 'canonical-line',
        type: 'line',
        source: SOURCE_CANON,
        paint: { 'line-color': '#0f766e', 'line-width': 4, 'line-opacity': 0.9 },
      })
    }
    if (!map.getLayer('diagnostic-line')) {
      map.addLayer({
        id: 'diagnostic-line',
        type: 'line',
        source: SOURCE_DIAG,
        paint: {
          'line-color': '#f59e0b',
          'line-width': 3,
          'line-dasharray': [2, 2],
          'line-opacity': 0.85,
        },
      })
    }
    if (!map.getLayer('metro-line')) {
      map.addLayer({
        id: 'metro-line',
        type: 'line',
        source: SOURCE_METRO,
        paint: {
          'line-color': '#7c3aed',
          'line-width': 3,
          'line-dasharray': [1, 1.5],
          'line-opacity': 0.85,
        },
      })
    }
    if (!map.getLayer('stop-circles')) {
      map.addLayer({
        id: 'stop-circles',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': ['case', ['get', 'selected'], 11, 9],
          'circle-color': [
            'match',
            ['get', 'kind'],
            'composer', '#2563eb',
            'rerank', '#0f766e',
            'overlay', '#64748b',
            '#dc2626',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })
    }
    if (!map.getLayer('stop-labels')) {
      map.addLayer({
        id: 'stop-labels',
        type: 'symbol',
        source: 'stops',
        layout: {
          'text-field': ['to-string', ['get', 'n']],
          'text-size': 11,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      })
    }
  }

  async function init(containerId) {
    const ok = await ensureMapbox()
    if (!ok) return { ok: false, reason: 'No Mapbox token — using fallback map.' }
    mapboxgl.accessToken = token
    if (map) map.remove()
    map = new mapboxgl.Map({
      container: containerId,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-70.65, -33.44],
      zoom: 14,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    await new Promise((res) => map.on('load', res))
    map.addSource(SOURCE_CANON, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.addSource(SOURCE_DIAG, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.addSource(SOURCE_METRO, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.addSource('stops', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    ensureLayers()
    map.on('click', 'stop-circles', (e) => {
      const f = e.features?.[0]
      if (f && window.__ROUTE_LAB_ON_STOP__) window.__ROUTE_LAB_ON_STOP__(f.properties.stgoId)
    })
    map.on('mouseenter', 'stop-circles', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'stop-circles', () => { map.getCanvas().style.cursor = '' })
    return { ok: true }
  }

  function renderRouteLayers(stops, geoSegments, coords, opts) {
    if (!map) return
    const f = buildFeatures(stops, geoSegments, coords, opts || {})
    upsertSource(SOURCE_CANON, { type: 'FeatureCollection', features: f.canonical })
    upsertSource(SOURCE_DIAG, { type: 'FeatureCollection', features: f.diagnostic })
    upsertSource(SOURCE_METRO, { type: 'FeatureCollection', features: f.metro })
    upsertSource('stops', { type: 'FeatureCollection', features: f.markers })
  }

  function fitRoute(stops, coords, padding = 48) {
    if (!map) return
    const bounds = new mapboxgl.LngLatBounds()
    let n = 0
    stops.forEach((s) => {
      const c = coord(coords, s.stgoId)
      if (c) { bounds.extend(c); n += 1 }
    })
    if (n) map.fitBounds(bounds, { padding, maxZoom: 16, duration: 600 })
  }

  function renderOverlay(routes, coords, mode) {
    if (!map) return
    const allCanon = []
    const allDiag = []
    const allMetro = []
    const markers = []
    routes.forEach((r) => {
      const f = buildFeatures(r.stops, r.geoSegments, coords, {
        roles: r.roles,
        selectedStop: r.selectedStop,
        markerKind: r.kind,
      })
      allCanon.push(...f.canonical)
      allDiag.push(...f.diagnostic)
      allMetro.push(...f.metro)
      markers.push(...f.markers)
    })
    upsertSource(SOURCE_CANON, { type: 'FeatureCollection', features: allCanon })
    upsertSource(SOURCE_DIAG, { type: 'FeatureCollection', features: allDiag })
    upsertSource(SOURCE_METRO, { type: 'FeatureCollection', features: allMetro })
    upsertSource('stops', { type: 'FeatureCollection', features: markers })
    if (mode === 'fit' && routes[0]) fitRoute(routes[0].stops, coords)
  }

  return { init, renderRouteLayers, fitRoute, renderOverlay, hasToken: () => Boolean(token) }
})()
