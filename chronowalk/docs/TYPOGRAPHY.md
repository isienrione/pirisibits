# Typography — book-like rhythm (fonts unchanged)

Date: 2026-07-14  
Branch: `cursor/calm-ui-density-5d36`  
Scope: presentation only — **Fraunces** (display) and **DM Sans** (UI) stay locked by DESIGN_LAW.

## Intent

Screens should read like a premium printed book: open display titles, generous body leading, clear caption ladder, and settled button type — without swapping families or inventing new voices.

## Source of truth

| Layer | Path |
|---|---|
| CSS vars + utilities | `src/design/tokens.css` (`--fs-*`, `--lh-*`, `--tracking-*`, `--type-after-*`, `.cw-type-*`) |
| JS roles | `src/redesign/typography.js` (`TYPE`, `TYPE_SPACE`, `displayTitleStyle`) |
| Re-export | `src/redesign/ui/index.js` |

## Roles

| Role | Size | LH | Tracking | Use |
|---|---|---|---|---|
| `display` / `title` | 34 / 32 | 1.14 / 1.18 | −0.012 / −0.008em | Screen heroes |
| `heading` / `cardTitle` | 22 / 20 | 1.28 | 0 | Act / card titles |
| `body` | 17 | 1.65 | 0.012em | UI paragraphs |
| `prose` | 20 | 1.8 | 0.01em | Transcript / letter reading |
| `ui` / `subtitle` | 15 | 1.5 | 0.015em | Secondary copy |
| `meta` | 13 | 1.45 | 0.04em | Meta rows, back links |
| `caption` | 12 | 1.4 | 0.06em | Support lines |
| `kicker` | 10 | 1.35 | 0.22em | Eyebrow (uppercase) |
| `section` | 11 | 1.4 | 0.14em | SectionLabel |
| `button` / `buttonQuiet` | 15 / 14 | 1.2 | 0.02em | CTAs |
| `tab` / `status` / `chip` | 11–12 | caption | see tokens | Chrome |

## Caption hierarchy (top → quiet)

1. **Kicker** (`Eyebrow`) — widest tracking, smallest size  
2. **Section** (`SectionLabel`) — one step larger, denser tracking  
3. **Status / tab** — readable at 11px (not 9–10 for essential chrome)  
4. **Meta** — 13px with mild tracking  
5. **Caption** — 12px support / italic lines  

## Vertical rhythm

- After display → `--type-after-display` (0.5em)  
- After heading → `--type-after-heading` (0.4em)  
- After paragraph → `--type-after-paragraph` (0.9em)  
- After kicker → `--type-after-kicker` (0.55em)  
- Optical pad on large Fraunces → `--type-optical-display` (0.04em)

## Accessibility

- Long reading prefers `--fs-body` (17) / `--lh-body` (1.65) or prose.  
- Essential chrome captions stay ≥ 11px (`TabBar` raised from 10 → 11).  
- Do not shrink tap targets when tuning button type.  
- Prefer CSS variables so system text zoom scales correctly.

## Migration rule

Prefer `TYPE.*` / `displayTitleStyle(n)` / `.cw-type-*` over raw `fontSize` / `lineHeight` / `letterSpacing` literals. Never change `F.display` / `F.body` or `--font-*` families.
