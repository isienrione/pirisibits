#!/usr/bin/env python3
"""
Gate 2A.1R-UI.1 — Deterministic score rationales for Launch 30.

Grounded ONLY in Gate 2A.1R calibration / source metadata.
Does not invent facts. Does not change scores.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LAUNCH = ROOT / "src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json"
OUT = ROOT / "src/data/santiago/curation/launch30_score_rationales.v0.1.json"
CHECKPOINT = "1b0ef938e681eedcd95d57f449a411e4b972d2b0"

THEME_LABELS = {
    "T1A": "Civic, Military & Traditional Heritage",
    "T1B": "Memory, Human Rights & Grassroots",
    "T2": "Culinary Explorer & Gastronomy",
    "T3": "Urban Shutterbug & Aesthetics",
    "T4": "Subculture, Street Art & Indie",
    "T5": "Mindful, Green & Quiet Living",
    "T6": "Dark Lore, Forensics & Macabre",
    "T7": "Budget Hacker & Street Life",
    "T8": "Urban Ecology & Conscious Living",
    "T9": "Luxury Heritage & High Craft",
}

METRIC_LABELS = {
    "anchor_density": "Anchor density (canonical importance)",
    "heritage_depth": "Heritage depth (storytelling material)",
    "micro_reveal": "Micro reveal (hidden discovery potential)",
    "polish": "Polish (finish / visitor readiness)",
}

MODE_LABELS = {
    "M1": "Express / Time-Boxed",
    "M2": "Accessibility / Step-Free",
    "M3": "Family & Kid Quest",
    "M4": "Night Owl / Nocturnal",
    "M5": "High Comfort / Low Friction",
}

BAND = [
    (0.05, "absent/near-absent"),
    (0.25, "weak/incidental"),
    (0.50, "meaningful but not defining"),
    (0.75, "strongly characteristic"),
    (1.01, "near-archetypal / defining"),
]


def band(v: float) -> str:
    for thr, name in BAND:
        if v < thr:
            return name
    return BAND[-1][1]


def ui(v: float | None) -> str:
    if v is None:
        return "UNKNOWN"
    return str(int(round(float(v) * 100)))


def low_confidence_text(field: str) -> dict:
    return {
        "whyThisScore": (
            f"Score for {field} is inherited from the founder-precalibrated Gate 2A.1R seed."
        ),
        "whyNotHigher": "Source record does not supply enough descriptive evidence to justify a higher reconstruction.",
        "whyNotLower": "Source record does not supply enough descriptive evidence to justify a lower reconstruction.",
        "confidence": "LOW",
        "evidenceLimitations": (
            "Rationale confidence: LOW — score inherited from founder seed; "
            "source record does not contain enough descriptive evidence to reconstruct the original reasoning."
        ),
    }


def founder_added_unknown_rationale(field: str, label: str) -> dict:
    return {
        "field": field,
        "label": label,
        "value": None,
        "provenance": "UNKNOWN",
        "rationaleClass": "NO_PRIOR_SOURCE_RATIONALE",
        "confidence": "HIGH",
        "whyThisScore": (
            "No prior calibrated score exists. This is a new founder-added launch node."
        ),
        "whyNotHigher": "No score has been set yet — UNKNOWN is not a numeric ceiling.",
        "whyNotLower": "UNKNOWN must not be coerced to zero or any incidental value.",
        "evidenceLimitations": (
            "STGO_104 was added after the frozen 103-node seed; founder calibration is required "
            "before any numeric rationale can exist."
        ),
        "proposalRationale": None,
    }


def is_unknown_number(v) -> bool:
    return v is None


def theme_rationale(code: str, value, vector: dict, rec: dict) -> dict:
    label = THEME_LABELS[code]
    if is_unknown_number(value) or any(is_unknown_number(vector.get(k)) for k in THEME_LABELS):
        if rec.get("stgoId") == "STGO_104" or rec.get("thematicVectorProvenance") == "UNKNOWN":
            return founder_added_unknown_rationale(code, label)
    value = float(value)
    others = sorted(
        ((k, float(vector[k])) for k in THEME_LABELS if k != code and not is_unknown_number(vector.get(k))),
        key=lambda x: x[1],
        reverse=True,
    )
    top_other = others[0] if others else ("?", 0.0)
    role = rec.get("editorialRole") or "unspecified role"
    tier = rec.get("tier") or "unspecified tier"
    name = rec.get("displayName") or rec["stgoId"]
    b = band(value)
    sens = (rec.get("sensitiveMemory") or {}).get("status")
    sens_val = (rec.get("sensitiveMemory") or {}).get("value")

    # Confidence: MEDIUM when value aligns with role/tier/related metrics; LOW if sparse contrast
    related_metric = float((rec.get("structuralMetrics") or {}).get("heritage_depth") or 0)
    conf = "MEDIUM"
    if value <= 0.05 and top_other[1] <= 0.05:
        conf = "LOW"
    elif value >= 0.85 and (code in {"T1A", "T1B", "T2", "T3"}):
        conf = "HIGH"
    elif value >= 0.7 and related_metric >= 0.6 and code in {"T1A", "T1B", "T9"}:
        conf = "HIGH"
    elif 0.05 < value < 0.85:
        # Mid-band values lack narrative essays; reconstruction is limited.
        conf = "LOW"
    elif value <= 0.05:
        conf = "MEDIUM"

    if value <= 0.05:
        why = (
            f"{name} carries a near-zero {code} ({label}) weight in the founder continuous vector, "
            f"so {label.lower()} is treated as irrelevant to this experience's scoring profile."
        )
        not_higher = (
            f"Raising {code} would invent thematic relevance not present in the founder vector "
            f"(current band: {b})."
        )
        not_lower = "Already at floor; cannot be materially lower within 0–1."
        if conf == "LOW":
            return {
                "field": code,
                "label": label,
                "value": value,
                "provenance": "FOUNDER_PRECALIBRATED",
                "rationaleClass": "SOURCE_RATIONALE",
                **low_confidence_text(code),
            }
        return {
            "field": code,
            "label": label,
            "value": value,
            "provenance": "FOUNDER_PRECALIBRATED",
            "rationaleClass": "SOURCE_RATIONALE",
            "confidence": conf,
            "whyThisScore": why,
            "whyNotHigher": not_higher,
            "whyNotLower": not_lower,
            "evidenceLimitations": "Explanation uses only the founder thematicVector magnitude and comparative ranking.",
        }

    why = (
        f"{name} has founder {code}={ui(value)} ({b}) for {label}. "
        f"Within this POI's vector, the leading companion theme is {top_other[0]}={ui(top_other[1])}. "
        f"Editorial role/tier context in the calibration record: {role} / {tier}."
    )
    if code == "T1B" and sens == "PRESENT" and sens_val is True:
        why += " Explicit sensitive-memory flag is PRESENT=true (separate from theme strength)."
    elif code == "T1B":
        why += " Theme strength is not used as a substitute for explicit sensitive-memory metadata."

    not_higher = (
        f"Not at 100 because the founder vector places {code} in the '{b}' band rather than as a sole archetypal maximum; "
        f"other themes (e.g. {top_other[0]}) also compete for experiential emphasis."
        if value < 0.97
        else f"{code} is already near ceiling in the founder seed."
    )
    not_lower = (
        f"Not incidental because founder calibration assigns a non-trivial {code} weight ({ui(value)}), "
        f"indicating the theme is intrinsic rather than background noise."
        if value >= 0.25
        else f"Score is already weak/incidental ({ui(value)})."
    )

    return {
        "field": code,
        "label": label,
        "value": value,
        "provenance": "FOUNDER_PRECALIBRATED",
        "rationaleClass": "SOURCE_RATIONALE",
        "confidence": conf,
        "whyThisScore": why,
        "whyNotHigher": not_higher,
        "whyNotLower": not_lower,
        "evidenceLimitations": (
            "Rationale confidence: LOW — score inherited from founder seed; "
            "source record does not contain enough descriptive evidence to reconstruct the original reasoning."
            if conf == "LOW"
            else "No free-text founder essay exists in-repo; rationale reconstructs from vector + role/tier/flags only."
        ),
    }


def metric_rationale(key: str, value, metrics: dict, rec: dict) -> dict:
    label = METRIC_LABELS[key]
    if is_unknown_number(value) or rec.get("stgoId") == "STGO_104":
        return founder_added_unknown_rationale(key, label)
    value = float(value)
    b = band(value)
    name = rec.get("displayName") or rec["stgoId"]
    tier = rec.get("tier")
    others = {k: float(metrics[k]) for k in METRIC_LABELS if k != key and not is_unknown_number(metrics.get(k))}
    lead = max(others.items(), key=lambda x: x[1]) if others else (key, value)
    conf = "HIGH" if value >= 0.8 or value <= 0.15 else "LOW"
    if tier == "canonical_anchor" and key == "anchor_density" and value >= 0.7:
        conf = "HIGH"
    if tier == "micro_reveal" and key == "micro_reveal" and value >= 0.6:
        conf = "HIGH"
    if conf == "LOW":
        # still provide reconstruction, but mark limited evidence
        pass

    why = (
        f"{name} has founder {key}={ui(value)} ({b}). "
        f"Tier={tier}. Among structural metrics, strongest companion is {lead[0]}={ui(lead[1])}."
    )
    not_higher = (
        f"Not higher because founder seed keeps {key} below ceiling (band: {b}), "
        f"so the experience is strong but not treated as the absolute Santiago maximum on this axis."
        if value < 0.97
        else f"{key} is already near ceiling."
    )
    not_lower = (
        f"Not lower because a {ui(value)} reading is material in the founder structural seed "
        f"and would understate the recorded {label.lower()} if collapsed toward incidental."
        if value >= 0.25
        else f"Already weak ({ui(value)})."
    )
    return {
        "field": key,
        "label": label,
        "value": value,
        "provenance": "FOUNDER_PRECALIBRATED",
        "rationaleClass": "SOURCE_RATIONALE",
        "confidence": conf,
        "whyThisScore": why,
        "whyNotHigher": not_higher,
        "whyNotLower": not_lower,
        "evidenceLimitations": "Structural metrics are numeric founder seed values without narrative essays.",
    }


def tier_rationale(rec: dict) -> dict:
    tier = rec.get("tier")
    name = rec.get("displayName") or rec["stgoId"]
    if tier is None or rec.get("tierProvenance") == "UNKNOWN" or rec.get("stgoId") == "STGO_104":
        return founder_added_unknown_rationale("tier", "Editorial tier")
    ad = float(rec["structuralMetrics"]["anchor_density"])
    mr = float(rec["structuralMetrics"]["micro_reveal"])
    why = f"{name} is classified as `{tier}` in the founder seed."
    if tier == "canonical_anchor":
        why += f" Consistent with elevated anchor_density={ui(ad)}."
        not_higher = "Tier is categorical; no higher tier exists."
        not_lower = "Downgrading would contradict founder tier + high anchor density pairing."
    elif tier == "thematic_pocket":
        why += " Indicates a thematically coherent stop that is not necessarily a citywide must-see anchor."
        not_higher = "Not labeled canonical_anchor in founder seed."
        not_lower = "Not labeled micro_reveal; pocket status implies more than a single micro beat."
    else:
        why += f" Aligns with discovery-oriented micro_reveal={ui(mr)} emphasis."
        not_higher = "Founder seed did not place this in thematic_pocket/canonical_anchor."
        not_lower = "Already the most granular tier class."
    return {
        "field": "tier",
        "label": "Editorial tier",
        "value": tier,
        "provenance": "FOUNDER_PRECALIBRATED",
        "rationaleClass": "SOURCE_RATIONALE",
        "confidence": "HIGH",
        "whyThisScore": why,
        "whyNotHigher": not_higher,
        "whyNotLower": not_lower,
        "evidenceLimitations": None,
    }


def visit_rationale(rec: dict) -> dict:
    vt = rec["visitTime"]
    if vt.get("min") is None or rec.get("stgoId") == "STGO_104":
        out = founder_added_unknown_rationale("visitTimeMin", "Visit time (min / typical / max)")
        out["value"] = {"min": None, "typical": None, "max": None}
        return out
    return {
        "field": "visitTimeMin",
        "label": "Visit time (min / typical / max)",
        "value": {"min": vt["min"], "typical": vt["typical"], "max": vt["max"]},
        "provenance": vt.get("provenance") or "AI_PROPOSED_UNVERIFIED",
        "rationaleClass": "AI_PROPOSAL_RATIONALE",
        "confidence": "LOW",
        "whyThisScore": (
            f"AI proposal sets min={vt['min']}, typical={vt['typical']}, max={vt['max']} minutes "
            f"(excludes travel). Heuristic inherits Gate 2A.1 proposal / tier-based dwell estimate."
        ),
        "whyNotHigher": "Longer authored dwell is not evidenced in the calibration record.",
        "whyNotLower": "A non-trivial on-site dwell is assumed for a launch experience stop.",
        "proposalRationale": (
            "Estimated from tier/experience depth heuristics and preserved Gate 2A.1 AI visit proposal metadata."
        ),
        "evidenceLimitations": (
            "No field-observed dwell-time evidence exists in the canonical semantic record. "
            "AI_PROPOSED_UNVERIFIED — not factual observed behavior."
        ),
    }


def mode_rationale(code: str, entry: dict, rec: dict) -> dict:
    label = MODE_LABELS[code]
    val = entry.get("value")
    status = entry.get("status")
    prov = entry.get("provenance") or "AI_PROPOSED_UNVERIFIED"
    if rec.get("stgoId") == "STGO_104" or (val is None and status == "UNKNOWN" and rec.get("thematicVectorProvenance") == "UNKNOWN"):
        return founder_added_unknown_rationale(code, label)
    is_ai = "AI_PROPOSED" in str(prov) or code in {"M1", "M3", "M4", "M5"} and "FOUNDER" not in str(prov)
    flags = rec.get("flags") or {}
    polish = float(rec["structuralMetrics"]["polish"])
    visit = rec["visitTime"]["typical"]

    if code == "M2":
        step = flags.get("step_free") or {}
        if step.get("status") == "PRESENT":
            why = (
                f"M2 uses FOUNDER_PRECALIBRATED step_free={step.get('value')} "
                f"(mapped suitability={ui(val)}, status={status})."
            )
            return {
                "field": code,
                "label": label,
                "value": val,
                "status": status,
                "provenance": prov,
                "rationaleClass": "SOURCE_RATIONALE",
                "confidence": "HIGH",
                "whyThisScore": why,
                "whyNotHigher": "Cannot exceed evidence; suitability is bounded by explicit step_free flag mapping.",
                "whyNotLower": "Explicit founder flag provides positive/negative evidence rather than UNKNOWN.",
                "evidenceLimitations": "step_free is not the same as full accessibility audit / certification breadth.",
            }
        return {
            "field": code,
            "label": label,
            "value": val,
            "status": status or "UNKNOWN",
            "provenance": prov,
            "rationaleClass": "AI_PROPOSAL_RATIONALE" if is_ai else "SOURCE_RATIONALE",
            "confidence": "HIGH",
            "whyThisScore": "M2 remains UNKNOWN because no PRESENT step_free evidence exists.",
            "whyNotHigher": "UNKNOWN must never become positive accessibility evidence.",
            "whyNotLower": "UNKNOWN must never become negative accessibility evidence either.",
            "proposalRationale": None,
            "evidenceLimitations": "No inferred stairs/hill claims allowed without source evidence.",
        }

    if code == "M1":
        why = f"AI proposal maps express suitability from proposed typical visit time ({visit} min)."
        lim = "Visit duration itself is AI_PROPOSED_UNVERIFIED; M1 inherits that uncertainty."
    elif code == "M3":
        why = (
            f"AI role/anchor heuristic sets M3={ui(val)}. "
            f"Sensitive-memory PRESENT+true depresses family suitability when applicable."
        )
        lim = "No observed family-visit fieldwork in the semantic record."
    elif code == "M4":
        day = flags.get("daylight_only") or {}
        if day.get("status") == "PRESENT" and day.get("value") is True:
            why = f"Daylight_only=true in founder flags → low nocturnal suitability ({ui(val)})."
            lim = "Opening-hour schedules remain largely UNKNOWN; daylight flag is the constraining evidence."
        else:
            why = f"AI proposal mid nocturnal suitability ({ui(val)}); hours not verified."
            lim = "HOURS_REQUIRED_UNKNOWN / unverified night access — not a measured nightlife audit."
    else:  # M5
        excl = flags.get("exclude_for_m5") or {}
        why = f"AI proposal from polish={ui(polish)} and exclude_for_m5 status={excl.get('status')}."
        lim = "Comfort friction fields beyond polish/exclude_for_m5 remain sparse."

    return {
        "field": code,
        "label": label,
        "value": val,
        "status": status,
        "provenance": prov,
        "rationaleClass": "AI_PROPOSAL_RATIONALE",
        "confidence": "MEDIUM" if code == "M4" and (flags.get("daylight_only") or {}).get("status") == "PRESENT" else "LOW",
        "whyThisScore": why,
        "whyNotHigher": "Heuristic ceiling reflects limited operational evidence in the calibration record.",
        "whyNotLower": "Proposal still assigns non-zero suitability where source does not forbid it.",
        "proposalRationale": why,
        "evidenceLimitations": lim + " AI_PROPOSED_UNVERIFIED.",
    }


def flag_rationales(rec: dict) -> list[dict]:
    out = []
    for key, entry in (rec.get("flags") or {}).items():
        status = entry.get("status")
        val = entry.get("value")
        if status == "PRESENT":
            why = f"Founder flag `{key}` is PRESENT with value={val}."
            conf = "HIGH"
            lim = None
            not_higher = "Boolean/flag field — no higher state beyond PRESENT evidence."
            not_lower = "PRESENT evidence should not be dropped without curator action."
        else:
            why = f"Flag `{key}` is absent from source_present_flag_keys → UNKNOWN (not coerced to false)."
            conf = "HIGH"
            lim = "Absence ≠ false."
            not_higher = "Cannot claim PRESENT without source_present_flag_keys membership."
            not_lower = "UNKNOWN is already the non-assertive state."
        out.append(
            {
                "field": f"flag:{key}",
                "label": key,
                "value": val,
                "status": status,
                "provenance": entry.get("provenance"),
                "rationaleClass": "SOURCE_RATIONALE",
                "confidence": conf,
                "whyThisScore": why,
                "whyNotHigher": not_higher,
                "whyNotLower": not_lower,
                "evidenceLimitations": lim,
            }
        )
    return out


def thematic_summary(vector: dict) -> dict:
    if any(is_unknown_number(vector.get(c)) for c in THEME_LABELS):
        return {
            "text": "No prior calibrated thematic profile exists. This is a new founder-added launch node.",
            "top3": [],
            "weakThemes": [],
            "contrast": "All T1A–T9 values are UNKNOWN until founder calibration.",
        }
    ranked = sorted(vector.items(), key=lambda x: float(x[1]), reverse=True)
    top3 = [{"code": c, "label": THEME_LABELS[c], "value": float(v)} for c, v in ranked[:3]]
    weak = [{"code": c, "label": THEME_LABELS[c], "value": float(v)} for c, v in ranked if float(v) <= 0.05][:3]
    if not weak:
        weak = [{"code": c, "label": THEME_LABELS[c], "value": float(v)} for c, v in ranked[-3:]]
    primary = ", ".join(f"{t['label']} ({ui(t['value'])})" for t in top3 if t["value"] > 0.05) or "no strong themes"
    weak_txt = ", ".join(f"{t['code']}={ui(t['value'])}" for t in weak)
    contrast = None
    if top3[0]["value"] >= 0.7 and any(float(v) <= 0.05 for _, v in ranked[5:]):
        contrast = f"Strong {top3[0]['code']} profile with near-absent mid/low themes ({weak_txt})."
    text = f"Primarily {primary}. Weakest/near-absent: {weak_txt}."
    return {"text": text, "top3": top3, "weakThemes": weak, "contrast": contrast}


def structural_summary(metrics: dict) -> str:
    if any(is_unknown_number(metrics.get(k)) for k in METRIC_LABELS):
        return "No prior structural profile exists. This is a new founder-added launch node (all metrics UNKNOWN)."
    ad, hd, mr, po = (
        float(metrics["anchor_density"]),
        float(metrics["heritage_depth"]),
        float(metrics["micro_reveal"]),
        float(metrics["polish"]),
    )
    parts = []
    parts.append("high-anchor" if ad >= 0.7 else "moderate-anchor" if ad >= 0.4 else "low-anchor")
    parts.append("high-heritage" if hd >= 0.7 else "moderate-heritage" if hd >= 0.4 else "low-heritage")
    parts.append("high micro-reveal" if mr >= 0.7 else "moderate micro-reveal" if mr >= 0.4 else "limited hidden-discovery")
    parts.append("high polish" if po >= 0.7 else "moderate finish" if po >= 0.4 else "raw/unfinished feel")
    return (
        f"{parts[0].capitalize()}, {parts[1]} experience with {parts[3]} and {parts[2]} value."
    )


def round1(x: float) -> float:
    # Match JS Math.round(n*10)/10 half-up for positive ChronoWorth contribs.
    return float(int(x * 10 + 0.5)) / 10.0


def chrono_breakdown(metrics: dict) -> dict:
    if any(is_unknown_number(metrics.get(k)) for k in METRIC_LABELS):
        return {
            "contributions": {
                "heritage_depth": None,
                "anchor_density": None,
                "micro_reveal": None,
                "polish": None,
            },
            "raw": None,
            "status": "UNAVAILABLE",
            "plainLanguage": (
                "ChronoWorth is UNAVAILABLE until the founder supplies all four structural metrics. "
                "UNKNOWN must not be treated as zero."
            ),
        }
    hd = float(metrics["heritage_depth"])
    ad = float(metrics["anchor_density"])
    mr = float(metrics["micro_reveal"])
    po = float(metrics["polish"])
    contrib = {
        "heritage_depth": round1(hd * 35),
        "anchor_density": round1(ad * 30),
        "micro_reveal": round1(mr * 20),
        "polish": round1(po * 15),
    }
    raw = round1(sum(contrib.values()))
    lead = max(contrib.items(), key=lambda x: x[1])
    soft = min(contrib.items(), key=lambda x: x[1])
    plain = (
        f"Most of this POI's global ChronoWorth comes from {lead[0].replace('_',' ')} "
        f"({contrib[lead[0]]}), while {soft[0].replace('_',' ')} contributes less ({contrib[soft[0]]})."
    )
    return {"contributions": contrib, "raw": raw, "status": "AVAILABLE", "plainLanguage": plain}


def main() -> int:
    cal = json.loads(LAUNCH.read_text(encoding="utf-8"))
    assert len(cal["records"]) == 30
    records = []
    conf_hist = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for rec in sorted(cal["records"], key=lambda r: r["stgoId"]):
        fields = []
        for code, val in rec["thematicVector"].items():
            r = theme_rationale(code, val, rec["thematicVector"], rec)
            fields.append(r)
            conf_hist[r["confidence"]] += 1
        for key, val in rec["structuralMetrics"].items():
            r = metric_rationale(key, val, rec["structuralMetrics"], rec)
            fields.append(r)
            conf_hist[r["confidence"]] += 1
        tr = tier_rationale(rec)
        fields.append(tr)
        conf_hist[tr["confidence"]] += 1
        vr = visit_rationale(rec)
        fields.append(vr)
        conf_hist[vr["confidence"]] += 1
        for code, entry in rec["structuralSuitability"].items():
            r = mode_rationale(code, entry, rec)
            fields.append(r)
            conf_hist[r["confidence"]] += 1
        for fr in flag_rationales(rec):
            fields.append(fr)
            conf_hist[fr["confidence"]] += 1

        records.append(
            {
                "stgoId": rec["stgoId"],
                "displayName": rec["displayName"],
                "fields": fields,
                "thematicSummary": thematic_summary(rec["thematicVector"]),
                "structuralSummary": structural_summary(rec["structuralMetrics"]),
                "chronoWorthBreakdown": chrono_breakdown(rec["structuralMetrics"]),
            }
        )

    payload = {
        "schemaVersion": "santiago-launch30-score-rationales.v0.1",
        "gate": "2A.1R-ADD-01R",
        "sourceCheckpointSha": CHECKPOINT,
        "sourceCalibration": str(LAUNCH.relative_to(ROOT)),
        "recordCount": 30,
        "confidenceHistogram": conf_hist,
        "notes": [
            "Rationales are deterministic reconstructions from Gate 2A.1R / ADD-01R calibration metadata.",
            "They do not change scores.",
            "SOURCE_RATIONALE vs AI_PROPOSAL_RATIONALE are distinct.",
            "STGO_104 has no prior source rationale — founder-added UNKNOWN node.",
            "STGO_33 rationales use corrected identity (no Funicular naming).",
            "LOW confidence means insufficient descriptive evidence — not a score defect.",
        ],
        "records": records,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Wrote", OUT.relative_to(ROOT))
    print("confidence", conf_hist)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
