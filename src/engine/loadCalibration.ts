/**
 * Load Gate 2A.1 proposed editorial calibration (launch 30).
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { SemanticCalibrationFile, SemanticCalibrationRecord } from '@/src/engine/semanticTypes'

const ROOT = resolve(__dirname, '../..')
const CALIBRATION_REL = 'src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json'

export function loadEditorialCalibration(root = ROOT): SemanticCalibrationFile {
  return JSON.parse(readFileSync(resolve(root, CALIBRATION_REL), 'utf8')) as SemanticCalibrationFile
}

export function loadCalibrationByStgoId(root = ROOT): Map<string, SemanticCalibrationRecord> {
  const file = loadEditorialCalibration(root)
  return new Map(file.records.map((r) => [r.stgoId, r]))
}
