# Pantheon incoming sources

Drop your Runway/Midjourney exports here, then run from `chronowalk/`:

```bash
npm run process-pantheon
```

## Expected files

| Source (your Downloads) | Save as |
|-------------------------|---------|
| `isienrione_Ancient_Rome_reconstruction_of_The_Pantheon_exact__….mp4` | `ancient-source.mp4` |
| `now_from_that_image_make_a_mi (1).mp4` | `modern-source.mp4` |

Original filenames also work if they contain `Ancient` / `Pantheon` or `now_from_that`.

## Outputs (written to parent folder)

- `ancient-reconstruction.mp4` — ancient slider video
- `ancient-reconstruction.jpg` — still extracted from frame 0
- `ancient-poster.jpg` — hero frame at 3 s (padded to 16:9 if square)
- `modern.mp4` — modern slider video
- `modern-poster.jpg` — hero frame at 3 s

`incoming/` sources are not committed; final deliverables in `../` are.
