#!/usr/bin/env python3
"""Physical-data validator — Gate 1B.2 engine nodes (+ 1B.1 proposed regression)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    # Primary: Gate 1B.2 engine integrity
    r = subprocess.run([sys.executable, str(ROOT / "scripts/physical-graph/validate_gate_1b2.py")])
    if r.returncode != 0:
        return r.returncode

    # Regression: Gate 1B.1 proposed launch file still must not auto-approve
    proposed = ROOT / "src/data/santiago/santiago_physical_nodes.proposed.v0.1.json"
    if proposed.exists():
        import json

        data = json.loads(proposed.read_text(encoding="utf-8"))
        if data.get("physicalRouteGenerationEnabled") is not False:
            print("PHYSICAL_DATA_VALIDATOR=FAIL 1B.1 route flag")
            return 1
        if data.get("autoCuratorApproveFromMapbox") is not False:
            print("PHYSICAL_DATA_VALIDATOR=FAIL 1B.1 auto-approve flag")
            return 1
        for n in data.get("nodes") or []:
            if n.get("selectionStatus") == "CURATOR_APPROVED" or n.get("physicalState") == "CURATOR_APPROVED":
                print("PHYSICAL_DATA_VALIDATOR=FAIL 1B.1 auto curator approve", n.get("id"))
                return 1
            blob = json.dumps(n)
            if "pk.ey" in blob:
                print("PHYSICAL_DATA_VALIDATOR=FAIL token in 1B.1 proposed")
                return 1
        print("PHYSICAL_DATA_VALIDATOR_1B1_REGRESSION=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
