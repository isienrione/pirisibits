#!/usr/bin/env python3
"""
Gate 2A.1R-UI.2 — Deterministic score rationales for full Santiago inventory (105).

Reuses Launch30 rationale rules. For founder-added UNKNOWN nodes, emits the
no-prior-calibration rationale. Never invents facts.
"""

from __future__ import annotations

import json
from pathlib import Path

# Reuse Launch30 rationale helpers
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts/engine"))

from build_launch30_score_rationales_v0_1 import (  # noqa: E402
    THEME_LABELS,
    METRIC_LABELS,
    MODE_LABELS,
    theme_rationale,
    metric_rationale,
    tier_rationale,
    visit_rationale,
    mode_rationale,
    flag_rationales,
    thematic_summary,
    structural_summary,
    chrono_breakdown,
    is_unknown_number,
    founder_added_unknown_rationale,
)

SEMANTIC = ROOT / "src/data/santiago/santiago_semantic_calibration.v0.1.json"
LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
CORPUS = ROOT / "src/data/santiago/santiago_launch_corpus.v0.1.json"
OUT = ROOT / "src/data/santiago/curation/santiago_score_rationales.v0.1.json"
OUT_LAUNCH30 = ROOT / "src/data/santiago/curation/launch30_score_rationales.v0.1.json"
CHECKPOINT = "0e5903e46598365fcee3142c2f374a45e49ece77"


def build_record(rec: dict) -> dict:
    fields = []
    conf_hist_local = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}

    def add(r: dict) -> None:
        fields.append(r)
        conf_hist_local[r["confidence"]] = conf_hist_local.get(r["confidence"], 0) + 1

    for code, val in (rec.get("thematicVector") or {}).items():
        if code not in THEME_LABELS:
            continue
        add(theme_rationale(code, val, rec["thematicVector"], rec))
    for key, val in (rec.get("structuralMetrics") or {}).items():
        if key not in METRIC_LABELS:
            continue
        add(metric_rationale(key, val, rec["structuralMetrics"], rec))
    add(tier_rationale(rec))
    add(visit_rationale(rec))
    for code, entry in (rec.get("structuralSuitability") or {}).items():
        if code not in MODE_LABELS:
            continue
        add(mode_rationale(code, entry, rec))
    for fr in flag_rationales(rec):
        add(fr)

    return {
        "stgoId": rec["stgoId"],
        "displayName": rec["displayName"],
        "fields": fields,
        "thematicSummary": thematic_summary(rec.get("thematicVector") or {}),
        "structuralSummary": structural_summary(rec.get("structuralMetrics") or {}),
        "chronoWorthBreakdown": chrono_breakdown(rec.get("structuralMetrics") or {}),
        "_conf": conf_hist_local,
    }


def main() -> int:
    sem = json.loads(SEMANTIC.read_text(encoding="utf-8"))
    assert sem.get("recordCount") == 105 and len(sem["records"]) == 105
    launch_ids = set(json.loads(CORPUS.read_text(encoding="utf-8")).get("ids") or [])
    if not launch_ids:
        launch_ids = {r["stgoId"] for r in json.loads(LAUNCH.read_text(encoding="utf-8"))["records"]}

    records = []
    conf_hist = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for rec in sorted(sem["records"], key=lambda r: int(r["stgoId"].split("_")[1])):
        built = build_record(rec)
        for k, v in built.pop("_conf").items():
            conf_hist[k] = conf_hist.get(k, 0) + v
        built["launchCorpus"] = rec["stgoId"] in launch_ids
        records.append(built)

    payload = {
        "schemaVersion": "santiago-score-rationales.v0.1",
        "gate": "2A.1R-UI.2",
        "sourceCheckpointSha": CHECKPOINT,
        "sourceCalibration": str(SEMANTIC.relative_to(ROOT)),
        "recordCount": 105,
        "launchCorpusCount": 30,
        "confidenceHistogram": conf_hist,
        "notes": [
            "Rationales are deterministic reconstructions from Gate 2A.1R / ADD-01R / 2E.4 semantic metadata.",
            "They do not change scores.",
            "STGO_104 has no prior source rationale — founder-added UNKNOWN node.",
            "STGO_105 has no prior source rationale — founder-added IDENTITY_RESOLVED_PHYSICAL_PENDING node (Gate 2E.4).",
            "Coverage includes full canonical inventory (105).",
        ],
        "records": records,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Keep Launch30 slice artifact in sync for older validators/tests.
    launch_records = [r for r in records if r["stgoId"] in launch_ids]
    launch_conf = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for r in launch_records:
        for f in r["fields"]:
            launch_conf[f["confidence"]] = launch_conf.get(f["confidence"], 0) + 1
    launch_payload = {
        "schemaVersion": "santiago-launch30-score-rationales.v0.1",
        "gate": "2A.1R-UI.2",
        "sourceCheckpointSha": CHECKPOINT,
        "sourceCalibration": str(LAUNCH.relative_to(ROOT)),
        "recordCount": 30,
        "confidenceHistogram": launch_conf,
        "notes": payload["notes"] + ["Launch30 slice of full Santiago rationales."],
        "records": launch_records,
    }
    OUT_LAUNCH30.write_text(json.dumps(launch_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("Wrote", OUT.relative_to(ROOT), "records", len(records))
    print("Wrote", OUT_LAUNCH30.relative_to(ROOT), "records", len(launch_records))
    print("confidence", conf_hist)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
