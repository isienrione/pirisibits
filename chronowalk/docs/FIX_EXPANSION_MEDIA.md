# Fix expansion waypoint folders (Mac)

If `git add public/waypoints/...` fails, you are usually in the **wrong directory** or folders use the **wrong names**.

## 1. Go to `chronowalk/` (not `scripts/`)

```bash
cd ~/pirisibits/chronowalk
pwd
# Must end with: .../chronowalk
```

If you see `.../chronowalk/scripts`, run `cd ..` first.

## 2. Folder names must match exactly (lowercase)

| Wrong (common on Mac) | Correct `id` |
|----------------------|----------------|
| `Campo-de-fiori` | `campo-de-fiori` |
| `Capitoline-Hill` | `capitoline-hill` |
| `Castel-Sant-Angelo` | `castel-sant-angelo` |
| `Largo_argentina` | `largo-argentina` |

The app only loads: `public/waypoints/<id>/` with **lowercase kebab-case**.

## 3. Auto-fix script (after `git pull`)

```bash
cd chronowalk
git pull origin cursor/chronowalk-setup-a224
npm run fix-expansion-folders
npm run process-expansion-waypoints
```

This merges wrongly named folders into the correct ids and processes `incoming/` MP4s.

## 4. Manual layout (if you prefer)

```
public/waypoints/campo-de-fiori/
  modern-exterior.jpg                 ← ROOT (not inside incoming/)
  ancient-reconstruction.jpg          ← optional at ROOT
  incoming/
    modern-source.mp4
    ancient-source.mp4
```

Then:

```bash
npm run process-waypoint -- campo-de-fiori
npm run verify-waypoint -- campo-de-fiori
```

## 5. Commit (from `chronowalk/`)

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

Do **not** commit loose files in `public/` root (old Gemini exports) or `.DS_Store`.

## 6. Test

http://localhost:5173/?singleWaypoint=castel-sant-angelo&debugGeo=true
