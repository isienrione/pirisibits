---
name: Replit env quirks
description: Environment-specific quirks hit while running long experiment batches and the mockup sandbox
---

- Detached background processes (`setsid nohup node ... &`) die silently between agent shell sessions in this workspace. For long LLM batch jobs, run in foreground chunks with `timeout 280 ...` and make the script append/resume per item (idempotent). **Why:** two background runs died mid-batch with no error output. **How to apply:** any experiment runner >5 min → foreground chunked loops, per-case append + done-set resume.
- `cat a.txt b.txt` merged the last line of one file with the first of the next when the first lacked a trailing newline, producing a bogus ID (`T040F010`). Verify merged ID lists against the source set.
- Vite `base` from `BASE_PATH` env may lack a trailing slash → `import.meta.env.BASE_URL + "sub/path"` silently 404s assets in the mockup sandbox. Normalize: append `/` if missing.
