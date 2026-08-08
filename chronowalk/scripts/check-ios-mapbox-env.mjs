#!/usr/bin/env node
/**
 * Preflight for `npm run ios:sync`.
 *
 * Native Maps SDK reads MBXAccessToken (Xcode MAPBOX_ACCESS_TOKEN).
 * Walking directions + web Mapbox GL read VITE_MAPBOX_TOKEN baked into `dist`
 * at Vite build time. Both are required for a working iOS transit experience.
 *
 * Does not print secret values. Exits 0 with a warning when missing so local
 * explorers can still sync; set CW_REQUIRE_MAPBOX_TOKEN=1 to fail hard.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const requireToken = process.env.CW_REQUIRE_MAPBOX_TOKEN === '1'

function readEnvFile(name) {
  const path = join(root, name)
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const fileEnv = {
  ...readEnvFile('.env'),
  ...readEnvFile('.env.local'),
}

const viteToken =
  process.env.VITE_MAPBOX_TOKEN ||
  fileEnv.VITE_MAPBOX_TOKEN ||
  ''

const nativeHint =
  process.env.MAPBOX_ACCESS_TOKEN ||
  fileEnv.MAPBOX_ACCESS_TOKEN ||
  ''

const hasVite = Boolean(viteToken && !/^your_mapbox/i.test(viteToken))
const hasNativeHint = Boolean(nativeHint && !/^pk\.your_mapbox/i.test(nativeHint))

const lines = [
  '[ios-mapbox-env] Dual token check',
  `  VITE_MAPBOX_TOKEN (web Directions / GL): ${hasVite ? 'present' : 'MISSING'}`,
  `  MAPBOX_ACCESS_TOKEN / MBXAccessToken hint: ${hasNativeHint ? 'present in env files' : 'not found in .env* (set in Xcode if needed)'}`,
]

if (!hasVite) {
  lines.push(
    '  Warning: ios:sync will bake an empty VITE_MAPBOX_TOKEN into dist.',
    '  Native MapView may still open via MBXAccessToken, but Steps/Directions will fail.',
    '  Fix: set VITE_MAPBOX_TOKEN in chronowalk/.env.local before npm run ios:sync.',
  )
}

console.log(lines.join('\n'))

if (!hasVite && requireToken) {
  console.error('[ios-mapbox-env] CW_REQUIRE_MAPBOX_TOKEN=1 — aborting.')
  process.exit(1)
}
