#!/usr/bin/env python3
"""Rebuild how-it-works phone lockups from Safari screenshots.

Sources (checkout from origin/figma):
  public/landing/English_mock1.jpg → phone-screens/begin-tour-v2.jpeg
  public/landing/English_mock4.jpg → phone-screens/walk-v2.jpeg
  public/landing/Spanish_mock1.jpg → phone-screens/es/begin-tour-v2.jpeg
  public/landing/Spanish_mock2.jpg → phone-screens/es/arrive-v2.jpeg
  public/landing/Spanish_mock4.jpg → phone-screens/es/walk-v2.jpeg

Pipeline: strip Safari/black letterbox, then anisotropic resize to the
390×844 artboard (1170×2532) so screens fill the bezel edge-to-edge with
no side cropping of Walk here / tab labels.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LANDING = ROOT / "public" / "landing"
SCREENS = LANDING / "phone-screens"

TARGET_W, TARGET_H = 1170, 2532


def strip(im: Image.Image, force_top: int = 0) -> Image.Image:
    w, h = im.size
    if force_top:
        im = im.crop((0, force_top, w, h))
    a = np.asarray(im)
    row_mean = a.mean(axis=(1, 2))
    top = 0
    while top < len(row_mean) * 0.25 and row_mean[top] < 28:
        top += 1
    bottom = len(row_mean)
    while bottom > len(row_mean) * 0.8 and row_mean[bottom - 1] < 28:
        bottom -= 1
    if top > 0 or bottom < len(row_mean):
        im = Image.fromarray(a[top:bottom])
    return im


def build(src: Path, dst: Path, *, force_top: int) -> None:
    raw = Image.open(src).convert("RGB")
    im = strip(raw, force_top=force_top)
    out = im.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, "JPEG", quality=92, optimize=True)
    print(f"wrote {dst.relative_to(ROOT)} from {im.size}")


def main() -> None:
    jobs = [
        (LANDING / "English_mock1.jpg", SCREENS / "begin-tour-v2.jpeg", 128),
        (LANDING / "English_mock4.jpg", SCREENS / "walk-v2.jpeg", 178),
        (LANDING / "Spanish_mock1.jpg", SCREENS / "es" / "begin-tour-v2.jpeg", 128),
        (LANDING / "Spanish_mock2.jpg", SCREENS / "es" / "arrive-v2.jpeg", 145),
        (LANDING / "Spanish_mock4.jpg", SCREENS / "es" / "walk-v2.jpeg", 0),
    ]
    for src, dst, force_top in jobs:
        if not src.exists():
            raise SystemExit(f"missing source {src} (checkout from origin/figma)")
        build(src, dst, force_top=force_top)


if __name__ == "__main__":
    main()
