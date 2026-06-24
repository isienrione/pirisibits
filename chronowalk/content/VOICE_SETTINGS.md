# TTS voice settings — lock on Day 1, do not change during sprint

Fill in when you pick your narrator for the 3-day audio sprint.

| Setting | Value |
|---------|-------|
| Provider | ElevenLabs / OpenAI / other |
| Voice name | |
| Voice ID | |
| Model | |
| Stability | ~0.65 |
| Similarity | ~0.75 |
| Speed | 1.0–1.05 |
| Output | WAV 48 kHz before ffmpeg |

**Master chain (all files):**

```bash
ffmpeg -i INPUT.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 OUTPUT.mp3
```

Or batch: `npm run normalize-audio -- <waypoint-id>`
