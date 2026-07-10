import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { WALKING_UI_REVISION } from '../walkingUiRevision.js'
import { WALKING_UI_REVISION as exportedRevision } from '../../redesign/screens/C2Walking.jsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

describe('walking UI revision', () => {
  it('keeps C2Walking in sync with walkingUiRevision', () => {
    expect(exportedRevision).toBe(WALKING_UI_REVISION)
  })

  it('ships the unified walking companion screen', () => {
    const c2Source = readFileSync(join(root, 'redesign/screens/C2Walking.jsx'), 'utf8')
    const screenSource = readFileSync(join(root, 'redesign/screens/WalkingCompanionScreen.jsx'), 'utf8')

    expect(c2Source).toContain('WalkingCompanionScreen')
    expect(c2Source).not.toMatch(/GUIDE/)
    expect(c2Source).not.toContain('CompassDial')
    expect(screenSource).toContain('cw-walking-companion')
  })
})
