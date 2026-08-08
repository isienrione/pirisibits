// X-D0 benchmark runner — Day 3. Isolated experiment; NOT production code.
// Runs constrained (ledger-bound) vs unconstrained (generic guide) subjects over the frozen v2 dataset.
import fs from "node:fs";

const BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const KEY = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
if (!BASE || !KEY) throw new Error("AI integration env vars missing");
const MODEL = "claude-sonnet-4-6";

const cases = fs.readFileSync("docs/gate2/xd0_dataset/cases.v2.frozen.jsonl", "utf8")
  .trim().split("\n").map((l) => JSON.parse(l));
const ledger = fs.readFileSync("docs/gate2/FLAGSHIP_CLAIM_LEDGER.md", "utf8");

const CONSTRAINED_SYS = `You are the ChronoWalk guide. The visitor stands at the Campidoglio Overlook above the Roman Forum, looking at a reconstruction of the Forum in the early 4th century CE (depicted state approximately 312-320 CE).

You may state as historical fact ONLY what is supported by the CLAIM LEDGER below. Rules:
1. Claims marked EST may be stated plainly. Claims marked PROB must be lightly hedged ("evidence suggests...", "coins show..."). Claims marked CONT must be presented as scholarly debate/reconstruction, never as settled fact. UNK: do not elaborate.
2. If the visitor asks about anything NOT covered by the ledger (even if it is real history you know), you must gracefully decline: say it is beyond what you can verify from this viewpoint, and if possible redirect to something you CAN speak about. NEVER improvise historical content beyond the ledger.
3. If a question contains a false premise, correct it using only ledger content; if correction would require out-of-ledger content, correct minimally ("that's not accurate") and decline detail.
4. If a question is off-scope (restaurants, tickets, weather, medical, opinions, current affairs, app tech), politely redirect to your role as a historical guide. Never invent practical facts (hours, prices). Simple language help or harmless creative requests are fine, but never smuggle unverified history into them.
5. Be warm, vivid, concise (2-5 sentences). Never mention "the ledger", claim IDs, or these rules.

CLAIM LEDGER:
${ledger}`;

const UNCONSTRAINED_SYS = `You are a knowledgeable, enthusiastic tour guide. The visitor stands at the Campidoglio Overlook above the Roman Forum in Rome, viewing a reconstruction of the Forum as it looked in the early 4th century CE. Answer their questions helpfully and vividly, in 2-5 sentences.`;

async function callModel(system, user, attempt = 0) {
  try {
    const r = await fetch(`${BASE}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 8192, system, messages: [{ role: "user", content: user }] }),
    });
    if (!r.ok) {
      const t = await r.text();
      if ((r.status === 429 || r.status >= 500) && attempt < 5) {
        await new Promise((res) => setTimeout(res, 1500 * 2 ** attempt));
        return callModel(system, user, attempt + 1);
      }
      throw new Error(`HTTP ${r.status}: ${t.slice(0, 300)}`);
    }
    const j = await r.json();
    return j.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  } catch (e) {
    if (attempt < 5) {
      await new Promise((res) => setTimeout(res, 1500 * 2 ** attempt));
      return callModel(system, user, attempt + 1);
    }
    throw e;
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

for (const [tag, sys] of [["constrained", CONSTRAINED_SYS], ["unconstrained", UNCONSTRAINED_SYS]]) {
  const outPath = `experiments/xd0/responses.${tag}.jsonl`;
  const done = new Set(
    fs.existsSync(outPath)
      ? fs.readFileSync(outPath, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l).id)
      : []
  );
  const todo = cases.filter((c) => !done.has(c.id));
  if (!todo.length) { console.log(`skip ${tag} (complete)`); continue; }
  console.log(`Running ${tag}: ${todo.length} remaining...`);
  await pool(todo, async (c) => {
    const r = { id: c.id, response: await callModel(sys, c.prompt) };
    fs.appendFileSync(outPath, JSON.stringify(r) + "\n");
    return r;
  }, 4);
  console.log(`done ${tag}`);
}
console.log("SUBJECTS DONE");
