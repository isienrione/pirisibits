/** Web Audio mix levels - single source of truth for the three-layer engine (Prompt B). */

export const MIX_CONFIG = {
  bed: {
    // Walking / silence between stops - audible fill-in for continuity.
    idleDb: -24,
    // Under voice narration - faint background only (≈18 dB below idle).
    duckedDb: -42,
    crossfadeMs: 2000,
  },
  narration: {
    leadInMs: 800,
    tailMs: 1200,
  },
  presence: {
    intervalMs: 120000,
    jitterMs: 15000,
    levelDb: -22,
  },
  longwalk: {
    thresholdMultiplier: 1.5,
    levelDb: -18,
  },
  insert: {
    headMs: 400,
    tailMs: 400,
  },
}

export default MIX_CONFIG
