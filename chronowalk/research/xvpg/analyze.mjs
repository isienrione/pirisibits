// X-VPG analysis with automated ATTENTION-CONFLICT VETO + NOVELTY-DOMINANT flag (Day 5.5).
// Implements the frozen HPS v0 scoring exactly (docs/gate2/HPS_V0_FROZEN_INSTRUMENT.md)
// and the frozen veto rule: a condition CANNOT pass if AC-raw > 4.5 OR ΔAC vs control >= +1.5.
// Also flags: high HPS + high novelty + no legibility improvement => NOVELTY-DOMINANT RESULT.
//
// Input: experiments/xvpg/out/sessions.jsonl — one record per (participant, cell):
//   { "participant":"P01", "label":"A", "items": { "SP1":..7-point.., SP2, TP1, TP2,
//     HL1, HL2, EW1, EW2, IB1, IB2, AC1, AC2?, TR1, TR2, NV1 }, "comprehension": {"correct":n,"total":n} }
// Desk sessions may omit AC2 (AC-raw = AC1 per instrument).
// Uses experiments/xvpg/out/label_map.json to resolve neutral labels to cells.
// Usage: node experiments/xvpg/analyze.mjs
import fs from "node:fs";

const DIR = "experiments/xvpg/out";
const rows = fs.readFileSync(`${DIR}/sessions.jsonl`, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
const labelMap = JSON.parse(fs.readFileSync(`${DIR}/label_map.json`, "utf8"));

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
function score(it) {
  const SP = (it.SP1 + it.SP2) / 2, TP = (it.TP1 + it.TP2) / 2, HL = (it.HL1 + it.HL2) / 2, EW = (it.EW1 + it.EW2) / 2;
  return {
    core: (SP + TP + HL + EW) / 4, SP, TP, HL, EW,
    IBraw: (it.IB1 + it.IB2) / 2,
    ACraw: it.AC2 != null ? (it.AC1 + it.AC2) / 2 : it.AC1,
    TRUST: (it.TR1 + it.TR2) / 2,
    NV: it.NV1,
  };
}

const byCell = {};
for (const r of rows) {
  const cell = labelMap[r.label] ?? r.label;
  (byCell[cell] ??= []).push({ p: r.participant, s: score(r.items), comp: r.comprehension });
}
const agg = {};
for (const [cell, xs] of Object.entries(byCell)) {
  agg[cell] = {
    n: xs.length,
    core: mean(xs.map((x) => x.s.core)), HL: mean(xs.map((x) => x.s.HL)),
    IB: mean(xs.map((x) => x.s.IBraw)), AC: mean(xs.map((x) => x.s.ACraw)),
    TRUST: mean(xs.map((x) => x.s.TRUST)), NV: mean(xs.map((x) => x.s.NV)),
    coreSD: Math.sqrt(mean(xs.map((x) => (x.s.core - mean(xs.map((y) => y.s.core))) ** 2))),
    comp: mean(xs.map((x) => (x.comp ? (100 * x.comp.correct) / x.comp.total : NaN))).toFixed(0),
  };
}

const ctrl = agg["control"];
if (!ctrl) { console.error("No control cell found — cannot apply veto deltas."); process.exit(1); }
console.log("X-VPG ANALYSIS — HPS v0 frozen scoring; AC veto + novelty rule automated\n");
for (const [cell, a] of Object.entries(agg)) {
  const dCore = a.core - ctrl.core, dHL = a.HL - ctrl.HL, dAC = a.AC - ctrl.AC;
  const flags = [];
  // FROZEN VETO — outranks every success threshold:
  if (a.AC > 4.5) flags.push(`AC VETO: mean AC-raw ${a.AC.toFixed(2)} > 4.5`);
  if (cell !== "control" && dAC >= 1.5) flags.push(`AC VETO: ΔAC vs control +${dAC.toFixed(2)} >= +1.5`);
  // NOVELTY-DOMINANT: high HPS + high novelty + no legibility improvement
  if (cell !== "control" && dCore >= 0.7 && a.NV >= 5.5 && dHL < 0.4)
    flags.push(`NOVELTY-DOMINANT RESULT: ΔHPS +${dCore.toFixed(2)} with NV1 ${a.NV.toFixed(2)} but ΔHL only ${dHL >= 0 ? "+" : ""}${dHL.toFixed(2)} — NOT a pass`);
  if (a.coreSD > 2.0) flags.push(`SD ${a.coreSD.toFixed(2)} > 2.0 — evidence capped at E1 (matrix rule)`);
  // X-VPG signal bar (not a pass bar): Δ >= +0.7 core or HL justifies ART-1; both < +0.4 → stop art spend
  let signal = "";
  if (cell !== "control") {
    if (flags.some((f) => f.startsWith("AC VETO"))) signal = "VETOED — cannot pass regardless of HPS (verdict: ITERATE attention design)";
    else if (flags.some((f) => f.startsWith("NOVELTY"))) signal = "NOVELTY-DOMINANT — not a pass";
    else if (dCore >= 0.7 || dHL >= 0.7) signal = "SIGNAL: justifies ART-1 consideration (E-level per protocol)";
    else if (dCore < 0.4 && dHL < 0.4) signal = "BELOW STOP BAR (<+0.4 core and HL)";
    else signal = "AMBIGUOUS band (+0.4..+0.7): one interaction iteration, re-test";
  }
  console.log(`${cell} (n=${a.n})  core=${a.core.toFixed(2)} (Δ${cell === "control" ? "—" : (dCore >= 0 ? "+" : "") + dCore.toFixed(2)})  HL=${a.HL.toFixed(2)}  IB=${a.IB.toFixed(2)}  AC=${a.AC.toFixed(2)}  TRUST=${a.TRUST.toFixed(2)}  NV1=${a.NV.toFixed(2)}  comp=${a.comp}%`);
  for (const f of flags) console.log(`   ⚠ ${f}`);
  if (signal) console.log(`   → ${signal}`);
}
console.log("\nReminders: IB co-gate for B5-class concepts (IB <= 3.5); second-exposure rule before graduation; NV1 never enters any score.");
