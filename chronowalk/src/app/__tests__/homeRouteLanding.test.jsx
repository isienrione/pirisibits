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
  it('serves the marketing homepage at / (never /setup via hasAccess)', () => {
    // Bare domain must open the marketing site. Purchasers reach setup only via
    // /access and post-purchase routes - not a silent gate on `/`.
    expect(routerSource).toContain('<Route path="/" element={<PublicLandingRoute />} />')
    expect(routerSource).toContain('<Route path="/landing" element={<Navigate to="/" replace />} />')
    expect(routerSource).not.toMatch(/function ApexHomeRedirect/)
    expect(routerSource).not.toMatch(/function HomeRoute/)
    expect(routerSource).not.toMatch(/hasAccess\(\)[\s\S]*Navigate to=.*\/setup/)
  })

  it('keeps paid journey gated while home is an app-shell route', () => {
    expect(routerSource).toContain(
      '<Route path="/home" element={<AppShell requireOnboardedGuest><LazyHomePage /></AppShell>} />',
    )
    expect(routerSource).toContain(
      '<Route path="/journey" element={<Paid><LazyJourneyPage /></Paid>} />',
    )
    expect(routerSource).toContain('<Route path="/access" element={<LazyAccessPage />} />')
    expect(routerSource).toContain('<Route path="/welcome" element={<LazyWelcomePage />} />')
  })

  it('CDN-redirects legacy /landing permanently to /', () => {
    expect(redirectsSource).toMatch(/^\/landing\s+\/\s+301$/m)
    expect(redirectsSource).not.toMatch(/^\/\s+\/landing\s+302$/m)
    expect(redirectsSource).toMatch(/^\/\*\s+\/index\.html\s+200$/m)
  })
})
