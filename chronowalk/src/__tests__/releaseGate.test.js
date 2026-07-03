import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NAV_ITEMS } from '../components/navigation/navConfig.jsx'
import { getShellTabs } from '../shell/config.js'

const SRC_ROOT = join(process.cwd(), 'src')

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules') continue
      walk(full, files)
    } else {
      files.push(full)
    }
  }
  return files
}

describe('release gate', () => {
  it('passes check:design', () => {
    const output = execSync('npm run check:design', {
      cwd: process.cwd(),
      encoding: 'utf8',
    })
    expect(output).toContain('check:design passed')
  })

  it('exposes exactly three navigation tabs', () => {
    expect(NAV_ITEMS).toHaveLength(3)
    expect(getShellTabs()).toHaveLength(3)
    expect(getShellTabs().map((tab) => tab.label)).toEqual(['Journey', 'Map', 'Journal'])
  })

  it('does not contain TimeFractureSlider anywhere in the repo', () => {
    const repoRoot = join(process.cwd(), '..')
    const hits = execSync('git grep -n "TimeFractureSlider" || true', {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim()
    expect(hits).toBe('')
  })

  it('renders LivingSeam in the journey immersion shell', () => {
    const source = readFileSync(
      join(SRC_ROOT, 'components/journey/v1/JourneyImmersionShell.jsx'),
      'utf8'
    )
    expect(source).toContain('LivingSeam')
  })

  it('renders Threshold on the threshold phase screen', () => {
    const source = readFileSync(join(SRC_ROOT, 'components/journey/v1/JourneyTabView.jsx'), 'utf8')
    expect(source).toContain('V1_JOURNEY_PHASE.THRESHOLD')
    expect(source).toContain('<Threshold')
  })

  it('renders JourneyLetter on the complete phase screen', () => {
    const completeSource = readFileSync(
      join(SRC_ROOT, 'components/journey/v1/JourneyCompleteLetter.jsx'),
      'utf8'
    )
    const letterSource = readFileSync(
      join(SRC_ROOT, 'components/journey/v1/JourneyLetter.jsx'),
      'utf8'
    )
    expect(completeSource).toContain('JourneyLetter')
    expect(letterSource).toContain('animate-letter-route-draw')
  })

  it('uses full-bleed dark layouts across v1 journey screens', () => {
    const screenFiles = walk(join(SRC_ROOT, 'components/journey/v1')).filter((file) =>
      /Screen\.jsx$/.test(file)
    )

    for (const file of screenFiles) {
      const source = readFileSync(file, 'utf8')
      expect(source, relative(SRC_ROOT, file)).not.toMatch(/max-w-md/)
      expect(source, relative(SRC_ROOT, file)).toMatch(/min-h-full/)
    }
  })

  it('ships installable PWA assets and service worker config', () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), 'dist/manifest.webmanifest'), 'utf8')
    )

    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
    expect(manifest.icons.some((icon) => icon.sizes === '512x512')).toBe(true)
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
    expect(readFileSync(join(process.cwd(), 'dist/sw.js'), 'utf8')).toMatch(/precacheAndRoute/)
    expect(readFileSync(join(process.cwd(), 'public/pwa/icon-512.png'))).toBeTruthy()
  })
})
