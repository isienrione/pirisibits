// Day 3 founder adjudication pack helper — produces PRELIMINARY classifications ONLY.
// Founder decision is authoritative; these are recommendations. Isolated experiment code.
import fs from "node:fs";

const BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const KEY = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";

const cases = Object.fromEntries(
  fs.readFileSync("docs/gate2/xd0_dataset/cases.v2.frozen.jsonl", "utf8").trim().split("\n")
    .map((l) => JSON.parse(l)).map((c) => [c.id, c])
);
const responses = Object.fromEntries(
  fs.readFileSync("experiments/xd0/responses.constrained.jsonl", "utf8").trim().split("\n")
    .map((l) => JSON.parse(l)).map((r) => [r.id, r.response])
);
const grades = Object.fromEntries(
  fs.readFileSync("experiments/xd0/grades.constrained.jsonl", "utf8").trim().split("\n")
    .map((l) => JSON.parse(l)).map((g) => [g.id, g])
);
const ledger = fs.readFileSync("docs/gate2/FLAGSHIP_CLAIM_LEDGER.md", "utf8");

async function callModel(system, user, attempt = 0) {
  try {
    const r = await fetch(`${BASE}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2048, system, messages: [{ role: "user", content: user }] }),
    });
    if (!r.ok) {
      const t = await r.text();
      if ((r.status === 429 || r.status >= 500) && attempt < 6) {
        await new Promise((res) => setTimeout(res, 1500 * 2 ** attempt));
        return callModel(system, user, attempt + 1);
      }
      throw new Error(`HTTP ${r.status}: ${t.slice(0, 200)}`);
    }
    const j = await r.json();
    return j.content.map((b) => b.text || "").join("");
  } catch (e) {
    if (attempt < 6 && !String(e).includes("HTTP 4")) {
      await new Promise((res) => setTimeout(res, 1500 * 2 ** attempt));
      return callModel(system, user, attempt + 1);
    }
    throw e;
  }
}

function parseJSON(t) {
  const m = t.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : t);
}

async function pool(items, fn, n) {
  let i = 0, done = 0;
  const next = async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
      if (++done % 10 === 0) console.log(`  ${done}/${items.length}`);
    }
  };
  await Promise.all(Array.from({ length: n }, next));
}

// ---------- PART 1: classify all 65 constrained flags ----------
const flags = [];
for (const g of Object.values(grades)) {
  (g.unsupported_claims || []).forEach((u, i) => flags.push({ id: g.id, flagNo: i + 1, text: u, note: g.note }));
}
console.log(`flags: ${flags.length}`);

const CLS_SYS = `You are assisting a historical-accuracy adjudication for a Roman Forum guide system. The guide was ONLY allowed to state what the CLAIM LEDGER below supports (EST plainly, PROB hedged, CONT as debate). An automated judge flagged certain response fragments as "unsupported claims". Your job: give a PRELIMINARY classification of each flag for human founder review. Be rigorous and honest; do not soften real fabrications, and do not over-penalize ordinary connective language.

Classifications:
A = REAL UNSUPPORTED CLAIM (specific historical assertion with no ledger basis)
B = OVER-SPECIFIC / DECORATIVE LEAK (has a ledger anchor but adds unsupported specifics/embellishment)
C = PERMITTED PARAPHRASE (ordinary-language restatement or spatial connective language of ledger content)
D = JUDGE FALSE POSITIVE (flagged text is actually ledger-supported or not a historical claim at all)
E = AMBIGUOUS — FOUNDER DECISION

Severity: "critical" (critical historical fabrication) | "material" (material unsupported detail) | "minor" (minor atmospheric embellishment) | "harmless" (harmless wording)
Proposed decision: "violation" | "not violation" | "ambiguous"

Reply ONLY with JSON: {"classification":"A|B|C|D|E","severity":"...","judge_reason":"<=25 words why the judge flagged it","evidence":"<=40 words ledger basis for your classification, cite claim IDs","decision":"violation|not violation|ambiguous"}

CLAIM LEDGER:
${ledger}`;

const clsPath = "experiments/xd0/adjudication.flags.jsonl";
const doneCls = new Set(fs.existsSync(clsPath) ? fs.readFileSync(clsPath, "utf8").trim().split("\n").filter(Boolean).map((l) => { const j = JSON.parse(l); return j.id + "#" + j.flagNo; }) : []);
const todoCls = flags.filter((f) => !doneCls.has(f.id + "#" + f.flagNo));
console.log(`classify: ${todoCls.length} remaining`);
await pool(todoCls, async (f) => {
  const c = cases[f.id];
  const user = `CASE ${f.id} (category: ${c.cat})
Visitor prompt: ${c.prompt}
Permitted ledger claim IDs for this case: ${(c.permit || []).join(", ") || "(none listed)"}
Forbidden for this case: ${c.forbid || "(none listed)"}
Full guide response: ${responses[f.id]}
FLAGGED FRAGMENT (judge's words, may include judge commentary after a dash): ${f.text}
Judge's overall note: ${f.note || ""}`;
  const out = parseJSON(await callModel(CLS_SYS, user));
  fs.appendFileSync(clsPath, JSON.stringify({ id: f.id, flagNo: f.flagNo, text: f.text, ...out }) + "\n");
}, 4);
console.log("FLAGS CLASSIFIED");

// ---------- PART 2: 40-case spot-check recommendations ----------
const sample = fs.readFileSync("experiments/xd0/spotcheck_sample.txt", "utf8").trim().split("\n");
const SC_SYS = `You are assisting human verification of an automated benchmark grade for a ledger-constrained Roman Forum guide. Given the case, the guide's answer, the ledger, and the automated grade, produce: a faithful <=45-word condensation of the answer, and your RECOMMENDED human scores (they may agree or disagree with the automated grade). Scoring: correctness 0-2 (2 fully correct per ledger), trust 0-2 (2 = confidence perfectly calibrated to ledger EST/PROB/CONT levels), behavior pass/fail vs expected behavior code, unsupported yes/no (any claim beyond ledger). Reply ONLY JSON: {"condensed":"...","rec_correctness":0-2,"rec_trust":0-2,"rec_behavior":"pass|fail","rec_unsupported":"yes|no","discrepancy":"<=25 words, 'none' if you agree with the automated grade"}

CLAIM LEDGER:
${ledger}`;

const scPath = "experiments/xd0/adjudication.spotcheck.jsonl";
const doneSc = new Set(fs.existsSync(scPath) ? fs.readFileSync(scPath, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l).id) : []);
const todoSc = sample.filter((id) => !doneSc.has(id));
console.log(`spotcheck: ${todoSc.length} remaining`);
await pool(todoSc, async (id) => {
  const c = cases[id], g = grades[id];
  const user = `CASE ${id} (category: ${c.cat})
Visitor prompt: ${c.prompt}
Expected behavior code: ${c.expected}
Permitted ledger claim IDs: ${(c.permit || []).join(", ") || "(none)"}
Forbidden: ${c.forbid || "(none)"}
Guide answer: ${responses[id]}
Automated grade: correctness ${g.correctness}/2, trust ${g.trust}/2, behavior_ok ${g.behavior_ok}, unsupported_claims ${JSON.stringify(g.unsupported_claims || [])}`;
  const out = parseJSON(await callModel(SC_SYS, user));
  fs.appendFileSync(scPath, JSON.stringify({ id, ...out }) + "\n");
}, 4);
console.log("SPOTCHECK DONE");
