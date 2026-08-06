import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  listPackagedCityIds,
  listPackagedFixtureCityIds,
  loadPackagedCityPackage,
} from '../runtime.js'
import { generateCityManifest, loadCityPackage } from '../node.js'
import { validateCity } from '../runtime.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = join(__dirname, '..')

const RUNTIME_ENTRY_FILES = [
  'index.js',
  'runtime.js',
  'packagedCities.js',
  'types.js',
  'validateCity.js',
  'validateCatalog.js',
]

describe('browser-safe city package boundary', () => {
  it('runtime entry files have no node:* imports', () => {
    for (const file of RUNTIME_ENTRY_FILES) {
      const source = readFileSync(join(packageDir, file), 'utf8')
      expect(source, file).not.toMatch(/from ['"]node:/)
      expect(source, file).not.toMatch(/import\(['"]node:/)
      expect(source, file).not.toMatch(/fileURLToPath/)
    }
  })

  it('loads packaged Rome without Node filesystem APIs', () => {
    const pkg = loadPackagedCityPackage('rome')
    expect(pkg.cityId).toBe('rome')
    expect(pkg.isFixture).toBe(false)
    expect(pkg.metadata.published).toBe(true)
    expect(pkg.root).toMatch(/^packaged:/)
    expect(validateCity(pkg).ok).toBe(true)
  })

  it('exposes fixtures only via packaged fixture list', () => {
    expect(listPackagedCityIds()).toContain('rome')
    expect(listPackagedCityIds()).not.toContain('harbor')
    expect(listPackagedFixtureCityIds()).toContain('harbor')
    expect(loadPackagedCityPackage('harbor').isFixture).toBe(true)
  })

  it('build-time generator still works in Node', () => {
    const result = generateCityManifest({ cityId: 'rome', dryRun: true })
    expect(result.validation.ok).toBe(true)
    expect(result.manifest.city).toBe('rome')
    const disk = loadCityPackage('rome')
    expect(disk.manifest).toEqual(result.manifest)
  })
})
