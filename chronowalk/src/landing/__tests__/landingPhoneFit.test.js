import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LANDING_CONTENT } from '../landingData.js'

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../ChronoWalkLanding.css'),
  'utf8',
)

const v2css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../ChronoWalkLanding.v2.css'),
  'utf8',
)

describe('landing phone mockup sizing', () => {
  it('scales the 390 artboard from the inner screen container, not the shell', () => {
    expect(css).toMatch(/\.cw-landing-phone__screen\s*\{[^}]*container-type:\s*inline-size/s)
    expect(css).toMatch(/\.cw-landing-phone__artboard\s*\{[^}]*scale\(calc\(100cqw\s*\/\s*390\)\)/s)
    expect(css).toMatch(/\.cw-landing-phone__artboard\s*\{[^}]*position:\s*absolute/s)
  })

  it('keeps how-it-works phones large enough to read as iPhones on mobile', () => {
    expect(v2css).not.toMatch(
      /\.cw-v2-user-flow--essential\s+\.cw-v2-user-flow__device\s*\{[^}]*max-width:\s*7\.25rem/s,
    )
    expect(v2css).toMatch(/max-width:\s*12rem/)
  })

  it('uses a photo-filled listening mockup for step 3 copy', () => {
    const steps = LANDING_CONTENT['user-flow'].steps
    expect(steps[2].mockup).toBe('listening')
    expect(steps[2].title).toMatch(/arrive.*listen.*reveal/i)
  })
})
