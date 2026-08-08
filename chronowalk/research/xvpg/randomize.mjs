// X-VPG randomization instrument (Day 5.5).
// Balanced 3-condition orders (founder-specified 6-order set), extended as evenly as
// possible for N up to 10. Outputs:
//   session_sheet.csv — participant_id,order_code   (NO condition names — facilitator-safe)
//   order_key.csv     — order_code,seq (neutral labels A/B/C only)
//   label_map.json    — A/B/C -> cell (ANALYST ONLY; do not print or hand to facilitator)
// Usage: node experiments/xvpg/randomize.mjs [N]   (default 10)
import fs from "node:fs";

const N = Math.min(12, Math.max(6, Number(process.argv[2] ?? 10)));
// Founder-specified balanced set for 6 (all permutations => each label appears twice in
// each position). Extension order chosen to keep position counts as even as possible.
const ORDERS = ["ABC", "BCA", "CAB", "ACB", "CBA", "BAC"];
const seq = Array.from({ length: N }, (_, i) => ORDERS[i % 6]);

const sheet = ["participant_id,order_code"];
const key = ["order_code,first,second,third"];
ORDERS.forEach((o, i) => key.push(`O${i + 1},${o[0]},${o[1]},${o[2]}`));
seq.forEach((o, i) => sheet.push(`P${String(i + 1).padStart(2, "0")},O${ORDERS.indexOf(o) + 1}`));

fs.mkdirSync("experiments/xvpg/out", { recursive: true });
fs.writeFileSync("experiments/xvpg/out/session_sheet.csv", sheet.join("\n") + "\n");
fs.writeFileSync("experiments/xvpg/out/order_key.csv", key.join("\n") + "\n");
// Analyst-only mapping. A/B/C are arbitrary neutral labels; they intentionally do NOT
// correspond to condition initials.
fs.writeFileSync(
  "experiments/xvpg/out/label_map.json",
  JSON.stringify({ A: "b5_lantern", B: "control", C: "b1_layered" }, null, 2) + "\n"
);

// Position-balance report (labels per position across N participants)
const counts = {};
for (const o of seq) for (let p = 0; p < 3; p++) counts[`${o[p]}@${p + 1}`] = (counts[`${o[p]}@${p + 1}`] ?? 0) + 1;
console.log(`N=${N}`, counts);
console.log("Wrote experiments/xvpg/out/{session_sheet.csv,order_key.csv,label_map.json}");
