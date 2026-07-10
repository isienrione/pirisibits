import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getLandingTierMapBounds } from '../src/landing/landingTierRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const TIER_OUTPUT = {
  'rome-central': 'rome-pricing-basemap-central.jpg',
  'rome-essential': 'rome-pricing-basemap-ancient.jpg',
  'rome-complete': 'rome-pricing-basemap-complete.jpg',
}

function readMapboxToken() {
  const envPath = path.join(root, '.env')
  if (!fs.existsSync(envPath)) return ''
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split('\n')
    .find((entry) => entry.startsWith('VITE_MAPBOX_TOKEN='))
  return line?.slice('VITE_MAPBOX_TOKEN='.length).trim() ?? ''
}

const token = readMapboxToken()
if (!token) {
  console.error('Missing VITE_MAPBOX_TOKEN in .env — cannot fetch Rome basemaps.')
  process.exit(1)
}

fs.mkdirSync(path.join(root, 'public/landing'), { recursive: true })

for (const tierId of Object.keys(TIER_OUTPUT)) {
  const bounds = getLandingTierMapBounds(tierId)
  const bbox = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`
  const url =
    `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/` +
    `${bbox}/1280x1024@2x?access_token=${encodeURIComponent(token)}&attribution=false&logo=false`

  const response = await fetch(url)
  if (!response.ok) {
    console.error(`Mapbox static fetch failed for ${tierId}: ${response.status}`)
    process.exit(1)
  }

  const outputPath = path.join(root, 'public/landing', TIER_OUTPUT[tierId])
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(outputPath, buffer)
  console.log(`Saved ${outputPath} (${Math.round(buffer.length / 1024)} KB)`)
}
