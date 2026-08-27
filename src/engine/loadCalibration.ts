/**
 * Load Gate 2A.1R editorial calibration (launch 30) and canonical 103-node semantic seed.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { SemanticCalibrationFile, SemanticCalibrationRecord } from '@/src/engine/semanticTypes'

const ROOT = resolve(__dirname, '../..')
const LAUNCH_REL = 'src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json'
const SEMANTIC_REL = 'src/data/santiago/santiago_semantic_calibration.v0.1.json'

export function loadEditorialCalibration(root = ROOT): SemanticCalibrationFile {
  return JSON.parse(readFileSync(resolve(root, LAUNCH_REL), 'utf8')) as SemanticCalibrationFile
}

export function loadCanonicalSemanticCalibration(root = ROOT): SemanticCalibrationFile {
  return JSON.parse(readFileSync(resolve(root, SEMANTIC_REL), 'utf8')) as SemanticCalibrationFile
}

export function loadCalibrationByStgoId(root = ROOT): Map<string, SemanticCalibrationRecord> {
  const file = loadEditorialCalibration(root)
  return new Map(file.records.map((r) => [r.stgoId, r]))
}

export function loadSemanticByStgoId(root = ROOT): Map<string, SemanticCalibrationRecord> {
  const file = loadCanonicalSemanticCalibration(root)
  return new Map(file.records.map((r) => [r.stgoId, r]))
}
