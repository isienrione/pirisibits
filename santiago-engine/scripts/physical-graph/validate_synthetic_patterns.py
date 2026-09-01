#!/usr/bin/env python3
"""Synthetic-pattern detector for Gate 1B.2 engine nodes."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / "src/data/santiago/santiago_engine_nodes.v0.1.json"
SYNTHETIC_NAME = re.compile(r"Cultural Node Sector|Sector\s+\d+|Generated POI|Placeholder|Santiago Node \d+", re.I)


def main() -> int:
    # Also keep Gate 1B.1 proposed check if present
    issues: list[str] = []

    if not ENGINE.exists():
        print("SYNTHETIC_PATTERN_VALIDATOR=FAIL missing engine nodes")
        return 1

    data = json.loads(ENGINE.read_text(encoding="utf-8"))
    nodes = data.get("nodes") or []
    coords = []
    for n in nodes:
        name = f"{n.get('canonicalName') or ''} {n.get('displayName') or ''}"
        if SYNTHETIC_NAME.search(name):
            issues.append(f"{n.get('stgoId')}: synthetic name {name!r}")
        poi = n.get("poiCoordinate")
        if not poi or poi.get("lat") is None:
            continue
        lat, lng = float(poi["lat"]), float(poi["lng"])
        coords.append((round(lat, 5), round(lng, 5), n.get("stgoId")))
        if not n.get("providerId"):
            issues.append(f"{n.get('stgoId')}: coordinate without providerId (fallback smell)")
        # arithmetic sequence smell: coords that look like origin + i*delta
        # (checked globally below)

    counter = Counter((c[0], c[1]) for c in coords)
    for pair, count in counter.items():
        if count >= 3:
            ids = [c[2] for c in coords if (c[0], c[1]) == pair]
            issues.append(f"repeated identical coordinate {pair} on {ids}")

    coarse = Counter((round(c[0], 2), round(c[1], 2)) for c in coords)
    # Centro launch curation legitimately packs many distinct pins into one ~0.01° cell.
    # Flag only when exact 5-decimal repeats cluster, or extreme packing (≥15) without curation diversity.
    for cell, count in coarse.items():
        if count < 12:
            continue
        in_cell = [c for c in coords if (round(c[0], 2), round(c[1], 2)) == cell]
        fine = Counter((c[0], c[1]) for c in in_cell)
        if any(v >= 3 for v in fine.values()):
            dup_ids = [
                c[2]
                for pair, v in fine.items()
                if v >= 3
                for c in in_cell
                if (c[0], c[1]) == pair
            ]
            issues.append(f"repeated identical coordinate in coarse cell {cell}: {dup_ids[:6]}")
        elif count >= 15:
            issues.append(f"coarse-grid clustering suggestive of synthetic packing: {[cell]}")

    # Detect arithmetic progression in lat or lng across ordered STGO ids
    ordered = sorted(
        [(n["stgoId"], n["poiCoordinate"]) for n in nodes if n.get("poiCoordinate")],
        key=lambda x: x[0],
    )
    if len(ordered) >= 8:
        lats = [o[1]["lat"] for o in ordered]
        lngs = [o[1]["lng"] for o in ordered]
        dlat = [round(lats[i + 1] - lats[i], 6) for i in range(len(lats) - 1)]
        dlng = [round(lngs[i + 1] - lngs[i], 6) for i in range(len(lngs) - 1)]
        if len(set(dlat)) == 1 and dlat[0] != 0:
            issues.append(f"arithmetic lat progression delta={dlat[0]}")
        if len(set(dlng)) == 1 and dlng[0] != 0:
            issues.append(f"arithmetic lng progression delta={dlng[0]}")

    # Gate 1B.1 proposed file still checked if present
    proposed = ROOT / "src/data/santiago/santiago_physical_nodes.proposed.v0.1.json"
    if proposed.exists():
        pdata = json.loads(proposed.read_text(encoding="utf-8"))
        for n in pdata.get("nodes") or []:
            if n.get("lat") is not None and not n.get("providerId"):
                issues.append(f"1B.1 {n.get('id')}: coordinate without providerId")

    if issues:
        print("SYNTHETIC_PATTERN_VALIDATOR=FAIL")
        for i in issues:
            print(" -", i)
        return 1

    print("SYNTHETIC_PATTERN_VALIDATOR=PASS")
    print("coordinate_nodes", len(coords))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
