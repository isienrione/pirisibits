import { describe, expect, it } from 'vitest'
import { loadRomeManifest } from '../../content/manifest.js'
import {
  clearCachedMapTiles,
  createMapboxTransformRequest,
  DEFAULT_MAP_STYLE_PATH,
  glyphUrl,
  listRomeMapTileUrls,
  lngLatToTile,
  padBounds,
  registerCachedMapTile,
  resolveCachedMapTileUrl,
  spriteUrls,
  tilesCoveringBounds,
  vectorTileUrl,
} from '../offlineMapTiles.js'

describe('offlineMapTiles', () => {
  const manifest = loadRomeManifest()
  const token = 'pk.test-token'

  it('converts lng/lat to tile coordinates', () => {
    const tile = lngLatToTile(12.4922, 41.8902, 15)
    expect(tile.z).toBe(15)
    expect(tile.x).toBeGreaterThan(0)
    expect(tile.y).toBeGreaterThan(0)
  })

  it('pads tour bounds for tile coverage', () => {
    const bounds = {
      minLat: 41.88,
      maxLat: 41.9,
      minLng: 12.48,
      maxLng: 12.5,
      center: { lat: 41.89, lng: 12.49 },
    }

    const padded = padBounds(bounds, 0.01)
    expect(padded.minLat).toBeCloseTo(41.87)
    expect(padded.maxLng).toBeCloseTo(12.51)
  })

  it('lists classic Streets style, sprites, glyphs, and vector tiles for Rome', () => {
    const urls = listRomeMapTileUrls(manifest, { token, zoomMin: 14, zoomMax: 14 })
    expect(DEFAULT_MAP_STYLE_PATH).toBe('mapbox/streets-v12')
    expect(urls[0]).toContain('styles/v1/mapbox/streets-v12')
    expect(urls.some((url) => url.includes('/sprite'))).toBe(true)
    expect(urls.some((url) => url.includes('/fonts/v1/mapbox/'))).toBe(true)
    expect(urls.some((url) => url.includes('.vector.pbf'))).toBe(true)
    expect(urls.length).toBeGreaterThan(10)
  })

  it('builds sprite and glyph URL helpers', () => {
    expect(spriteUrls(DEFAULT_MAP_STYLE_PATH, token)).toHaveLength(4)
    expect(glyphUrl('DIN Pro Regular', '0-255', token)).toContain('DIN%20Pro%20Regular')
  })

  it('builds a bounded tile set without duplicates', () => {
    const bounds = {
      minLat: 41.888,
      maxLat: 41.892,
      minLng: 12.484,
      maxLng: 12.492,
      center: { lat: 41.89, lng: 12.488 },
    }

    const tiles = tilesCoveringBounds(bounds, 15, 15)
    const keys = tiles.map((tile) => `${tile.z}/${tile.x}/${tile.y}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect(tiles.length).toBeGreaterThan(0)
  })

  it('resolves cached tile URLs through transformRequest', () => {
    clearCachedMapTiles()
    const sourceUrl = vectorTileUrl({ z: 15, x: 17600, y: 12088 }, token)
    registerCachedMapTile(sourceUrl, 'blob:cached-tile')

    expect(resolveCachedMapTileUrl(sourceUrl)).toBe('blob:cached-tile')

    const transformRequest = createMapboxTransformRequest()
    expect(transformRequest(sourceUrl, 'Tile')).toEqual({ url: 'blob:cached-tile' })
    expect(transformRequest(sourceUrl, 'Glyphs')).toEqual({ url: 'blob:cached-tile' })
    expect(transformRequest('https://example.com/tile', 'Tile')).toEqual({
      url: 'https://example.com/tile',
    })

    clearCachedMapTiles()
  })
})
