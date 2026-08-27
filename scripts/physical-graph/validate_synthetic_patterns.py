#!/usr/bin/env python3
"""Detect synthetic / fake coordinate patterns in proposed physical nodes."""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROPOSED = ROOT / "src/data/santiago/santiago_physical_nodes.proposed.v0.1.json"


def main() -> int:
    if not PROPOSED.exists():
        print("SYNTHETIC_PATTERN_VALIDATOR=FAIL missing proposed dataset")
        return 1

    data = json.loads(PROPOSED.read_text(encoding="utf-8"))
    nodes = data.get("nodes") or []
    issues: list[str] = []

    coords = []
    for n in nodes:
        lat, lng = n.get("lat"), n.get("lng")
        if lat is None or lng is None:
            continue
        coords.append((round(float(lat), 5), round(float(lng), 5), n.get("id")))
        # Fake metro / island language in selected place names while claiming Santiago POI
        sel = n.get("selectedCandidate") or {}
        place = f"{sel.get('placeName') or ''} {sel.get('text') or ''}".lower()
        if "isla de pascua" in place or "easter island" in place:
            issues.append(f"{n.get('id')}: island coordinate attached")
        # Exact duplication of product runtime constants would be suspicious only if
        # providerId missing — arithmetic fallback smell
        if not n.get("providerId") and lat is not None:
            issues.append(f"{n.get('id')}: coordinate without providerId (fallback smell)")

    # Identical coordinates across different nodes (copy-paste synthetic)
    counter = Counter((c[0], c[1]) for c in coords)
    for pair, count in counter.items():
        if count >= 3:
            ids = [c[2] for c in coords if (c[0], c[1]) == pair]
            issues.append(f"repeated identical coordinate {pair} on {ids}")

    # Grid / stepped synthetic pattern: many coords sharing exactly 2 decimals only
    coarse = Counter((round(c[0], 2), round(c[1], 2)) for c in coords)
    hot = [k for k, v in coarse.items() if v >= 6]
    if hot:
        issues.append(f"coarse-grid clustering suggestive of synthetic packing: {hot}")

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
