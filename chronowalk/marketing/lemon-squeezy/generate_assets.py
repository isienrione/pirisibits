#!/usr/bin/env python3
"""
Generate ChronoWalk Lemon Squeezy product assets + Access Guide PDF
aligned to landing brand (Fraunces + DM Sans, terracotta / gold / bone / obsidian).
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[2]  # chronowalk/
OUT = Path(__file__).resolve().parent
FONTS = OUT / "fonts"
IMAGES = OUT / "images"
GUIDE = OUT / "ChronoWalk_Access_Guide.pdf"

# Landing brand tokens (ChronoWalkLanding.v2 / redesign tokens)
OBSIDIAN = (11, 11, 13)
CHARCOAL = (26, 26, 31)
BONE = (250, 246, 239)
SOFT = (240, 235, 227)
MUTED = (185, 175, 156)
GOLD = (212, 175, 55)
TERRACOTTA = (228, 85, 46)
LIMESTONE = (233, 226, 213)
OLIVE = (107, 122, 82)
INK = (26, 26, 31)


def hex_rgb(rgb: tuple[int, int, int]) -> str:
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"


def load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONTS / name
    return ImageFont.truetype(str(path), size=size)


def wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textlength(trial, font=font) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def darken_photo(path: Path, size: tuple[int, int], strength: float = 0.45) -> Image.Image:
    if path.exists():
        img = Image.open(path).convert("RGB")
        img = ImageEnhance.Brightness(img).enhance(0.55)
        img = ImageEnhance.Color(img).enhance(0.85)
        img = img.resize(size, Image.Resampling.LANCZOS)
        overlay = Image.new("RGB", size, OBSIDIAN)
        return Image.blend(img, overlay, strength)
    return Image.new("RGB", size, OBSIDIAN)


def round_rect(draw: ImageDraw.ImageDraw, box, radius: int, fill=None, outline=None, width: int = 1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def phone_frame(draw: ImageDraw.ImageDraw, box, screen_fill=CHARCOAL):
    x0, y0, x1, y1 = box
    round_rect(draw, box, radius=42, fill=(20, 18, 16), outline=(70, 64, 56), width=2)
    inset = (x0 + 10, y0 + 10, x1 - 10, y1 - 10)
    round_rect(draw, inset, radius=34, fill=screen_fill)
    # Dynamic Island
    cx = (x0 + x1) // 2
    island = (cx - 48, y0 + 22, cx + 48, y0 + 42)
    round_rect(draw, island, radius=12, fill=(5, 4, 3))
    return inset


def draw_brand_mark(draw: ImageDraw.ImageDraw, x: int, y: int, dark: bool = False):
    color = BONE if not dark else INK
    accent = GOLD
    font = load_font("fraunces-latin-600-normal.ttf", 34)
    draw.text((x, y), "CHRONOWALK", font=font, fill=color)
    w = draw.textlength("CHRONOWALK", font=font)
    draw.line((x, y + 42, x + w, y + 42), fill=accent, width=2)


def save(img: Image.Image, name: str):
    IMAGES.mkdir(parents=True, exist_ok=True)
    path = IMAGES / name
    img.save(path, "PNG", optimize=True)
    print("wrote", path, img.size)
    return path


# —— Product / gallery images (Lemon Squeezy) ——————————————————————————


def make_hero_cover():
    """Walk Rome freely — dark hero + phone CTA."""
    W, H = 1600, 1000
    photo = ROOT / "public/landing/threshold/colosseum-now.jpg"
    base = darken_photo(photo, (W, H), 0.55)
    # soft vignette
    vig = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vig)
    for i in range(40):
        alpha = int(255 * (i / 40) ** 1.6)
        vd.rectangle((i * 8, i * 5, W - i * 8, H - i * 5), outline=alpha)
    vig = vig.filter(ImageFilter.GaussianBlur(28))
    shade = Image.new("RGB", (W, H), OBSIDIAN)
    base = Image.composite(shade, base, vig)

    d = ImageDraw.Draw(base)
    draw_brand_mark(d, 80, 70)
    eye = load_font("dm-sans-latin-500-normal.ttf", 22)
    d.text((80, 150), "SELF-GUIDED ROME EXPERIENCE", font=eye, fill=GOLD)
    title = load_font("fraunces-latin-600-normal.ttf", 64)
    for i, line in enumerate(["Walk Rome freely.", "Understand what you see."]):
        d.text((80, 210 + i * 78), line, font=title, fill=BONE)
    body = load_font("dm-sans-latin-400-normal.ttf", 28)
    for i, line in enumerate(
        wrap(
            d,
            "Immersive audio, historical reconstructions, and location-aware guidance — in your phone browser. No app download required.",
            body,
            720,
        )
    ):
        d.text((80, 390 + i * 36), line, font=body, fill=SOFT)

    round_rect(d, (80, 560, 520, 640), radius=40, fill=TERRACOTTA)
    btn = load_font("dm-sans-latin-700-normal.ttf", 22)
    d.text((120, 586), "NO APP DOWNLOAD REQUIRED", font=btn, fill=BONE)

    # Phone mockup
    phone = (980, 120, 1480, 920)
    inset = phone_frame(d, phone, screen_fill=OBSIDIAN)
    # screen content
    d.text((inset[0] + 36, inset[1] + 48), "ACT I", font=load_font("fraunces-latin-500-normal.ttf", 22), fill=GOLD)
    d.text((inset[0] + 36, inset[1] + 84), "The Promise", font=load_font("fraunces-latin-600-normal.ttf", 36), fill=BONE)
    thumb = darken_photo(photo, (420, 280), 0.2)
    base.paste(thumb, (inset[0] + 40, inset[1] + 160))
    round_rect(d, (inset[0] + 40, inset[1] + 480, inset[0] + 420, inset[1] + 545), radius=28, fill=TERRACOTTA)
    d.text((inset[0] + 90, inset[1] + 500), "Try one stop free", font=load_font("dm-sans-latin-700-normal.ttf", 22), fill=BONE)
    round_rect(d, (inset[0] + 40, inset[1] + 565, inset[0] + 420, inset[1] + 625), radius=28, outline=SOFT, width=2)
    d.text((inset[0] + 120, inset[1] + 583), "See packages", font=load_font("dm-sans-latin-500-normal.ttf", 22), fill=BONE)
    d.text((inset[0] + 70, inset[1] + 660), "One purchase. No subscription. Your pace.", font=load_font("dm-sans-latin-400-normal.ttf", 16), fill=MUTED)
    return save(base, "01-hero-walk-rome.png")


def make_threshold():
    W, H = 1600, 1000
    base = Image.new("RGB", (W, H), BONE)
    d = ImageDraw.Draw(base)
    draw_brand_mark(d, 80, 70, dark=True)
    d.text((80, 150), "HISTORICAL RECONSTRUCTION", font=load_font("dm-sans-latin-500-normal.ttf", 22), fill=GOLD)
    title = load_font("fraunces-latin-600-normal.ttf", 54)
    for i, line in enumerate(["Press and hold.", "The ruins become the room."]):
        d.text((80, 200 + i * 68), line, font=title, fill=INK)
    body = load_font("dm-sans-latin-400-normal.ttf", 26)
    for i, line in enumerate(
        wrap(d, "Reveal how Rome looked in the past without losing your real-world point of view.", body, 640)
    ):
        d.text((80, 360 + i * 34), line, font=body, fill=(70, 64, 56))

    now = ROOT / "public/landing/threshold/colosseum-now.jpg"
    then = ROOT / "public/landing/threshold/colosseum-then.jpg"
    # two phones
    for idx, (label, path, ox) in enumerate(
        [("TODAY", now, 820), ("PAST", then, 1120)]
    ):
        box = (ox, 160 + idx * 40, ox + 360, 160 + idx * 40 + 680)
        inset = phone_frame(d, box, screen_fill=CHARCOAL)
        photo = Image.open(path).convert("RGB").resize((320, 420), Image.Resampling.LANCZOS)
        base.paste(photo, (inset[0] + 20, inset[1] + 90))
        tag_fill = (70, 110, 180) if label == "TODAY" else CHARCOAL
        round_rect(d, (inset[0] + 24, inset[1] + 110, inset[0] + 110, inset[1] + 145), radius=10, fill=tag_fill)
        d.text((inset[0] + 36, inset[1] + 118), label, font=load_font("dm-sans-latin-700-normal.ttf", 16), fill=BONE)
        if label == "TODAY":
            round_rect(d, (inset[0] + 60, inset[1] + 470, inset[0] + 280, inset[1] + 520), radius=24, fill=(18, 16, 14))
            d.text((inset[0] + 85, inset[1] + 484), "PRESS AND HOLD", font=load_font("dm-sans-latin-700-normal.ttf", 16), fill=BONE)

    round_rect(d, (80, 780, 420, 860), radius=40, fill=INK)
    d.text((115, 806), "A REVEAL YOU CONTROL", font=load_font("dm-sans-latin-700-normal.ttf", 20), fill=BONE)
    return save(base, "02-threshold-reveal.png")


def make_route():
    W, H = 1600, 1000
    base = Image.new("RGB", (W, H), OBSIDIAN)
    d = ImageDraw.Draw(base)
    draw_brand_mark(d, 80, 70)
    d.text((80, 150), "A COMPLETE ROUTE", font=load_font("dm-sans-latin-500-normal.ttf", 22), fill=GOLD)
    title = load_font("fraunces-latin-600-normal.ttf", 52)
    for i, line in enumerate(["Everything worth seeing—", "already organized."]):
        d.text((80, 200 + i * 66), line, font=title, fill=BONE)
    body = load_font("dm-sans-latin-400-normal.ttf", 26)
    for i, line in enumerate(
        wrap(d, "Know the duration, distance, stops and route before you begin. Walk at your own pace.", body, 620)
    ):
        d.text((80, 360 + i * 34), line, font=body, fill=MUTED)

    pills = ["18+ stops", "3–6.5 hr", "Full city loop", "Start anytime"]
    x = 80
    for p in pills:
        font = load_font("dm-sans-latin-500-normal.ttf", 20)
        tw = d.textlength(p, font=font)
        round_rect(d, (x, 500, x + tw + 40, 555), radius=18, outline=TERRACOTTA, width=2)
        d.text((x + 20, 515), p, font=font, fill=BONE)
        x += tw + 56

    # Product card phone
    box = (900, 110, 1480, 900)
    inset = phone_frame(d, box, screen_fill=CHARCOAL)
    d.text((inset[0] + 40, inset[1] + 50), "FULL CITY LOOP", font=load_font("dm-sans-latin-700-normal.ttf", 16), fill=GOLD)
    d.text((inset[0] + 40, inset[1] + 90), "Roma Eterna", font=load_font("fraunces-latin-600-normal.ttf", 42), fill=GOLD)
    d.text((inset[0] + 40, inset[1] + 150), "$17.99 one-time", font=load_font("dm-sans-latin-500-normal.ttf", 24), fill=BONE)
    round_rect(d, (inset[0] + 40, inset[1] + 210, inset[0] + 250, inset[1] + 280), radius=14, outline=MUTED, width=1)
    round_rect(d, (inset[0] + 270, inset[1] + 210, inset[0] + 480, inset[1] + 280), radius=14, outline=MUTED, width=1)
    d.text((inset[0] + 55, inset[1] + 225), "EST. DURATION", font=load_font("dm-sans-latin-500-normal.ttf", 12), fill=MUTED)
    d.text((inset[0] + 55, inset[1] + 245), "~5–6.5 hr", font=load_font("dm-sans-latin-700-normal.ttf", 20), fill=BONE)
    d.text((inset[0] + 285, inset[1] + 225), "KEY STOPS", font=load_font("dm-sans-latin-500-normal.ttf", 12), fill=MUTED)
    d.text((inset[0] + 285, inset[1] + 245), "22", font=load_font("dm-sans-latin-700-normal.ttf", 20), fill=BONE)

    # fake map dots
    map_box = (inset[0] + 40, inset[1] + 310, inset[0] + 480, inset[1] + 560)
    round_rect(d, map_box, radius=18, fill=(40, 48, 42))
    for i in range(12):
        ax = map_box[0] + 40 + i * 32
        ay = map_box[1] + 80 + int(70 * math.sin(i / 2.2))
        r = 10
        d.ellipse((ax - r, ay - r, ax + r, ay + r), fill=GOLD)
        d.text((ax - 4, ay - 7), str(i + 1), font=load_font("dm-sans-latin-700-normal.ttf", 11), fill=OBSIDIAN)

    round_rect(d, (inset[0] + 40, inset[1] + 600, inset[0] + 480, inset[1] + 680), radius=28, fill=TERRACOTTA)
    d.text((inset[0] + 160, inset[1] + 626), "Begin Rome", font=load_font("dm-sans-latin-700-normal.ttf", 26), fill=BONE)
    return save(base, "03-route-organized.png")


def make_stories():
    W, H = 1600, 1000
    base = Image.new("RGB", (W, H), BONE)
    d = ImageDraw.Draw(base)
    draw_brand_mark(d, 80, 70, dark=True)
    d.text((80, 150), "STORIES IN THE RIGHT PLACE", font=load_font("dm-sans-latin-500-normal.ttf", 22), fill=TERRACOTTA)
    title = load_font("fraunces-latin-600-normal.ttf", 52)
    for i, line in enumerate(["Hear the story exactly", "where it happened."]):
        d.text((80, 200 + i * 66), line, font=title, fill=INK)
    body = load_font("dm-sans-latin-400-normal.ttf", 26)
    for i, line in enumerate(
        wrap(d, "Each chapter combines cinematic narration, visual context and location-aware progression.", body, 620)
    ):
        d.text((80, 360 + i * 34), line, font=body, fill=(70, 64, 56))
    d.text((80, 820), "HEADPHONES ON.", font=load_font("dm-sans-latin-700-normal.ttf", 22), fill=TERRACOTTA)
    d.text((80, 860), "THE CITY STARTS TALKING.", font=load_font("fraunces-latin-600-normal.ttf", 28), fill=INK)

    col = ROOT / "public/landing/threshold/colosseum-now.jpg"
    titus = ROOT / "public/waypoints/forum-cluster/forum-arch-titus/modern-poster.jpg"
    # arrival phone
    box1 = (820, 140, 1180, 880)
    inset = phone_frame(d, box1, screen_fill=OBSIDIAN)
    d.text((inset[0] + 40, inset[1] + 50), "YOU HAVE ARRIVED", font=load_font("dm-sans-latin-700-normal.ttf", 14), fill=OLIVE)
    d.text((inset[0] + 40, inset[1] + 80), "The Colosseum", font=load_font("fraunces-latin-600-normal.ttf", 32), fill=BONE)
    p = Image.open(col).convert("RGB").resize((280, 280), Image.Resampling.LANCZOS)
    base.paste(p, (inset[0] + 30, inset[1] + 150))
    round_rect(d, (inset[0] + 30, inset[1] + 470, inset[0] + 300, inset[1] + 540), radius=24, fill=TERRACOTTA)
    d.text((inset[0] + 85, inset[1] + 492), "Begin Chapter", font=load_font("dm-sans-latin-700-normal.ttf", 20), fill=BONE)

    # reveal phone
    box2 = (1120, 200, 1480, 940)
    inset = phone_frame(d, box2, screen_fill=OBSIDIAN)
    p2 = Image.open(titus).convert("RGB").resize((300, 360), Image.Resampling.LANCZOS)
    base.paste(p2, (inset[0] + 20, inset[1] + 70))
    # scrim
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((inset[0] + 20, inset[1] + 280, inset[0] + 320, inset[1] + 430), fill=(8, 8, 10, 140))
    base = Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")
    d = ImageDraw.Draw(base)
    d.text((inset[0] + 36, inset[1] + 300), "Arch of Titus", font=load_font("fraunces-latin-600-normal.ttf", 28), fill=BONE)
    d.text((inset[0] + 36, inset[1] + 340), "Stand where triumph entered the city.", font=load_font("dm-sans-latin-400-normal.ttf", 14), fill=SOFT)
    round_rect(d, (inset[0] + 50, inset[1] + 380, inset[0] + 290, inset[1] + 420), radius=20, fill=(18, 16, 14))
    d.text((inset[0] + 70, inset[1] + 390), "PRESS & HOLD TO REVEAL", font=load_font("dm-sans-latin-700-normal.ttf", 12), fill=BONE)
    round_rect(d, (inset[0] + 30, inset[1] + 560, inset[0] + 310, inset[1] + 615), radius=22, fill=TERRACOTTA)
    d.text((inset[0] + 95, inset[1] + 576), "Skip ahead →", font=load_font("dm-sans-latin-700-normal.ttf", 18), fill=BONE)
    return save(base, "04-stories-in-place.png")


def make_guidance():
    W, H = 1600, 1000
    base = Image.new("RGB", (W, H), OBSIDIAN)
    d = ImageDraw.Draw(base)
    draw_brand_mark(d, 80, 70)
    d.text((80, 150), "GUIDANCE WITHOUT DISTRACTION", font=load_font("dm-sans-latin-500-normal.ttf", 22), fill=GOLD)
    title = load_font("fraunces-latin-600-normal.ttf", 48)
    for i, line in enumerate(["Know where to go next—", "without staring at a map."]):
        d.text((80, 200 + i * 62), line, font=title, fill=BONE)
    body = load_font("dm-sans-latin-400-normal.ttf", 26)
    for i, line in enumerate(
        wrap(d, "Turn-by-turn steps and a live map stay ready when you need them — then step back so the city stays in front of you.", body, 640)
    ):
        d.text((80, 360 + i * 34), line, font=body, fill=MUTED)
    round_rect(d, (80, 560, 480, 640), radius=40, fill=TERRACOTTA)
    d.text((125, 586), "WALK MORE. CHECK LESS.", font=load_font("dm-sans-latin-700-normal.ttf", 22), fill=BONE)

    # steps phone
    box = (980, 120, 1480, 920)
    inset = phone_frame(d, box, screen_fill=OBSIDIAN)
    d.text((inset[0] + 36, inset[1] + 50), "Walking to", font=load_font("dm-sans-latin-400-normal.ttf", 16), fill=MUTED)
    d.text((inset[0] + 36, inset[1] + 78), "Arch of Titus", font=load_font("fraunces-latin-600-normal.ttf", 32), fill=BONE)
    d.text((inset[0] + 36, inset[1] + 130), "335 m · 4 min", font=load_font("dm-sans-latin-500-normal.ttf", 18), fill=BONE)
    round_rect(d, (inset[0] + 36, inset[1] + 175, inset[0] + 220, inset[1] + 220), radius=20, fill=CHARCOAL)
    d.text((inset[0] + 55, inset[1] + 188), "Map", font=load_font("dm-sans-latin-500-normal.ttf", 16), fill=MUTED)
    d.text((inset[0] + 120, inset[1] + 188), "Steps", font=load_font("dm-sans-latin-700-normal.ttf", 16), fill=BONE)
    steps = [
        "Start walking toward Arch of Titus (92 m)",
        "Turn right onto Colosseo (9 m)",
        "Turn left onto Piazza del Colosseo.",
    ]
    for i, s in enumerate(steps):
        y = inset[1] + 260 + i * 100
        round_rect(d, (inset[0] + 36, y, inset[0] + 430, y + 85), radius=16, fill=CHARCOAL)
        d.ellipse((inset[0] + 52, y + 28, inset[0] + 82, y + 58), fill=(42, 42, 49))
        d.text((inset[0] + 62, y + 33), str(i + 1), font=load_font("dm-sans-latin-700-normal.ttf", 14), fill=MUTED)
        for j, line in enumerate(wrap(d, s, load_font("dm-sans-latin-400-normal.ttf", 16), 300)):
            d.text((inset[0] + 100, y + 22 + j * 22), line, font=load_font("dm-sans-latin-400-normal.ttf", 16), fill=BONE)
    d.text((inset[0] + 50, inset[1] + 620), "Pause walk", font=load_font("dm-sans-latin-400-normal.ttf", 18), fill=MUTED)
    d.text((inset[0] + 300, inset[1] + 620), "I'm here", font=load_font("dm-sans-latin-700-normal.ttf", 18), fill=OLIVE)
    return save(base, "05-guidance-steps.png")


def make_journey():
    W, H = 1600, 1000
    base = Image.new("RGB", (W, H), BONE)
    d = ImageDraw.Draw(base)
    draw_brand_mark(d, 80, 70, dark=True)
    d.text((80, 150), "ONE CONNECTED EXPERIENCE", font=load_font("dm-sans-latin-500-normal.ttf", 22), fill=GOLD)
    title = load_font("fraunces-latin-600-normal.ttf", 48)
    for i, line in enumerate(["From your first landmark", "to your final memory."]):
        d.text((80, 200 + i * 62), line, font=title, fill=INK)
    body = load_font("dm-sans-latin-400-normal.ttf", 26)
    for i, line in enumerate(
        wrap(d, "Track your progress, continue through the route and finish with a meaningful recap of what you discovered.", body, 640)
    ):
        d.text((80, 360 + i * 34), line, font=body, fill=(70, 64, 56))
    d.text((80, 520), "ROME, ETERNAL CITY", font=load_font("fraunces-latin-600-normal.ttf", 24), fill=INK)
    d.text((80, 560), "A journey designed to be remembered.", font=load_font("dm-sans-latin-400-normal.ttf", 22), fill=(70, 64, 56))

    # progress phone
    box = (900, 140, 1460, 880)
    inset = phone_frame(d, box, screen_fill=BONE)
    d.text((inset[0] + 40, inset[1] + 50), "ROME · ETERNAL CITY", font=load_font("dm-sans-latin-700-normal.ttf", 14), fill=GOLD)
    d.text((inset[0] + 40, inset[1] + 90), "2 / 18 stops", font=load_font("fraunces-latin-600-normal.ttf", 36), fill=INK)
    for i, (name, status) in enumerate(
        [("Arch of Titus", "Visited"), ("Basilica of Maxentius", "Current"), ("Temple of Vesta", "Next")]
    ):
        y = inset[1] + 180 + i * 120
        round_rect(d, (inset[0] + 30, y, inset[0] + 470, y + 100), radius=18, fill=SOFT, outline=LIMESTONE, width=1)
        d.text((inset[0] + 55, y + 28), name, font=load_font("fraunces-latin-500-normal.ttf", 24), fill=INK)
        color = OLIVE if status == "Visited" else (TERRACOTTA if status == "Current" else MUTED)
        d.text((inset[0] + 55, y + 62), status.upper(), font=load_font("dm-sans-latin-700-normal.ttf", 14), fill=color)
    round_rect(d, (inset[0] + 40, inset[1] + 580, inset[0] + 460, inset[1] + 655), radius=28, fill=TERRACOTTA)
    d.text((inset[0] + 130, inset[1] + 605), "Continue — Act II", font=load_font("dm-sans-latin-700-normal.ttf", 22), fill=BONE)
    return save(base, "06-journey-progress.png")


def make_product_square():
    """1000×1000 Lemon gallery primary cover."""
    W = H = 1000
    photo = darken_photo(ROOT / "public/landing/threshold/colosseum-now.jpg", (W, H), 0.5)
    d = ImageDraw.Draw(photo)
    draw_brand_mark(d, 70, 70)
    d.text((70, 160), "ROMA ETERNA", font=load_font("dm-sans-latin-700-normal.ttf", 22), fill=GOLD)
    title = load_font("fraunces-latin-600-normal.ttf", 58)
    for i, line in enumerate(["Self-guided", "Rome walks"]):
        d.text((70, 210 + i * 70), line, font=title, fill=BONE)
    d.text((70, 380), "One-time purchase · No app download", font=load_font("dm-sans-latin-400-normal.ttf", 24), fill=SOFT)
    round_rect(d, (70, 780, 420, 870), radius=40, fill=TERRACOTTA)
    d.text((115, 808), "From $12 · Complete $17.99", font=load_font("dm-sans-latin-700-normal.ttf", 20), fill=BONE)
    return save(photo, "00-product-cover-1000.png")


# —— Access Guide PDF ——————————————————————————————————————————————


def register_pdf_fonts():
    pdfmetrics.registerFont(TTFont("Fraunces", str(FONTS / "fraunces-latin-600-normal.ttf")))
    pdfmetrics.registerFont(TTFont("FrauncesReg", str(FONTS / "fraunces-latin-400-normal.ttf")))
    pdfmetrics.registerFont(TTFont("DMSans", str(FONTS / "DMSans-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("DMSansMed", str(FONTS / "DMSans-Medium.ttf")))
    pdfmetrics.registerFont(TTFont("DMSansBold", str(FONTS / "DMSans-Bold.ttf")))


def pdf_color(c: canvas.Canvas, rgb: tuple[int, int, int]):
    c.setFillColorRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)


def pdf_stroke(c: canvas.Canvas, rgb: tuple[int, int, int]):
    c.setStrokeColorRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)


def draw_pdf_header(c: canvas.Canvas, width: float, y: float):
    pdf_color(c, BONE)
    c.setFont("Fraunces", 18)
    c.drawString(28 * mm, y, "CHRONOWALK")
    tw = c.stringWidth("CHRONOWALK", "Fraunces", 18)
    pdf_stroke(c, GOLD)
    c.setLineWidth(1.2)
    c.line(28 * mm, y - 3, 28 * mm + tw, y - 3)


def rounded_rect_pdf(c, x, y, w, h, r, fill=None, stroke=None, sw=1):
    if fill:
        pdf_color(c, fill)
        c.roundRect(x, y, w, h, r, fill=1, stroke=0)
    if stroke:
        pdf_stroke(c, stroke)
        c.setLineWidth(sw)
        c.roundRect(x, y, w, h, r, fill=0, stroke=1)


def make_access_guide_pdf():
    register_pdf_fonts()
    GUIDE.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(GUIDE), pagesize=A4)
    width, height = A4

    # —— Page 1: Your purchase is ready ——
    pdf_color(c, OBSIDIAN)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    draw_pdf_header(c, width, height - 22 * mm)

    pdf_color(c, GOLD)
    c.setFont("DMSansMed", 11)
    c.drawString(28 * mm, height - 40 * mm, "YOUR PURCHASE IS READY")

    pdf_color(c, BONE)
    c.setFont("Fraunces", 28)
    c.drawString(28 * mm, height - 55 * mm, "Welcome to ChronoWalk")

    pdf_color(c, SOFT)
    c.setFont("DMSans", 12)
    lines = [
        "Your self-guided journey through Rome is accessed online from your",
        "phone. No app download is required.",
    ]
    y = height - 68 * mm
    for line in lines:
        c.drawString(28 * mm, y, line)
        y -= 6 * mm

    rounded_rect_pdf(c, 28 * mm, height - 100 * mm, 70 * mm, 12 * mm, 6 * mm, fill=TERRACOTTA)
    pdf_color(c, BONE)
    c.setFont("DMSansBold", 10)
    c.drawCentredString(63 * mm, height - 96 * mm, "OPEN CHRONOWALK.COM")

    steps = [
        ("1", "Open your purchase email", "Use the same email address you entered at checkout."),
        ("2", "Follow the access link", "The confirmation email will direct you to your purchased tour."),
        ("3", "Open the tour on your phone", "ChronoWalk works in your mobile browser, so there is nothing to install."),
        ("4", "Bring headphones and begin", "Go to the starting point shown in the tour and press Start when you are ready."),
    ]
    y = height - 120 * mm
    for num, title, body in steps:
        rounded_rect_pdf(c, 28 * mm, y - 2 * mm, 8 * mm, 8 * mm, 4 * mm, fill=TERRACOTTA)
        pdf_color(c, BONE)
        c.setFont("DMSansBold", 11)
        c.drawCentredString(32 * mm, y + 0.5 * mm, num)
        c.setFont("FrauncesReg", 14)
        c.drawString(42 * mm, y + 1 * mm, title)
        pdf_color(c, MUTED)
        c.setFont("DMSans", 10)
        c.drawString(42 * mm, y - 5 * mm, body)
        y -= 22 * mm

    rounded_rect_pdf(c, 28 * mm, 28 * mm, width - 56 * mm, 28 * mm, 4 * mm, fill=CHARCOAL)
    pdf_color(c, GOLD)
    c.setFont("DMSansBold", 10)
    c.drawString(36 * mm, 46 * mm, "Keep your purchase email.")
    pdf_color(c, SOFT)
    c.setFont("DMSans", 10)
    c.drawString(36 * mm, 38 * mm, "It contains your receipt and the access details associated with your order.")
    c.showPage()

    # —— Page 2: Before your walk ——
    pdf_color(c, BONE)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    pdf_color(c, INK)
    c.setFont("Fraunces", 18)
    c.drawString(28 * mm, height - 22 * mm, "CHRONOWALK")
    tw = c.stringWidth("CHRONOWALK", "Fraunces", 18)
    pdf_stroke(c, GOLD)
    c.setLineWidth(1.2)
    c.line(28 * mm, height - 25 * mm, 28 * mm + tw, height - 25 * mm)

    pdf_color(c, TERRACOTTA)
    c.setFont("DMSansMed", 11)
    c.drawString(28 * mm, height - 40 * mm, "BEFORE YOUR WALK")

    pdf_color(c, INK)
    c.setFont("Fraunces", 26)
    c.drawString(28 * mm, height - 55 * mm, "A few things make the experience better")

    tips = [
        ("Charge your phone", "GPS, audio and screen use can consume more battery than ordinary browsing."),
        ("Bring headphones", "The narration is designed to accompany the city without disturbing the people around you."),
        ("Allow location access", "Location access helps ChronoWalk guide you between stops and recognize your progress."),
        ("Open the tour with internet access", "Load the experience before you begin, especially when mobile coverage may be inconsistent."),
        ("Wear comfortable shoes", "This is a walking experience through active streets, historic surfaces and archaeological areas."),
    ]
    y = height - 72 * mm
    for title, body in tips:
        pdf_color(c, GOLD)
        c.circle(32 * mm, y + 2 * mm, 2.2 * mm, fill=1, stroke=0)
        pdf_color(c, INK)
        c.setFont("DMSansBold", 11)
        c.drawString(40 * mm, y, title)
        pdf_color(c, (90, 82, 70))
        c.setFont("DMSans", 10)
        c.drawString(40 * mm, y - 6 * mm, body)
        y -= 18 * mm

    rounded_rect_pdf(c, 28 * mm, 48 * mm, width - 56 * mm, 42 * mm, 4 * mm, fill=INK)
    pdf_color(c, TERRACOTTA)
    c.setFont("DMSansBold", 10)
    c.drawString(36 * mm, 78 * mm, "IMPORTANT")
    pdf_color(c, BONE)
    c.setFont("DMSans", 10)
    c.drawString(36 * mm, 70 * mm, "Your purchase is for personal use.")
    c.drawString(36 * mm, 63 * mm, "Do not share your access link, account credentials, audio, scripts,")
    c.drawString(36 * mm, 56 * mm, "reconstructions or other ChronoWalk content.")

    pdf_color(c, (90, 82, 70))
    c.setFont("DMSans", 10)
    c.drawString(28 * mm, 34 * mm, "Need help? Visit chronowalk.com and use the contact option on the website.")
    pdf_color(c, INK)
    c.setFont("FrauncesReg", 11)
    c.drawString(28 * mm, 24 * mm, "ChronoWalk — Rome, understood one step at a time.")
    c.save()
    print("wrote", GUIDE)


def write_product_copy():
    md = OUT / "LEMON_PRODUCT_COPY.md"
    md.write_text(
        f"""# Lemon Squeezy — ChronoWalk product copy & assets

Brand-aligned to chronowalk.com landing: **Fraunces** (display) + **DM Sans** (UI),  
obsidian `{hex_rgb(OBSIDIAN)}`, bone `{hex_rgb(BONE)}`, terracotta `{hex_rgb(TERRACOTTA)}`, gold `{hex_rgb(GOLD)}`.

Generated assets live in `marketing/lemon-squeezy/`.

## Products to create

| Lemon product name | Custom `product_id` | Price (USD) |
| --- | --- | --- |
| ChronoWalk — Roma Historica | `rome-central` | $12 |
| ChronoWalk — Roma Antica | `rome-essential` | $12 |
| ChronoWalk — Roma Eterna | `rome-complete` | $17.99 |

Attach custom checkout data: `product_id` (already appended by the app).

---

## Roma Eterna (featured / primary)

**Name:** ChronoWalk — Roma Eterna  
**Price:** $17.99 one-time  

**Short description:**
Self-guided Rome walk from the Arena to the Appian Way. Place-tied narration, Threshold reconstructions, and GPS guidance — in your phone browser. No app download. No subscription.

**Long description (HTML-friendly):**

```html
<p><strong>Walk Rome freely. Understand what you see.</strong></p>
<p>Roma Eterna is ChronoWalk’s complete Rome experience — the archaeological core, the living centro, and the outer loop — organized as one continuous story.</p>
<ul>
  <li>All Rome stops on the ChronoWalk route (Colosseum &amp; Forum through the Appian Way)</li>
  <li>Threshold historical reconstructions at key landmarks</li>
  <li>Location-aware chapters that open when you arrive</li>
  <li>Map + turn-by-turn steps when you need them</li>
  <li>One-time purchase · yours to keep · no subscription</li>
  <li>Works in your mobile browser — no app download required</li>
</ul>
<p><em>After purchase:</em> open the access link in your confirmation email on your phone, enable location, bring headphones, and begin at the first stop.</p>
```

**Gallery image order:**  
`images/00-product-cover-1000.png` → `01` … `06`

**Digital file / confirmation attachment:**  
`ChronoWalk_Access_Guide.pdf`

---

## Roma Historica

**Name:** ChronoWalk — Roma Historica  
**Price:** $12 one-time  

**Short description:**
The Pantheon and the living city around it — Trevi, Navona, Campo, Argentina, and Castel Sant’Angelo. Outside the Colosseum archaeological park.

**Long description:**

```html
<p>Walk the centro storico with place-tied narration and Threshold at the Pantheon stop you can try free first.</p>
<ul>
  <li>Pantheon chapters + Threshold</li>
  <li>Centro storico stops — no park ticket required</li>
  <li>Browser-based · one-time purchase</li>
</ul>
```

---

## Roma Antica

**Name:** ChronoWalk — Roma Antica  
**Price:** $12 one-time  

**Short description:**
The ancient core — Colosseum and Roman Forum — with stories where they happened and Threshold reconstructions at key landmarks.

---

## Checkout settings

| Setting | Value |
| --- | --- |
| Success redirect | `https://chronowalk.com/access/confirmed` |
| Confirmation email | Include access URL from webhook / magic link |
| Media | Upload PNGs from `images/` + attach Access Guide PDF |

## Buyer access guide (same content as PDF)

1. Open your purchase email (same address as checkout).  
2. Follow the access link to your tour.  
3. Open ChronoWalk on your phone browser — nothing to install.  
4. Bring headphones, start at the first stop.

Before you walk: charge your phone, allow location, load with internet, comfortable shoes. Purchase is for personal use — do not share access links or content.
""",
        encoding="utf-8",
    )
    print("wrote", md)

    html = OUT / "lemon-product-description-roma-eterna.html"
    html.write_text(
        """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>ChronoWalk — Roma Eterna</title>
</head>
<body style="font-family: 'DM Sans', system-ui, sans-serif; color:#1A1A1F; line-height:1.5;">
  <p style="font-family: Fraunces, Georgia, serif; font-size:1.35rem;"><strong>Walk Rome freely. Understand what you see.</strong></p>
  <p>Roma Eterna is ChronoWalk’s complete Rome experience — the archaeological core, the living centro, and the outer loop — organized as one continuous story.</p>
  <ul>
    <li>All Rome stops on the ChronoWalk route (Colosseum &amp; Forum through the Appian Way)</li>
    <li>Threshold historical reconstructions at key landmarks</li>
    <li>Location-aware chapters that open when you arrive</li>
    <li>Map + turn-by-turn steps when you need them</li>
    <li>One-time purchase · yours to keep · no subscription</li>
    <li>Works in your mobile browser — no app download required</li>
  </ul>
  <p><em>After purchase:</em> open the access link in your confirmation email on your phone, enable location, bring headphones, and begin at the first stop.</p>
  <p style="color:#8B8638;">chronowalk.com</p>
</body>
</html>
""",
        encoding="utf-8",
    )
    print("wrote", html)


def main():
    IMAGES.mkdir(parents=True, exist_ok=True)
    make_product_square()
    make_hero_cover()
    make_threshold()
    make_route()
    make_stories()
    make_guidance()
    make_journey()
    make_access_guide_pdf()
    write_product_copy()
    print("\\nAll Lemon Squeezy assets ready in", OUT)


if __name__ == "__main__":
    main()
