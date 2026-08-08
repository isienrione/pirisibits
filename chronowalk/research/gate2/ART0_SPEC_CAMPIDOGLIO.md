# ART-0 Specification — Campidoglio Forum Overlook panorama (c. 315 CE)

Instance of `ART0_BRIEF_TEMPLATE.md`. **Specification only — no assets generated or commissioned. $0.** All content constrained by `FLAGSHIP_CLAIM_LEDGER.md` v1 (claim IDs referenced throughout).

## 1. Identification
- **Brief ID:** ART0-FORUM-CAMPIDOGLIO-v1
- **Vantage:** railing at Via del Campidoglio / Via di Monte Tarpeo, SE flank of Palazzo Senatorio; orientation ≈ SE (120–135°); eye height ≈ 1.6 m; terrace ≈ 15–20 m above Forum floor; FOV 60–75° horizontal (per DAY1_APPROVAL_PACK §B).
- **Era:** c. 315 CE (ledger GEN-01).
- **Experiments served:** X-VPG (all three cells), later B1 full protocol; Lantern; C1 base era.

## 2. Modern base image (L0) requirements
- Interim (desk/VPG phase): a licensed or self-shot high-res photograph matching the defined position/orientation as closely as available imagery allows; if licensed imagery is used, its actual FOV/position deltas from the defined vantage are documented and inherited by all layers. Final backplate re-shot on-site during the Rome trip (tripod, morning light, RAW).
- Resolution: ≥ 6000 px wide master; delivery crops at 3840×2160 (16:9 landscape) and 1170×2532 portrait crop for phone testing.
- Even, soft light (overcast or morning); no strong shadows (they fight the reconstruction lighting); minimal tourists in frame (or removable via M1 masks).

## 3. Reconstruction depth planes (L1–L5) and layer list
| Layer | Depth plane | Contents (ledger IDs) | Grade |
|---|---|---|---|
| L1 near | 20–60 m | Temple of Vespasian (VES-01/02), Temple of Concord (CON-01/02), Arch of Septimius Severus (SEV-01..04), Rostra + rams + Decennalia columns (ROS-01..03), Curia (CUR-01/02) | SEV/VES: historically constrained geometry · CON elevation: constrained MASS, approximate detail (flagged) |
| L2 near-right | 40–80 m | Temple of Saturn (SAT-01/02; pediment per SAT-04 = plain blockout) | constrained geometry (standing colonnade anchors it) |
| L3 mid | 80–200 m | Basilica Julia (BJ-01; roof per BJ-02 = conservative blockout), honorific columns row (GEN-03, generic statues), square pavement + Via Sacra (GEN-02, VIA-01), crowd figures (GEN-01, generic dress, sparse) | facade constrained; roof approximate |
| L4 far | 200–400 m | Temple of Castor & Pollux (CAS-01), Temple of Divus Julius (DIV-01..03, conservative hexastyle), Basilica Aemilia + shops (AEM-01) | masses constrained; facades approximate |
| L5 horizon | 400 m+ | Arch of Titus silhouette (TIT-01), Basilica of Maxentius mass (MAX-01), Velia/Palatine slopes, sky | silhouette blockout |
- Each layer delivered as separate PNG w/ alpha at master resolution + registration marks (A1 guide) to L0.

## 4. Occlusion masks (M1 set)
- M1a: modern clutter removal mask on L0 (railings, signage, lamp posts, tourists, trees per do-not-depict #4).
- M1b: Column of Phocas mask — REMOVED in reconstruction (GEN-05); its spot rendered as open pavement, no invented monument.
- M1c: per-layer edge masks where modern ruin stubs (Saturn columns, Castor columns, Curia shell) must blend into their reconstructed buildings — these are the "anchor points" where today's remains visibly become the intact structure (key to the then/now magic).

## 5. Lantern reveal regions (R set — polygon map over the frame)
R1 Arch of Septimius Severus (+quadriga) · R2 Rostra + Decennalia columns · R3 Curia · R4 Temple of Saturn · R5 Temple of Vespasian/Concord group · R6 Basilica Julia · R7 honorific column row + square/crowds · R8 Castor & Pollux · R9 Divus Julius · R10 Basilica Aemilia · R11 far axis (Titus + Maxentius). Each region: polygon, ledger IDs, one-line reveal caption (narration-safe claims only). Beam behavior: reveal = local then→now blend inside beam falloff; confidence styling deferred (not in VPG).

## 6. B1 layering regions
B1 uses the same L1–L5 planes for parallax (device tilt ±3–5° displacement, near layers move most) and a global then/now scrub (L0↔L1–L5 crossfade with M1c anchor blends). No per-region interaction.

## 7. Shared control asset (C cell)
FLAT-315: single flattened composite of L1–L5 at identical resolution/framing — the control's "then" image. Binary crossfade L0 ↔ FLAT-315. **Pixel-identical content to the layered version** (fairness rule, DAY1 §C); flattening QA'd for artifacts before sessions.

## 8. Approximate blockout vs constrained geometry
- **Constrained (must match ledger geometry):** SEV arch (standing), SAT front (standing), VES front (standing corner), CAS (standing), CUR (standing), Rostra platform, building footprints/heights of BJ/AEM/DIV/CON per plans.
- **Approximate blockout allowed:** all roofs (BJ-02), CON elevation detail, DIV facade detail, SEV-04 quadriga (generic group), statue figures (GEN-03), crowds, far-plane silhouettes, polychromy (restrained generic per GEN-04).

## 9. Explicit DO NOT DEPICT
Per ledger register: Column of Phocas in 315 scene · invented pediment sculpture · named statue identities · modern/medieval accretions · specific color schemes · interiors. Plus: no weather drama, no golden-hour glamour lighting (matches L0 light), no anachronistic vegetation.

## 10. Production methods & budget (when authorized)
AI reconstruction drafts (image models, per-layer prompts from this spec §3) → founder plausibility QA against ledger → paintover/cleanup (self or ≤$300 freelancer) → layer separation + masks. Hours logged to Track F. **Not started until GO DAY 3 (or later founder GO).**

## 11. Acceptance criteria
Template criteria + : M1c anchor blends convincing at phone size · FLAT-315 visually indistinguishable in quality from layered composite at rest · every depicted element traces to a ledger ID · do-not-depict register verified item by item at QA.
