# Journal — memory book

Date: 2026-07-14  
Branch: `cursor/calm-ui-density-5d36`  
Scope: redesign Journal (`E1` / `E2` / wiring) as a revisitable memory book — not activity history.

## Intent

Years later, opening Journal should feel like opening a book of the walk: epigraph, letter, chapters, quoted pages, photographs, quiet discoveries — not a list of visits and timestamps.

## Story hierarchy

1. **Front matter** — `journalHeadline`, soft subtitle, reflection epigraph, optional walk footnote  
2. **Letter leaf** — journey letter excerpt + quiet stop/distance line  
3. **Chapters** — acts as chapter openers (`Chapter I` + act title + milestone)  
4. **Memory leaves** — quote → cinematic still (+ then peek) → place name → status caption  
5. **Memory page (E2)** — quote → title → threshold photo → discoveries → walk/listen → words heard → listen again  

## Data (reuse only)

| Element | Source |
|---|---|
| Quotes | `sigLine` / `reflection` / cleaned `arrivalLine` / first transcript sentence (`memoryQuote`) |
| Photos | `photoForWaypoint` / `thenPhotoForWaypoint` + cinematic presentation |
| Discoveries | `keyFacts` or reconstruction caption + cleaned transcript sentences |
| Milestones | Act completion captions via status of path entries |
| Walking stats | Letter walked meters + `product.distanceLabel` — typographic footnote, not a dashboard |
| Letter | `buildJourneyLetter` |

## Status language

| Journey status | Book caption |
|---|---|
| completed | Remembered |
| current | Open on the page |
| upcoming | Still unwritten |

## Non-goals

No new content databases, badge systems, calendars, or discovery catalogs. Stops remains the route spine; Journal remains the book.
