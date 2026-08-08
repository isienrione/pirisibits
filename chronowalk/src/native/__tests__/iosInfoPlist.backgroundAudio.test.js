import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const infoPlistPath = join(root, 'native-review/ios/App/App/Info.plist')

describe('iOS Info.plist background audio', () => {
  it('declares UIBackgroundModes audio for the Capacitor app target', () => {
    const plist = readFileSync(infoPlistPath, 'utf8')
    expect(plist).toMatch(/<key>UIBackgroundModes<\/key>/)
    expect(plist).toMatch(/<string>audio<\/string>/)
    // Do not silently enable unrelated background modes in M1.
    expect(plist).not.toMatch(/<string>location<\/string>/)
    expect(plist).not.toMatch(/<string>fetch<\/string>/)
  })
})
