# Pantheon incoming sources

Drop your Runway/Midjourney exports here, then run from `chronowalk/`:

```bash
brew install ffmpeg   # one-time if needed
npm run process-pantheon
```

## Expected files (incoming names)

| Your Downloads file | Save as incoming |
|---------------------|------------------|
| `isienrione_Ancient_Rome_reconstruction_of_The_Pantheon_exact__….mp4` | `ancient-source.mp4` |
| `now_from_that_image_make_a_mi (1).mp4` | `modern-source.mp4` |

Original filenames also work if they contain `Ancient` / `Pantheon` or `now_from_that`.

## Important — content mapping (not filename)

Runway labels are backwards for this site. `npm run process-pantheon` sets **SWAP_RUNWAY=1** automatically:

| Incoming pattern | Output | Era |
|------------------|--------|-----|
| `ancient-source` / `*Ancient*Pantheon*` | `modern.mp4` + `modern-poster.jpg` | Today (piazza) |
| `modern-source` / `now_from_that*` | `ancient-reconstruction.mp4` + `.jpg` + `ancient-poster.jpg` | Ancient Rome |

If layers look swapped after processing, re-run `npm run process-pantheon` on the latest branch.

`incoming/` sources are not committed; final deliverables in `../` are.
