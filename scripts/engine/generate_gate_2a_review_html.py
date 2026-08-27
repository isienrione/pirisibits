#!/usr/bin/env python3
"""Gate 2A human-readable node utility review HTML."""

from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
AUDIT = ROOT / "docs/engine/gate-2a-data-completeness.json"
SCORES = ROOT / "docs/engine/gate-2a-fixture-scores.json"
OUT = ROOT / "docs/engine/gate-2a-node-utility-review.html"

THEME_LABELS = {
    "T1A": "Civic / Traditional Heritage",
    "T1B": "Memory / Human Rights",
    "T3": "Aesthetics",
    "T4": "Subculture / Indie",
    "T5": "Mindful / Quiet",
    "T6": "Dark Lore",
    "T7": "Budget / Street Life",
    "T8": "Urban Ecology",
    "T9": "Luxury Heritage",
}


def esc(v) -> str:
    return html.escape("" if v is None else str(v))


def main() -> int:
    engine = json.loads(ENGINE.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8")) if AUDIT.exists() else {}
    scored = json.loads(SCORES.read_text(encoding="utf-8")) if SCORES.exists() else {}
    launch = sorted([n for n in engine["nodes"] if n.get("launchCorpus")], key=lambda n: n["stgoId"])
    personas = [
        "A_first_time_essentials",
        "B_civic_history",
        "E_memory_human_rights",
        "F_discovery_forward",
        "H_accessibility_sensitive",
    ]

    rows = ""
    for n in launch:
        themes = ", ".join(THEME_LABELS.get(t, t) for t in (n.get("themes") or []))
        missing = ["Visit time", "Opening hours", "Accessibility"]
        if n.get("chronoWorth") is None:
            missing.insert(0, "ChronoWorth")
        persona_cells = ""
        for p in personas:
            cell = (scored.get(p) or {}).get(n["stgoId"])
            if cell:
                persona_cells += (
                    f"<td>{esc(cell['utility'])} <span class='muted'>#{esc(cell['rank'])}</span></td>"
                )
            elif n["stgoId"] in (scored.get(p + "__excluded") or []):
                persona_cells += "<td class='excl'>excluded</td>"
            else:
                persona_cells += "<td class='muted'>—</td>"
        rows += f"""
        <tr>
          <td><b>{esc(n['stgoId'])}</b><br/>{esc(n.get('displayName'))}</td>
          <td>{esc(n.get('editorialRole'))}<br/><span class='muted'>{esc(n.get('launchRuntimeDisposition'))}</span></td>
          <td>{esc(n.get('chronoWorth') if n.get('chronoWorth') is not None else 'MISSING')}</td>
          <td>{esc(themes)}</td>
          <td>{esc(', '.join(n.get('modes') or []))}</td>
          <td class='muted'>UNKNOWN</td>
          <td>{esc(', '.join(missing))}</td>
          {persona_cells}
        </tr>"""

    coverage = "".join(
        f"<li><b>{esc(k)}</b>: complete={esc(v.get('complete'))} "
        f"partial={esc(v.get('partial'))} missing={esc(v.get('missing'))}</li>"
        for k, v in (audit.get("fields") or {}).items()
    )

    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Gate 2A — Node Utility Review</title>
<style>
body {{ margin:0; font-family: Georgia, serif; background:#f7f1e8; color:#1c1a17; }}
header, section {{ max-width:1400px; margin:0 auto; padding:18px 20px; }}
table {{ width:100%; border-collapse:collapse; font-size:13px; background:#fffdf8; }}
th, td {{ border-bottom:1px solid #e6ddd0; padding:8px; text-align:left; vertical-align:top; }}
th {{ position:sticky; top:0; background:#efe6d8; }}
.muted {{ color:#7a6f62; font-size:12px; }}
.excl {{ color:#8a2f2f; }}
.card {{ background:#fffdf8; border:1px solid #d9d0c2; border-radius:10px; padding:12px 14px; margin-bottom:12px; }}
</style>
</head>
<body>
<header>
  <h1>Gate 2A — Node Utility QA Review</h1>
  <p>Human-readable launch-30 review. Utilities are engine QA fixtures, not customer personas.
     Missing ChronoWorth / visit time / accessibility are shown honestly.</p>
</header>
<section class="card">
  <h2>Data completeness (launch 30)</h2>
  <ul>{coverage or '<li>Run validate_gate_2a.py first.</li>'}</ul>
</section>
<section>
  <table>
    <thead>
      <tr>
        <th>Node</th><th>Role / disposition</th><th>ChronoWorth</th><th>Themes</th><th>Modes</th><th>Visit time</th><th>Missing</th>
        <th>Essentials</th><th>Civic/Hist</th><th>Memory</th><th>Discovery</th><th>Access-sensitive</th>
      </tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>
</section>
</body>
</html>
"""
    OUT.write_text(doc, encoding="utf-8")
    print("Wrote", OUT.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
