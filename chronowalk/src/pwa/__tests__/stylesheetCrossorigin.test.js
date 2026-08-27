import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureStylesheetCrossorigin } from '../stylesheetCrossorigin.js'

describe('ensureStylesheetCrossorigin', () => {
  it('adds crossorigin to stylesheet links that lack it', () => {
    const html = [
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces">',
      '<link rel="stylesheet" href="/assets/index.css" />',
      `<link href="/a.css" rel='stylesheet'>`,
    ].join('\n')

    const out = ensureStylesheetCrossorigin(html)
    expect(out).toContain(
      '<link crossorigin="anonymous" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces">',
    )
    expect(out).toContain('<link crossorigin="anonymous" rel="stylesheet" href="/assets/index.css" />')
    expect(out).toContain(`<link crossorigin="anonymous" href="/a.css" rel='stylesheet'>`)
  })

  it('leaves existing crossorigin and non-stylesheet links alone', () => {
    const html = [
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
      '<link rel="stylesheet" href="/assets/index.css" crossorigin="anonymous">',
      '<link rel="icon" href="/favicon.svg">',
      '<link rel="preload" as="image" href="/hero.webp">',
    ].join('\n')

    expect(ensureStylesheetCrossorigin(html)).toBe(html)
  })
})

describe('vite HTML transform wiring', () => {
  it('registers the stylesheet CORS plugin after Vite injects CSS links', () => {
    const vite = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../vite.config.js'), 'utf8')
    expect(vite).toContain("from './src/pwa/stylesheetCrossorigin.js'")
    expect(vite).toContain('stylesheetCrossoriginPlugin()')
    expect(vite).toMatch(/order:\s*['"]post['"]/)
  })
})
