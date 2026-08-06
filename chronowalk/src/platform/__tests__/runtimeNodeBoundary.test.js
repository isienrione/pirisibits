import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '../..')

/** Runtime modules that must never pull Node builtins into the Capacitor bundle. */
const RUNTIME_DIRS = ['native', 'catalog', 'platform', 'downloads']

const FORBIDDEN = [/from ['"]node:/, /import\(['"]node:/, /fileURLToPath/]

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listJsFiles(dir) {
  /** @type {string[]} */
  const out = []
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return out
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === '__tests__' || name === 'node_modules') continue
      out.push(...listJsFiles(full))
    } else if (/\.(js|jsx)$/.test(name) && !name.endsWith('.node.js')) {
      out.push(full)
    }
  }
  return out
}

describe('platform runtime node boundary', () => {
  it('runtime source under native/catalog/platform/downloads avoids node:* and fileURLToPath', () => {
    const offenders = []
    for (const dir of RUNTIME_DIRS) {
      for (const file of listJsFiles(join(SRC, dir))) {
        const source = readFileSync(file, 'utf8')
        for (const pattern of FORBIDDEN) {
          if (pattern.test(source)) {
            offenders.push(`${file.replace(SRC + '/', '')}: ${pattern}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
