/**
 * X-VPG HPS FORM — Day 5.5 experiment instrument (NOT production code).
 * Implements the FROZEN HPS v0 instrument EXACTLY (docs/gate2/HPS_V0_FROZEN_INSTRUMENT.md):
 * wording and scoring untouched. Administered immediately after EACH cell.
 * - 7-point scale, anchors printed on every item block.
 * - Item order randomized within blocks (core block, diagnostic block) per administration.
 * - Desk sessions: AC2 omitted via toggle (AC = AC1), per instrument.
 * - Comprehension questions (4 MC) after the scale items.
 * - NO computed scores are shown to the participant — facilitator uses "Copy record"
 *   which emits the raw JSONL line for experiments/xvpg/out/sessions.jsonl.
 */
import { useMemo, useState } from "react";

const CORE_ITEMS: [string, string][] = [
  ["SP1", "I felt oriented inside the historical place — I knew where things were around me."],
  ["SP2", "The historical space felt like it had real depth and extent, not like an image in front of me."],
  ["TP1", "At moments, I could genuinely imagine standing in this place in another era."],
  ["TP2", "The past version of this place felt like somewhere that once really existed, not like an illustration."],
  ["HL1", "I now understand what this place used to be and how it worked."],
  ["HL2", "I could point at specific things around me and say what they were."],
  ["EW1", "Something in this experience moved me or gave me chills."],
  ["EW2", "I wanted to stay longer in the moment the experience created."],
];
const DIAG_ITEMS: [string, string][] = [
  ["IB1", "Operating the experience (holding, aiming, tapping) got in the way of the experience itself."],
  ["IB2", "I had to think about the app more than about the place."],
  ["AC1", "The experience pulled me away from the real place in front of me."],
  ["AC2", "Afterwards I felt I had looked at a screen more than at the site."],
  ["TR1", "I trust that what I was shown and told is historically accurate."],
  ["TR2", "I could tell what was known fact versus reconstruction or interpretation."],
  ["NV1", "This felt technologically impressive."],
];
// Comprehension questions — ledger-supported content present in the shared stimulus/narration.
const COMPREHENSION: { q: string; opts: string[]; correct: number }[] = [
  { q: "The triple arch on the left of the view was built to celebrate…", opts: ["A naval victory", "The Parthian campaigns", "The founding of Rome", "A new aqueduct"], correct: 1 },
  { q: "The eight grey granite columns near the viewpoint belong to…", opts: ["The Senate house", "The Temple of Saturn", "A market hall", "The imperial palace"], correct: 1 },
  { q: "The long arcaded building across the square (Basilica Julia) housed…", opts: ["Gladiator training", "Civil courts", "A library", "Baths"], correct: 1 },
  { q: "The vast vaulted building on the far horizon was, in this era…", opts: ["Centuries old", "Brand new", "Already ruined", "Still unbuilt"], correct: 1 },
];

function shuffle<T>(a: T[]): T[] {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
}

function Scale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="mt-2 flex justify-between gap-1">
      {[1, 2, 3, 4, 5, 6, 7].map((v) => (
        <button key={v} onClick={() => onChange(v)}
          className={`h-10 flex-1 rounded text-sm font-semibold ${value === v ? "bg-amber-500 text-black" : "bg-neutral-800 text-white/70"}`}>
          {v}
        </button>
      ))}
    </div>
  );
}

export function XvpgHpsForm() {
  const [participant, setParticipant] = useState("");
  const [label, setLabel] = useState(""); // neutral cell label A/B/C from the order key
  const [desk, setDesk] = useState(false); // desk session => omit AC2
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [comp, setComp] = useState<Record<number, number>>({});
  const [copied, setCopied] = useState(false);
  // randomize within blocks once per administration
  const core = useMemo(() => shuffle(CORE_ITEMS), []);
  const diag = useMemo(() => shuffle(DIAG_ITEMS.filter(([id]) => !(desk && id === "AC2"))), [desk]);

  const required = [...core, ...diag].map(([id]) => id);
  const complete = participant && label && required.every((id) => answers[id]) && COMPREHENSION.every((_, i) => comp[i] != null);

  const record = () => {
    const correct = COMPREHENSION.reduce((s, c, i) => s + (comp[i] === c.correct ? 1 : 0), 0);
    return JSON.stringify({ participant, label, desk, items: answers, comprehension: { correct, total: COMPREHENSION.length } });
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-lg font-bold">After this version: a few quick questions</h1>
          <p className="mt-1 text-sm text-white/60">There are no right or wrong answers for the rating questions. Some versions are deliberately unfinished.</p>
        </div>
        <div className="flex gap-2">
          <input value={participant} onChange={(e) => setParticipant(e.target.value)} placeholder="Participant (P01…)"
            className="w-1/2 rounded bg-neutral-800 px-3 py-2 text-sm" />
          <input value={label} onChange={(e) => setLabel(e.target.value.toUpperCase())} placeholder="Version (A/B/C)"
            className="w-1/4 rounded bg-neutral-800 px-3 py-2 text-sm" />
          <label className="flex w-1/4 items-center gap-1 text-xs text-white/60">
            <input type="checkbox" checked={desk} onChange={(e) => setDesk(e.target.checked)} /> desk
          </label>
        </div>

        {[...core, ...diag].map(([id, text]) => (
          <div key={id} className="rounded-lg bg-neutral-900 p-3">
            <p className="text-sm">{text}</p>
            <div className="mt-1 flex justify-between text-[10px] text-white/40">
              <span>1 = Not at all true for me</span><span>7 = Completely true for me</span>
            </div>
            <Scale value={answers[id] ?? null} onChange={(v) => setAnswers((a) => ({ ...a, [id]: v }))} />
          </div>
        ))}

        <h2 className="pt-2 text-sm font-bold text-white/80">A few questions about the place itself</h2>
        {COMPREHENSION.map((c, i) => (
          <div key={i} className="rounded-lg bg-neutral-900 p-3">
            <p className="text-sm">{c.q}</p>
            <div className="mt-2 space-y-1">
              {c.opts.map((o, j) => (
                <button key={j} onClick={() => setComp((x) => ({ ...x, [i]: j }))}
                  className={`block w-full rounded px-3 py-2 text-left text-sm ${comp[i] === j ? "bg-amber-500 text-black" : "bg-neutral-800 text-white/80"}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Facilitator-only: raw record export. No scores computed or displayed. */}
        <button disabled={!complete}
          onClick={() => { navigator.clipboard.writeText(record()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className={`w-full rounded px-4 py-3 text-sm font-bold ${complete ? "bg-amber-500 text-black" : "bg-neutral-800 text-white/30"}`}>
          {copied ? "Copied — paste into sessions.jsonl" : complete ? "Done — hand back to facilitator" : "Please answer every question"}
        </button>
      </div>
    </div>
  );
}
