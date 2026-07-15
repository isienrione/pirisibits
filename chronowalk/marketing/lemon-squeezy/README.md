# Lemon Squeezy — ChronoWalk media kit

Brand-locked assets for Lemon Squeezy product pages + confirmation / digital file.

| Token | Value |
| --- | --- |
| Display | Fraunces |
| UI | DM Sans |
| Obsidian | `#0B0B0D` |
| Bone | `#FAF6EF` |
| Terracotta | `#E4552E` |
| Gold | `#D4AF37` |

## Deliverables

| File | Use in Lemon |
| --- | --- |
| `ChronoWalk_Access_Guide.pdf` | Digital product file / confirmation attachment |
| `images/00-product-cover-1000.png` | Primary gallery (1000×1000) |
| `images/01` … `06-*.png` | Gallery / feature images (1600×1000) |
| `LEMON_PRODUCT_COPY.md` | Names, prices, short + HTML descriptions |
| `lemon-product-description-roma-eterna.html` | Paste into Roma Eterna description |
| `generate_assets.py` | Regenerate after brand or photo updates |

## Regenerate

```bash
cd chronowalk
python3 marketing/lemon-squeezy/generate_assets.py
```

Requires Pillow + reportlab. Fonts live in `fonts/` (OFL Fraunces / DM Sans).
