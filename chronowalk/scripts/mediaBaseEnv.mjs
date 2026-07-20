import { readFileSync } from 'node:fs'
import { lookup } from 'node:dns/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function loadEnvLocal() {
  try {
    const envPath = join(__dirname, '../.env.local')
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq)
      const value = trimmed.slice(eq + 1)
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // optional
  }
}

export function getMediaBase() {
  return process.env.VITE_MEDIA_BASE?.replace(/\/$/, '') ?? null
}

export function printMediaHostHelp(hostname) {
  console.error(`✗ Cannot resolve media host "${hostname}" (DNS lookup failed).`)
  console.error('')
  console.error('  Stage 4 remote checks need a reachable VITE_MEDIA_BASE.')
  console.error('  Options:')
  console.error('  1. Point media.chronowalk.app at your R2 bucket in Cloudflare DNS')
  console.error('  2. Set VITE_MEDIA_BASE in chronowalk/.env.local to your R2 public URL')
  console.error('     (Cloudflare → R2 → bucket → Public access → *.r2.dev URL)')
  console.error('  3. Schema-only locally: npm run check:content:local')
  console.error('  4. Measure durations from a local audio folder:')
  console.error('     npm run measure:durations -- --from-dir=/path/to/rome/audio')
}

export async function assertMediaHostResolvable(base) {
  const hostname = new URL(base).hostname

  try {
    await lookup(hostname)
  } catch {
    printMediaHostHelp(hostname)
    process.exit(1)
  }
}
