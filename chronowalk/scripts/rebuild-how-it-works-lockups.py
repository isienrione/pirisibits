#!/usr/bin/env python3
"""Rebuild how-it-works phone lockups from Safari screenshots.

Sources (on figma branch or local):
  public/landing/English_mock1.jpg → phone-screens/begin-tour-lockup.jpeg
  public/landing/English_mock4.jpg → phone-screens/walk-lockup.jpeg
  public/landing/Spanish_mock1.jpg → phone-screens/es/begin-tour-lockup.jpeg
  public/landing/Spanish_mock2.jpg → phone-screens/es/arrive-lockup.jpeg
  public/landing/Spanish_mock4.jpg → phone-screens/es/walk-lockup.jpeg

Pipeline (matches phone 390×844 / 1170×2532 artboard):
  1. Strip Safari chrome / black letterbox
  2. Mild left-biased side crop (≤10%) so width-fit leaves ~11% top pad max
  3. Width-scale only (no vertical stretch)
  4. Pin tab bar to bottom; pad remaining height above with matching bg
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LANDING = ROOT / "public" / "landing"
SCREENS = LANDING / "phone-screens"

TARGET_W, TARGET_H = 1170, 2532
MAX_PAD_FRAC = 0.11


def strip(im: Image.Image, force_top: int = 0) -> Image.Image:
    w, h = im.size
    if force_top:
        im = im.crop((0, force_top, w, h))
    a = np.asarray(im)
    row_mean = a.mean(axis=(1, 2))
    top = 0
    while top < len(row_mean) * 0.2 and row_mean[top] < 22:
        top += 1
    bottom = len(row_mean)
    while bottom > len(row_mean) * 0.85 and row_mean[bottom - 1] < 22:
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
            height = y - y0 + 1
            if 40 <= height <= 260:
                return y0
            y = y0 - 1
            continue
        y -= 1
    return int(h * 0.905)


def mild_side_crop(im: Image.Image, left_bias: float = 0.5):
    w, h = im.size
    max_w = TARGET_W * h / (TARGET_H * (1 - MAX_PAD_FRAC))
    if w <= max_w + 1:
        return im
    min_w = int(round(w * 0.90))
    target_w = max(min_w, int(round(max_w)))
    crop = w - target_w
    if crop <= 0:
        return im
    left = int(round(crop * left_bias))
    left = max(0, min(left, crop))
    return im.crop((left, 0, left + target_w, h))


def build(src: Path, dst: Path, *, force_top: int, bg, left_bias: float) -> None:
    raw = Image.open(src).convert("RGB")
    im = strip(raw, force_top=force_top)
    im = mild_side_crop(im, left_bias=left_bias)
    w, h = im.size
    tab_top = find_tab_top(im)
    body = im.crop((0, 0, w, tab_top))
    tabs = im.crop((0, tab_top, w, h))
    scale = TARGET_W / float(w)
    body_r = body.resize((TARGET_W, max(1, int(round(body.height * scale)))), Image.Resampling.LANCZOS)
    tabs_r = tabs.resize((TARGET_W, max(1, int(round(tabs.height * scale)))), Image.Resampling.LANCZOS)
    fill = bg
    if fill is None:
        sample = np.asarray(body_r)[8:24, TARGET_W // 4 : 3 * TARGET_W // 4]
        fill = tuple(int(x) for x in sample.mean(axis=(0, 1)))
    canvas = Image.new("RGB", (TARGET_W, TARGET_H), fill)
    ty = TARGET_H - tabs_r.height
    canvas.paste(tabs_r, (0, ty))
    if body_r.height <= ty:
        canvas.paste(body_r, (0, ty - body_r.height))
    else:
        overflow = body_r.height - ty
        canvas.paste(body_r.crop((0, overflow, TARGET_W, body_r.height)), (0, 0))
    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dst, "JPEG", quality=92, optimize=True)
    print(f"wrote {dst.relative_to(ROOT)} ({canvas.size})")


def main() -> None:
    jobs = [
        (LANDING / "English_mock1.jpg", SCREENS / "begin-tour-lockup.jpeg", 128, (248, 245, 238), 0.72),
        (LANDING / "English_mock4.jpg", SCREENS / "walk-lockup.jpeg", 178, (14, 14, 12), 0.55),
        (LANDING / "Spanish_mock1.jpg", SCREENS / "es" / "begin-tour-lockup.jpeg", 128, (248, 245, 238), 0.72),
        (LANDING / "Spanish_mock2.jpg", SCREENS / "es" / "arrive-lockup.jpeg", 145, None, 0.55),
        (LANDING / "Spanish_mock4.jpg", SCREENS / "es" / "walk-lockup.jpeg", 0, (14, 14, 12), 0.55),
    ]
    for src, dst, force_top, bg, left_bias in jobs:
        if not src.exists():
            raise SystemExit(f"missing source {src} (checkout from origin/figma)")
        build(src, dst, force_top=force_top, bg=bg, left_bias=left_bias)


if __name__ == "__main__":
    main()
