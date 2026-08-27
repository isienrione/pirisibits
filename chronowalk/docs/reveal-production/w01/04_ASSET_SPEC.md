# w01 — 04 Asset Specification

**Place:** `w01` Colosseum exterior  
**Still-first:** **mandatory (founder seal)**  
**Motion:** **deferred** until Then still passes registration / historical / visual QA

---

## Final deliverables (shipping names)

All under `public/waypoints/colosseum/exterior/`:

| Role | Filename | Required |
|------|----------|----------|
| **Now still (camera lock)** | `modern-poster.jpg` | **Keep — permanent lock this iteration** |
| **Then still (Living Postcard)** | `ancient-living-postcard.jpg` *(new)* | **Yes — primary flagship still** |
| Optional Then poster alias | May also set manifest `then` → above | Yes when wiring |
| Optional motion loop | `ancient-living-postcard.mp4` *(new)* | **Not yet** — only after Then still QA PASS |
| Legacy loop | `ancient-reconstruction.mp4` | Keep as reference until replaced |
| Legacy landscape still | `ancient-reconstruction.jpg` | Reference only — do not wire as then |

Prototype composites (if any):  
`docs/reveal-production/w01/prototypes/w01-prototype-*.jpg` — **not shipping**.

---

## Pixel / format targets

| Asset | Pixels | Format | Byte target | Notes |
|-------|--------|--------|-------------|-------|
| Now | 941×1672 (current) or 1080×1920 | JPEG or WebP if pipeline supports | ≤ **400 KB** (current ~339 KB OK) | Portrait |
| Then still | **Identical canvas to Now** | JPEG (baseline) / WebP if supported end-to-end | ≤ **400 KB** (prefer ≤350) | Must pixel-align façade |
| Optional loop | 720×1280 or 1080×1920 | H.264 MP4 · muted · seamless ≤10s | ≤ **2.5 MB** (hard ≤3 MB) | Same camera; no cuts |

**Do not** ship landscape Then against portrait Now.

---

## Manifest fields (when implementation PR ships — not this pre-prod)

Still-only first (founder seal — no motion until Then QA):

```json
"reconstruction": {
  "now": "/waypoints/colosseum/exterior/modern-poster.jpg",
  "then": "/waypoints/colosseum/exterior/ancient-living-postcard.jpg",
  "caption": "Evidence-based reconstruction · awning colours and decorative details are informed conjecture"
}
```

After Then still QA PASS, an optional later PR may add:

```json
"loop": "/waypoints/colosseum/exterior/ancient-living-postcard.mp4"
```

Until then, do not produce or wire a new motion loop. Legacy loop may remain unwired or left as-is until replaced.

---

## Preload / offline / hydrate

| Asset | Offline pack | Hydrate |
|-------|--------------|---------|
| Now still | Yes (already) | Stills hydrate OK |
| Then still | Yes (add when wired) | Stills hydrate OK |
| Loop | Listed by collector today for any `loop` path | **On-demand only** — never mass blob-hydrate videos (iOS OOM) |

Fallback: if video fails, Threshold already falls back to Then poster still.

---

## Safe composition zones (941×1672)

Assume immersive `cover` + `object-position: center 28%`:

- **Primary safe:** vertical center band ~20–75% height (façade + break)  
- **Secondary:** lower 15–40% (plaza life)  
- **At risk of crop:** extreme top sky; extreme bottom railing  

Produce masters with critical anchors inside primary safe zone.
