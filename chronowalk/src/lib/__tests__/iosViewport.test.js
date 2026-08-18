import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import capacitorConfig from '../../../capacitor.config.json'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('native iOS viewport', () => {
  it('does not double-apply safe-area insets via Capacitor contentInset', () => {
    expect(capacitorConfig.ios.contentInset).toBe('never')
    expect(capacitorConfig.ios.backgroundColor).toBe('#0B0B0D')
  })

  it('does not wrap the iOS root in a double-safe-area class', () => {
    const main = readFileSync(join(root, 'src/main.jsx'), 'utf8')
    const css = readFileSync(join(root, 'src/redesign/redesign.css'), 'utf8')
    expect(main).toContain("classList.add('cw-native-ios')")
    expect(css).toMatch(/html\.cw-native-ios[\s\S]*padding:\s*0/)
    expect(main).not.toMatch(/double-safe|safe-area-wrapper/)
    expect(css).not.toMatch(/html\.cw-native-ios[\s\S]{0,200}padding-top:\s*env\(safe-area-inset-top\)/)
  })
})
