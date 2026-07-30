import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const routerSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../AppRouter.jsx'),
  'utf8',
)

const redirectsSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../../public/_redirects'),
  'utf8',
)

describe('AppRouter apex home', () => {
  it('sends chronowalk.com / straight to /landing (never /setup via hasAccess)', () => {
    // Bare domain must open the marketing site. Purchasers reach setup only via
    // /access and post-purchase routes · not a silent gate on `/`.
    expect(routerSource).toContain('<Route path="/" element={<ApexHomeRedirect />} />')
    expect(routerSource).toContain('<Route path="/landing" element={<PublicLandingRoute />} />')
    expect(routerSource).toMatch(/Navigate to="\/landing"/)
    expect(routerSource).not.toMatch(/function HomeRoute/)
    expect(routerSource).not.toMatch(/hasAccess\(\)[\s\S]*Navigate to=.*\/setup/)
  })

  it('CDN-redirects apex / to /landing ahead of the SPA', () => {
    expect(redirectsSource).toMatch(/^\/\s+\/landing\s+302/m)
  })
})
