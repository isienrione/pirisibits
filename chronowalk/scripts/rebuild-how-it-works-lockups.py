#!/usr/bin/env python3
"""Rebuild how-it-works phone lockups from Safari screenshots.

Sources (checkout from origin/figma into public/landing/):
  English_mock1.jpg → begin-tour-v7.jpeg (+ mirrors)
  English_mock4.jpg → walk-v7.jpeg
  Spanish_mock1.jpg → es/begin-tour-v7.jpeg
  Spanish_mock2.jpg → es/arrive-v7.jpeg
  Spanish_mock4.jpg → es/walk-v7.jpeg

Pipeline (no anisotropic warp):
  1. Strip Safari chrome / black letterbox / top hairlines
  2. Split body vs cream tab bar
  3. Uniform width-scale to 1170px
  4. Paste body below a matching-color Dynamic Island inset
  5. Pin tabs to the BOTTOM edge
  6. Fill the mid gap (between body and tabs) with cream or dark

The island inset uses the same cream/dark as the screen — never a fake
black status bar on cream UI.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LANDING = ROOT / "public" / "landing"
SCREENS = LANDING / "phone-screens"

TARGET_W, TARGET_H = 1170, 2532
# ~56px on the 390×844 artboard (168px at 3×). Clears the CSS Dynamic Island
# (~island bottom ≈ 44px artboard) with a small breathing gap — matching fill,
# not a black strip.
SAFE_TOP = 168
CREAM = (248, 245, 238)
DARK = (12, 12, 12)
OUT_TAG = "v7"


def strip(im: Image.Image, force_top: int = 0) -> Image.Image:
    w, h = im.size
    if force_top:
        im = im.crop((0, force_top, w, h))
    a = np.asarray(im)
    row_mean = a.mean(axis=(1, 2))
    top = 0
    while top < len(row_mean) * 0.25 and row_mean[top] < 28:
        top += 1
    while top < len(row_mean) * 0.1:
        row = a[top]
        mean = float(row.mean())
        std = float(row.std())
        if std < 12 and mean > 190:
            top += 1
            continue
        break
    bottom = len(row_mean)
    while bottom > len(row_mean) * 0.8 and row_mean[bottom - 1] < 28:
        bottom -= 1
    if top > 0 or bottom < len(row_mean):
        im = Image.fromarray(a[top:bottom])
    return im


def find_tab_top(im: Image.Image) -> int:
    a = np.asarray(im)
    h, _, _ = a.shape
    cream = (
        (a[:, :, 0] > 205)
        & (a[:, :, 1] > 195)
        & (a[:, :, 2] > 180)
        & (np.abs(a[:, :, 0].astype(int) - a[:, :, 1].astype(int)) < 30)
    )
    frac = cream.mean(axis=1)
    y = h - 2
    while y > int(h * 0.55):
        if frac[y] > 0.62:
            y0 = y
            while y0 > int(h * 0.5) and frac[y0] > 0.52:
                y0 -= 1
            y0 += 1
            if 40 <= (y - y0 + 1) <= 260:
                return y0
            y = y0 - 1
            continue
        y -= 1
    return int(h * 0.905)


def trim_body_hairline(body_r: Image.Image, gap_bg: tuple[int, int, int], max_trim: int = 14):
    a = np.asarray(body_r)
    h = a.shape[0]
    trim = 0
    gb = np.array(gap_bg, dtype=float)
    for i in range(max_trim):
        y = h - 1 - i
        row = a[y].astype(float)
        diff = np.abs(row.mean(axis=0) - gb).sum()
        std = row.std()
        if diff > 80 or (std < 8 and diff > 35):
            trim = i + 1
            continue
        break
    if trim:
        body_r = body_r.crop((0, 0, body_r.size[0], body_r.size[1] - trim))
    return body_r


def build(src: Path, dst: Path, *, force_top: int, gap_bg: tuple[int, int, int], safe_top: int = SAFE_TOP) -> None:
    raw = Image.open(src).convert("RGB")
    im = strip(raw, force_top=force_top)
    w, _h = im.size
    tab_top = find_tab_top(im)
    body = im.crop((0, 0, w, tab_top))
    tabs = im.crop((0, tab_top, w, im.size[1]))
    scale = TARGET_W / float(w)
    body_r = body.resize((TARGET_W, max(1, int(round(body.height * scale)))), Image.Resampling.LANCZOS)
    tabs_r = tabs.resize((TARGET_W, max(1, int(round(tabs.height * scale)))), Image.Resampling.LANCZOS)
    body_r = trim_body_hairline(body_r, gap_bg)

    # Matching-color canvas (cream or dark) — island zone + mid gap share this fill.
    canvas = Image.new("RGB", (TARGET_W, TARGET_H), gap_bg)
    ty = TARGET_H - tabs_r.height
    canvas.paste(tabs_r, (0, ty))

    body_top = safe_top
    avail = ty - body_top
    if body_r.height <= avail:
        canvas.paste(body_r, (0, body_top))
    else:
        # Prefer keeping the header under the island; crop overflow from the bottom of the body.
        overflow = body_r.height - avail
        canvas.paste(body_r.crop((0, 0, TARGET_W, body_r.height - overflow)), (0, body_top))
    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dst, "JPEG", quality=92, optimize=True)
    print(f"wrote {dst.relative_to(ROOT)} safe_top={safe_top} gap={gap_bg}")


def mirror(src: Path, names: list[str]) -> None:
    data = src.read_bytes()
    for name in names:
        (src.parent / name).write_bytes(data)


def main() -> None:
    jobs = [
        (LANDING / "English_mock1.jpg", SCREENS / f"begin-tour-{OUT_TAG}.jpeg", 128, CREAM,
         ["begin-tour-lockup.jpeg", "begin-tour-v2.jpeg", "begin-tour-v3.jpeg",
          "begin-tour-v4.jpeg", "begin-tour-v5.jpeg", "begin-tour-v6.jpeg"]),
        (LANDING / "English_mock4.jpg", SCREENS / f"walk-{OUT_TAG}.jpeg", 178, DARK,
         ["walk-lockup.jpeg", "walk-v2.jpeg", "walk-v3.jpeg",
          "walk-v4.jpeg", "walk-v5.jpeg", "walk-v6.jpeg"]),
        (LANDING / "Spanish_mock1.jpg", SCREENS / "es" / f"begin-tour-{OUT_TAG}.jpeg", 128, CREAM,
         ["begin-tour-lockup.jpeg", "begin-tour-v2.jpeg", "begin-tour-v3.jpeg",
          "begin-tour-v4.jpeg", "begin-tour-v5.jpeg", "begin-tour-v6.jpeg"]),
        (LANDING / "Spanish_mock2.jpg", SCREENS / "es" / f"arrive-{OUT_TAG}.jpeg", 145, CREAM,
         ["arrive-lockup.jpeg", "arrive-v2.jpeg", "arrive-v3.jpeg",
          "arrive-v4.jpeg", "arrive-v5.jpeg", "arrive-v6.jpeg"]),
        (LANDING / "Spanish_mock4.jpg", SCREENS / "es" / f"walk-{OUT_TAG}.jpeg", 0, DARK,
         ["walk-lockup.jpeg", "walk-v2.jpeg", "walk-v3.jpeg",
          "walk-v4.jpeg", "walk-v5.jpeg", "walk-v6.jpeg"]),
    ]
    for src, dst, force_top, gap_bg, mirrors in jobs:
        if not src.exists():
            raise SystemExit(f"missing source {src} (checkout from origin/figma)")
        build(src, dst, force_top=force_top, gap_bg=gap_bg)
        mirror(dst, mirrors)


if __name__ == "__main__":
    main()
