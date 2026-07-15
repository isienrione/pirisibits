import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const routerSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../AppRouter.jsx'),
  'utf8',
)

describe('AppRouter apex home', () => {
  it('always serves the marketing landing at / (never /setup via hasAccess)', () => {
    // chronowalk.com with no path must open the public landing, even when
    // localStorage still has cw_access from a prior purchase on that device.
    expect(routerSource).toContain('<Route path="/" element={<PublicLandingRoute />} />')
    expect(routerSource).toContain('<Route path="/landing" element={<PublicLandingRoute />} />')
    expect(routerSource).not.toMatch(/function HomeRoute/)
    expect(routerSource).not.toMatch(/hasAccess\(\)[\s\S]*Navigate to=.*\/setup/)
  })
})
