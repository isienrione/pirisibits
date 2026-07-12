import { describe, expect, it } from 'vitest'
import {
  parseWalkingUiRevisionFromHtml,
  shouldMigrateWalkingUi,
} from '../walkingUiMigration.js'

describe('walkingUiMigration', () => {
  it('parses walking UI revision from index.html meta', () => {
    const html = `<!doctype html><head>
      <meta name="cw-walking-ui-rev" content="11" />
    </head>`
    expect(parseWalkingUiRevisionFromHtml(html)).toBe(11)
  })

  it('migrates when the network revision is ahead of the bundled revision', () => {
    expect(shouldMigrateWalkingUi(6, 11)).toBe(true)
    expect(shouldMigrateWalkingUi(11, 11)).toBe(false)
    expect(shouldMigrateWalkingUi(11, 10)).toBe(false)
    expect(shouldMigrateWalkingUi(11, null)).toBe(false)
  })
})
