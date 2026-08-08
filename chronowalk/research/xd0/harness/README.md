# X-D0 harness — DO NOT RERUN WITHOUT EXPLICIT FOUNDER AUTHORIZATION

These scripts (`run.mjs`, `grade.mjs`, `adjudicate.mjs`) are preserved only so the Gate 2 constrained-Q&A experiment remains reproducible **in principle**.

They call external model/API endpoints and can incur **paid usage**. The ChronoWalk founder already ratified the frozen evidence trail under `research/xd0/runs/` and `research/xd0/dataset/`.

## Canonical evidence (already paid for — do not regenerate)

- Frozen dataset: `research/xd0/dataset/cases.v2.frozen.jsonl` + `VERSION.txt`
- Frozen prompt: `docs/research/xd0/PROMPTS_CONSTRAINED_V3_FROZEN.md` (`constrained_v3`)
- Responses / grades / unsupported dumps / adjudication: `research/xd0/runs/`
- Verdict docs: `docs/research/xd0/XD0_V3_FINAL_REVIEW.md`, `docs/research/xd0/XD0_CONSTRAINED_POLICIES.md`

## Rules

1. **Do not rerun** these scripts casually, in CI, or to “verify files exist.”
2. **Do not** regenerate hundreds of LLM responses, grades, or adjudications.
3. Any future run requires **explicit founder authorization** and a new versioned output directory — never overwrite `research/xd0/runs/`.
4. Presence of this harness is **not** product implementation authorization for in-app Q&A.

