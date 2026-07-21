#!/usr/bin/env python3
"""Regenerate public/landing/phone-screens/*.jpg (2× 390×844 marketing stills)."""

from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/landing/phone-screens"
FONT_DIRS = [
    ROOT / "marketing/lemon-squeezy/fonts",
    Path("/tmp/lemon-fonts"),
    Path("/usr/share/fonts/truetype/dejavu"),
]
PHOTO = ROOT / "public/waypoints/pantheon/modern-exterior.jpg"

W, H = 780, 1688
OBSIDIAN = (11, 11, 13)
CHARCOAL = (26, 26, 31)
BONE = (250, 246, 239)
SOFT = (240, 235, 227)
MUTED = (140, 132, 118)
GOLD = (212, 175, 55)
TERRACOTTA = (196, 90, 58)
OLIVE = (111, 128, 84)


def load_font(names: list[str], size: int) -> ImageFont.ImageFont:
    for base in FONT_DIRS:
        if not base.exists():
            continue
        for name in names:
            path = base / name
            if path.exists():
                return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def ui(size: int, weight: str = "400") -> ImageFont.ImageFont:
    files = {
        "400": ["dm-sans-latin-400-normal.ttf", "DMSans-Regular.ttf", "DejaVuSans.ttf"],
        "500": ["dm-sans-latin-500-normal.ttf", "DMSans-Medium.ttf", "DejaVuSans.ttf"],
        "700": ["dm-sans-latin-700-normal.ttf", "DMSans-Bold.ttf", "DejaVuSans-Bold.ttf"],
    }[weight]
    return load_font(files, size)


def round_rect(draw: ImageDraw.ImageDraw, box, radius: int, **kwargs) -> None:
    draw.rounded_rectangle(box, radius=radius, **kwargs)


def load_photo(size: tuple[int, int]) -> Image.Image:
    src = PHOTO if PHOTO.exists() else ROOT / "public/landing/threshold/colosseum-now.jpg"
    im = Image.open(src).convert("RGB")
    tw, th = size
    scale = max(tw / im.width, th / im.height)
    nw, nh = int(im.width * scale), int(im.height * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = max(0, (nh - th) // 3)
    return im.crop((left, top, left + tw, top + th))


def make_journey() -> Path:
    im = Image.new("RGB", (W, H), BONE)
    d = ImageDraw.Draw(im)
    d.text((48, 72), "Rome, Italy", font=ui(28, "500"), fill=MUTED)
    d.text((48, 120), "18 stops · your route", font=ui(42, "700"), fill=CHARCOAL)
    card = (40, 200, W - 40, H - 320)
    round_rect(d, card, 36, fill=SOFT)
    stops = [
        (1, "The Colosseum", TERRACOTTA, True),
        (2, "Colosseum interior", TERRACOTTA, False),
        (3, "Arch of Titus", OLIVE, False),
        (4, "Basilica of Maxentius", GOLD, False),
        (5, "Via Sacra", GOLD, False),
        (6, "Temple of Vesta", GOLD, False),
    ]
    pts: list[tuple[int, int]] = []
    for i, (n, title, color, filled) in enumerate(stops):
        y = card[1] + 80 + i * 165
        x = card[0] + 120 if i % 2 == 0 else card[0] + 400
        pts.append((x, y))
        if i:
            d.line([pts[i - 1], (x, y)], fill=(200, 190, 170), width=4)
        r = 28
        fill = color if filled else BONE
        d.ellipse((x - r, y - r, x + r, y + r), fill=fill, outline=color, width=4)
        d.text((x - 8, y - 14), str(n), font=ui(26, "700"), fill=BONE if filled else color)
        d.text((x + 44, y - 16), title, font=ui(26, "500"), fill=CHARCOAL)
    d.text((48, H - 280), "Next you'll enable location — then the guided", font=ui(24), fill=MUTED)
    d.text((48, H - 244), "tutorial begins at your first stop.", font=ui(24), fill=MUTED)
    round_rect(d, (48, H - 180, W - 48, H - 80), 40, fill=TERRACOTTA)
    d.text((130, H - 148), "Enable location & begin", font=ui(32, "700"), fill=BONE)
    path = OUT / "journey.jpg"
    im.save(path, "JPEG", quality=92, optimize=True)
    return path


def make_walk() -> Path:
    im = Image.new("RGB", (W, H), OBSIDIAN)
    d = ImageDraw.Draw(im)
    d.text((48, 88), "Walking to", font=ui(26), fill=MUTED)
    d.text((48, 130), "The Pantheon", font=ui(46, "700"), fill=BONE)
    d.text((48, 196), "280 m · 4 min", font=ui(26), fill=MUTED)
    thumb = load_photo((120, 120))
    mask = Image.new("L", (120, 120), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 120, 120), 24, fill=255)
    im.paste(thumb, (W - 168, 100), mask)
    round_rect(d, (48, 250, W - 48, 330), 40, fill=CHARCOAL)
    round_rect(d, (W // 2 + 8, 258, W - 56, 322), 32, fill=(45, 42, 38))
    d.text((140, 272), "Map", font=ui(28), fill=MUTED)
    d.text((W // 2 + 80, 272), "Steps", font=ui(28, "700"), fill=BONE)
    y = 370
    for n, title, dist in [
        ("1", "Continue along Via del Seminario", "120 m"),
        ("2", "Cross Piazza della Rotonda", "90 m"),
        ("3", "The Pantheon portico is ahead", "70 m"),
    ]:
        round_rect(d, (48, y, W - 48, y + 150), 28, fill=(28, 28, 32))
        d.ellipse((72, y + 48, 126, y + 102), outline=MUTED, width=3)
        d.text((90, y + 58), n, font=ui(28, "700"), fill=MUTED)
        d.text((148, y + 42), title, font=ui(28), fill=BONE)
        d.text((148, y + 90), dist, font=ui(24), fill=MUTED)
        y += 170
    d.text((64, H - 220), "Pause walk", font=ui(26), fill=MUTED)
    d.text((W - 220, H - 220), "I'm here", font=ui(26), fill=MUTED)
    for i, x in enumerate([120, 280, 440, 600]):
        round_rect(d, (x, H - 90, x + 90, H - 70), 8, fill=GOLD if i == 0 else (50, 50, 55))
    path = OUT / "walk-pantheon.jpg"
    im.save(path, "JPEG", quality=92, optimize=True)
    return path


def make_listen() -> Path:
    im = Image.new("RGB", (W, H), OBSIDIAN)
    photo = ImageEnhance.Brightness(load_photo((W, int(H * 0.58)))).enhance(0.88)
    im.paste(photo, (0, 0))
    grad = Image.new("RGBA", (W, int(H * 0.58)), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for i in range(200):
        a = int(230 * (i / 200))
        gd.rectangle(
            (0, int(H * 0.58) - 200 + i, W, int(H * 0.58) - 199 + i),
            fill=(11, 11, 13, a),
        )
    im.paste(grad, (0, 0), grad)
    d = ImageDraw.Draw(im)
    d.text((48, 80), "Free preview · Pantheon", font=ui(26, "500"), fill=GOLD)
    d.text((48, int(H * 0.30)), "The Pantheon", font=ui(50, "700"), fill=BONE)
    d.text(
        (48, int(H * 0.30) + 70),
        "Two thousand years of sky through one opening.",
        font=ui(26),
        fill=SOFT,
    )
    round_rect(d, (W // 2 - 190, int(H * 0.47), W // 2 + 190, int(H * 0.47) + 68), 34, fill=(18, 16, 14))
    d.text((W // 2 - 148, int(H * 0.47) + 18), "Press & hold to reveal", font=ui(24, "500"), fill=BONE)
    panel_y = int(H * 0.58)
    d.rectangle((0, panel_y, W, H), fill=(22, 22, 26))
    d.text((64, panel_y + 40), "Audio", font=ui(30, "700"), fill=BONE)
    d.text((200, panel_y + 40), "Read instead", font=ui(28), fill=MUTED)
    d.text((64, panel_y + 100), "Chapter 1 of 4 · The Pantheon — Exterior", font=ui(24), fill=MUTED)
    random.seed(3)
    wx0, wy = 64, panel_y + 160
    for i in range(48):
        bar_h = random.randint(20, 90)
        color = GOLD if i < 6 else (70, 70, 75)
        d.rectangle((wx0 + i * 13, wy + 50 - bar_h // 2, wx0 + i * 13 + 6, wy + 50 + bar_h // 2), fill=color)
    d.text((64, panel_y + 250), "0:03", font=ui(22), fill=MUTED)
    d.text((W - 120, panel_y + 250), "3:57", font=ui(22), fill=MUTED)
    cx, cy = W // 2, panel_y + 380
    d.ellipse((cx - 56, cy - 56, cx + 56, cy + 56), fill=OLIVE)
    d.polygon([(cx - 14, cy - 24), (cx - 14, cy + 24), (cx + 28, cy)], fill=OBSIDIAN)
    round_rect(d, (120, H - 140, W - 120, H - 70), 40, fill=CHARCOAL)
    d.text((W // 2 - 100, H - 118), "See the full tour →", font=ui(28), fill=BONE)
    path = OUT / "listen-pantheon.jpg"
    im.save(path, "JPEG", quality=92, optimize=True)
    return path


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for path in (make_journey(), make_walk(), make_listen()):
        print("wrote", path)


if __name__ == "__main__":
    main()
