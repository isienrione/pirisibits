#!/usr/bin/env python3
"""Gate 2E.1M — validate scoring & composition V0.2 design contract (docs only)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
errors: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def main() -> int:
    contract = ROOT / "docs/engine/ENGINE_SCORING_AND_COMPOSITION_V0_2.md"
    index = ROOT / "docs/engine/README.md"
    adr = ROOT / "docs/engine/decisions/ADR-001-separate-static-traveler-and-marginal-route-value.md"

    if not contract.exists():
        fail("ENGINE_SCORING_AND_COMPOSITION_V0_2.md missing")
    else:
        text = contract.read_text()
        for needle in (
            "NOT YET IMPLEMENTED",
            "MarginalRouteValue",
            "TravelerMatch",
            "IntrinsicWorthRaw",
            "INITIAL V0.2 HYPOTHESIS",
            "PROVISIONAL V0.1 VALUE — NOT FROZEN FOR V0.2",
        ):
            if needle not in text:
                fail(f"contract missing: {needle}")

    if not index.exists():
        fail("docs/engine/README.md missing")
    elif "ENGINE_SCORING_AND_COMPOSITION_V0_2.md" not in index.read_text():
        fail("docs index missing V0.2 contract link")

    if not adr.exists():
        fail("ADR-001 missing")
    elif "NOT YET IMPLEMENTED" not in adr.read_text():
        fail("ADR-001 must state NOT YET IMPLEMENTED")

    flags = (ROOT / "src/lib/city-graph/flags.ts").read_text()
    if "PHYSICAL_ROUTE_GENERATION_ENABLED = false" not in flags:
        fail("PHYSICAL_ROUTE_GENERATION_ENABLED must remain false")

    for forbidden in (
        "src/engine/scoring/scoring-config.v0.2.ts",
        "src/engine/routes/lane-config.v0.2.ts",
    ):
        if (ROOT / forbidden).exists():
            fail(f"runtime V0.2 config created unexpectedly: {forbidden}")

    if errors:
        print("GATE_2E1M_SCORING_CONTRACT_VALIDATOR=FAIL")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("GATE_2E1M_SCORING_CONTRACT_VALIDATOR=PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
