/**
 * Gate 2E.2A — load proposed editorial dimensions V0.2.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type {
  EditorialDimensionKey,
  EditorialDimensionValue,
  EditorialDimensionsRecord,
} from '@/src/engine/scoring/v0.2/scoring-types'

const ROOT = resolve(__dirname, '../../../..')

export type EditorialDimensionsFile = {
  schemaVersion: string
  gate: string
  status: string
  recordCount: number
  records: EditorialDimensionsRecord[]
}

export function loadEditorialDimensions(root = ROOT): EditorialDimensionsFile {
  return JSON.parse(
    readFileSync(resolve(root, 'src/data/santiago/curation/santiago_editorial_dimensions.proposed.v0.2.json'), 'utf8'),
  )
}

export function editorialDimensionsByStgoId(root = ROOT): Map<string, EditorialDimensionsRecord> {
  const file = loadEditorialDimensions(root)
  return new Map(file.records.map((r) => [r.stgoId, r]))
}

export function getDimension(
  record: EditorialDimensionsRecord | undefined,
  key: EditorialDimensionKey,
): EditorialDimensionValue | null {
  return record?.dimensions?.[key] ?? null
}

export function dimensionValue(
  record: EditorialDimensionsRecord | undefined,
  key: EditorialDimensionKey,
): number | null {
  const v = getDimension(record, key)?.value
  return v != null && Number.isFinite(v) ? v : null
}
