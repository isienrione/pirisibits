import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outputPath = path.join(root, 'public/landing/rome-pricing-basemap.jpg')

const bounds = {
  minLng: 12.464,
  minLat: 41.854,
  maxLng: 12.514,
  maxLat: 41.907,
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
  console.error('Missing VITE_MAPBOX_TOKEN in .env — cannot fetch Rome basemap.')
  process.exit(1)
}

const bbox = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`
const url =
  `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/` +
  `${bbox}/1280x1024@2x?access_token=${encodeURIComponent(token)}&attribution=false&logo=false`

const response = await fetch(url)
if (!response.ok) {
  console.error(`Mapbox static fetch failed: ${response.status} ${response.statusText}`)
  process.exit(1)
}

const buffer = Buffer.from(await response.arrayBuffer())
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, buffer)
console.log(`Saved ${outputPath} (${Math.round(buffer.length / 1024)} KB)`)
