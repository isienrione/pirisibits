/**
 * Gate 2E.3.1-R — tombstone for the lost historical R1–R8 oracle.
 *
 * Not an executable suite. Do not treat later 2E.4 artifacts as reconstruction.
 */

export const LOST_HISTORICAL_SCENARIO_SUITE = 'R1-R8' as const
export const LOST_HISTORICAL_ORACLE_STATUS = 'LOST_HISTORICAL_ORACLES' as const

export const LOST_HISTORICAL_SCENARIOS = {
  historicalSuite: 'R1-R8' as const,
  status: 'LOST_HISTORICAL_ORACLES' as const,
  originalGate: '2E.3.1',
  originalSha: '3da1d8bd',
  originalShaStatus: 'UNRECOVERABLE' as const,
  knownSurvivingInformation: [
    'R1–R8 existed',
    'they were used for route/scenario verification',
    'exact definitions/fingerprints are unavailable',
    'later artifacts must NOT be treated as exact reconstruction',
  ] as const,
  r1ModeledMinutes: {
    value: 116.1,
    status: 'UNVERIFIED_HISTORICAL_NOTE' as const,
    executableOracle: false,
    source: 'lost Gate 2E.3.2 reconstruction record',
  },
  executableReconstructionOracle: 'F1-F18' as const,
  notSubstitutes: ['B01-B12', 'R1-R8 invented definitions'] as const,
} as const
