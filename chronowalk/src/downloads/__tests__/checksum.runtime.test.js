import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  formatSha256Checksum,
  parseChecksum,
  sha256Hex,
  verifyChecksum,
} from '../checksum.js'
import { sha256HexNode } from '../checksum.node.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('runtime checksum (Web Crypto)', () => {
  it('checksum.js has no node:crypto import', () => {
    const source = readFileSync(join(__dirname, '../checksum.js'), 'utf8')
    expect(source).not.toMatch(/node:crypto/)
    expect(source).toMatch(/crypto\.subtle|subtle\.digest/)
  })

  it('computes and verifies sha256 without node:crypto', async () => {
    const data = new TextEncoder().encode('chronowalk-checksum')
    const hex = await sha256Hex(data)
    expect(hex).toMatch(/^[a-f0-9]{64}$/)
    const labeled = formatSha256Checksum(hex)
    expect(parseChecksum(labeled)?.hex).toBe(hex)
    const verified = await verifyChecksum(data, labeled)
    expect(verified).toEqual({ ok: true, reason: 'matched', actual: hex })
  })

  it('Node-only helper matches Web Crypto digest', async () => {
    const data = new TextEncoder().encode('chronowalk-checksum')
    const web = await sha256Hex(data)
    const node = sha256HexNode(data)
    expect(node).toBe(web)
  })
})
