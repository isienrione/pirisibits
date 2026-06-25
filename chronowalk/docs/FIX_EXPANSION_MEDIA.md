# Fix expansion waypoint folders (Mac)

If `git add public/waypoints/...` fails or `process-expansion-waypoints` skips every stop, read this.

## What went wrong (typical Mac session)

| Symptom | Cause |
|---------|--------|
| `zsh: command not found: #` | Do not paste comment lines (`# ...`) into the terminal — they are documentation only |
| `cp: ... are identical (not copied)` then script stops | Old script; `git pull` again for the Mac-safe version |
| All 4 stops **SKIP — no modern-source.mp4** | You have **JPG stills** but not the **MP4 videos** in `incoming/` yet |
| `git commit` adds nothing | Nothing was processed — only wrong-case folder names or loose files in `public/` |
| Untracked `Campo-de-fiori/`, `Capitoline-Hill/` | Wrong casing; app only reads lowercase `campo-de-fiori`, etc. |

**Images alone are not enough.** Each stop needs **two MP4s** (Gemini Prompt 2 modern video + Prompt 4 ancient video) before `process-expansion-waypoints` can run.

---

## 1. Go to `chronowalk/` (not `scripts/`)

```bash
cd ~/pirisibits/chronowalk
pwd
```

`pwd` must end with `.../chronowalk`. If it ends with `.../chronowalk/scripts`, run `cd ..`.

---

## 2. Pull latest scripts

```bash
git pull origin cursor/chronowalk-setup-a224
```

---

## 3. Diagnose what you actually have

```bash
npm run diagnose-expansion-waypoints
```

You should see, per stop:

- `modern-exterior.jpg` at the **root** of `public/waypoints/<id>/`
- `incoming/modern-source.mp4`
- `incoming/ancient-source.mp4`

If MP4s are missing, the process step will always skip — that is expected until you add them.

---

## 4. Organize wrong folder names + move stills

```bash
npm run fix-expansion-folders
```

This scans aliases like `Campo-de-fiori`, `Largo_argentina`, `Capitoline-Hill` and copies JPGs/MP4s into the correct lowercase folders. It also lists loose MP4s sitting in `public/*.mp4`.

---

## 5. Place MP4s (required)

Each expansion stop needs **both** videos in `incoming/`:

| File | Source (Gemini workflow) |
|------|--------------------------|
| `incoming/modern-source.mp4` | Chat B — Prompt 2 (modern video from exterior still) |
| `incoming/ancient-source.mp4` | Chat B — Prompt 4 (ancient reconstruction video) |

### Option A — helper script

```bash
npm run place-expansion-mp4 -- campo-de-fiori modern "public/now_from_that_image_make_a_mi (1).mp4"
npm run place-expansion-mp4 -- campo-de-fiori ancient ~/Downloads/your-ancient-export.mp4
```

Repeat for `capitoline-hill`, `largo-argentina`, `castel-sant-angelo`.

### Option B — manual copy

```bash
mkdir -p public/waypoints/campo-de-fiori/incoming
cp "public/now_from_that_image_make_a_mi (1).mp4" public/waypoints/campo-de-fiori/incoming/modern-source.mp4
cp ~/Downloads/campo-ancient.mp4 public/waypoints/campo-de-fiori/incoming/ancient-source.mp4
```

**Loose file in your repo right now:**

- `public/now_from_that_image_make_a_mi (1).mp4` → modern video (assign to **one** stop)
- `public/isienrione_Ancient_Rome_reconstruction_of_The_Pantheon...mp4` → Pantheon ancient, **not** an expansion stop

You still need to export / locate **7 more MP4s** (ancient for the stop that gets `now_from...`, plus modern + ancient for the other three stops) from your Gemini chats.

---

## 6. Process videos (needs ffmpeg)

```bash
brew install ffmpeg   # if not installed
npm run process-expansion-waypoints
```

Success looks like:

```
========== campo-de-fiori ==========
(process-waypoint output…)
✓ modern.mp4
✓ ancient-reconstruction.mp4
```

If a stop still skips, run `npm run diagnose-expansion-waypoints` again.

---

## 7. Commit (from `chronowalk/` only)

```bash
cd ~/pirisibits/chronowalk

git add public/waypoints/capitoline-hill \
        public/waypoints/largo-argentina \
        public/waypoints/campo-de-fiori \
        public/waypoints/castel-sant-angelo

git status
git commit -m "Add processed slider media for expansion stops"
git push
```

Do **not** commit:

- Loose Gemini exports in `public/` root
- `.DS_Store`
- Wrong-case folder paths as separate trees (use lowercase ids only)

---

## Folder name reference

| Wrong (common on Mac) | Correct `id` |
|----------------------|----------------|
| `Campo-de-fiori` | `campo-de-fiori` |
| `Capitoline-Hill` | `capitoline-hill` |
| `Castel-Sant-Angelo` | `castel-sant-angelo` |
| `Largo_argentina` | `largo-argentina` |

---

## Test URLs

- Single stop: `http://localhost:5173/?singleWaypoint=campo-de-fiori&debugGeo=true`
- Full tour: `http://localhost:5173/?resetTour=true&debugGeo=true`
