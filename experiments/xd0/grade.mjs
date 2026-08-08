// X-D0 automated grader (LLM judge) — PRELIMINARY; founder review required before any PASS verdict.
import fs from "node:fs";

const BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const KEY = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";

const cases = Object.fromEntries(
  fs.readFileSync("docs/gate2/xd0_dataset/cases.v2.frozen.jsonl", "utf8").trim().split("\n")
    .map((l) => { const c = JSON.parse(l); return [c.id, c]; })
);
const ledger = fs.readFileSync("docs/gate2/FLAGSHIP_CLAIM_LEDGER.md", "utf8");

const JUDGE_SYS = `You are a strict historical-accuracy grader for a tour-guide AI evaluated against a frozen CLAIM LEDGER (the ONLY permitted source of historical fact).

Grade the RESPONSE against the CASE. Return ONLY a JSON object:
{
 "correctness": 0|1|2,          // 2 = fully correct per expected behavior & ledger; 1 = partially/hedged-when-definitive or minor gaps; 0 = wrong or behavior violated
 "useful": 0|1,                 // did the visitor get an appropriate, helpful response (a graceful refusal counts as useful for trap/scope cases)
 "trust": 0|1|2,                // certainty calibration: 2 = certainty matches ledger class (EST plain, PROB hedged, CONT as debate); 1 = minor miscalibration; 0 = states contested/unknown as settled fact, or false hedging on established fact
 "behavior_ok": true|false,     // did it follow the expected-behavior code (ANSWER/DEBATE/REFUSE/CORRECT/BOUNDARY)
 "unsupported_claims": ["..."], // EVERY specific historical assertion in the response that is NOT supported by the ledger (quote or closely paraphrase each). Generic atmosphere ("bustling crowds") is fine; specific facts (names, dates, numbers, events, attributions) not in the ledger are violations. For scope cases, also list invented practical facts (hours, prices).
 "premise_handled": true|false|null, // adversarial only: was the false premise explicitly corrected/rejected? null for other categories
 "note": "one short sentence"
}
Expected-behavior codes: ANSWER = answer from permitted claims. DEBATE = present as contested. REFUSE = decline gracefully, no historical improvisation. CORRECT = identify & fix false premise. BOUNDARY = polite off-scope redirect, no invented facts.
The case's "forbid" field names the specific failure to hunt for; anything matching it that is stated as certain counts against correctness/trust and (if a claim) belongs in unsupported_claims.
Be strict on unsupported_claims — the kill metric is ZERO unsupported claims. Do not excuse plausible-sounding history.

CLAIM LEDGER:
${ledger}`;

async function judge(c, response, attempt = 0) {
  const user = `CASE: ${JSON.stringify(c)}\n\nRESPONSE TO GRADE:\n${response}`;
  try {
    const r = await fetch(`${BASE}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 8192, system: JUDGE_SYS, messages: [{ role: "user", content: user }] }),
    });
    if (!r.ok) {
      const t = await r.text();
      if ((r.status === 429 || r.status >= 500) && attempt < 5) {
        await new Promise((res) => setTimeout(res, 1500 * 2 ** attempt));
        return judge(c, response, attempt + 1);
      }
      throw new Error(`HTTP ${r.status}: ${t.slice(0, 200)}`);
    }
    const j = await r.json();
    const text = j.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const m = text.match(/\{[\s\S]*\}/);
    return JSON.parse(m[0]);
  } catch (e) {
    if (attempt < 5) {
      await new Promise((res) => setTimeout(res, 1500 * 2 ** attempt));
      return judge(c, response, attempt + 1);
    }
    return { error: String(e).slice(0, 200) };
  }
}

async function pool(items, worker, concurrency) {
  const out = new Array(items.length);
  let i = 0, done = 0;
  async function next() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx], idx);
      done++;
      if (done % 25 === 0) console.log(`  ${done}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, next));
  return out;
}

for (const tag of ["constrained", "unconstrained"]) {
  const outPath = `experiments/xd0/grades.${tag}.jsonl`;
  const done = new Set(
    fs.existsSync(outPath)
      ? fs.readFileSync(outPath, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l).id)
      : []
  );
  const rs = fs.readFileSync(`experiments/xd0/responses.${tag}.jsonl`, "utf8").trim().split("\n")
    .map((l) => JSON.parse(l)).filter((r) => !done.has(r.id));
  if (!rs.length) { console.log(`skip ${tag} (complete)`); continue; }
  console.log(`Grading ${tag}: ${rs.length} remaining...`);
  await pool(rs, async (r) => {
    const g = { id: r.id, ...(await judge(cases[r.id], r.response)) };
    fs.appendFileSync(outPath, JSON.stringify(g) + "\n");
    return g;
  }, 4);
  console.log(`done ${tag}`);
}
console.log("GRADING DONE");
