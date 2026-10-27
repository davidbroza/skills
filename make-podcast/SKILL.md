---
name: make-podcast
description: Generate a two-host podcast episode from any text or doc. A witty British host ("Aria", dry sarcasm) and a straight-laced journalist co-host ("Brian", news-anchor delivery, never catches the sarcasm). Writes the dialogue with an LLM via OpenRouter, voices each line with ElevenLabs, stitches with ffmpeg, and can optionally publish to your own podcast feed. Use when the user says "make a podcast about X", "two-host podcast", "dialogue version", "co-hosted episode", or invokes /make-podcast.
---

# make-podcast

Two characters by default (personas, not specific voices; pick any ElevenLabs voices you like):

- **Aria (witty)** — British host. Dry sarcasm, BBC Radio 4 × Red Dwarf register. Explains what was actually built. Teases affectionately.
- **Brian (straight)** — journalist co-host. American news-anchor cadence. Earnest, asks the obvious follow-ups, never picks up the sarcasm. The straight man.

The contrast is the joke. Aria says something dry; Brian responds as if it were a plain statement of fact.

For solo narration, use `read-to-me` instead.

## Setup

```bash
export ELEVENLABS_API_KEY=...          # ElevenLabs TTS
export OPENROUTER_API_KEY=...          # dialogue generation
export PODCAST_WITTY_VOICE_ID=...      # ElevenLabs voice ID for the witty host
export PODCAST_STRAIGHT_VOICE_ID=...   # ElevenLabs voice ID for the straight host
# optional
export OPENROUTER_MODEL=moonshotai/kimi-k2   # any OpenRouter chat model
export PODCAST_INGEST_URL=https://<your-feed>/api/ingest-episode   # for --publish
export PODCAST_INGEST_SECRET=...                                   # bearer token for it
```

Pick voice IDs from your ElevenLabs voice library. Keep keys in a secret manager or shell env, never in the repo. Requires `bun` and `ffmpeg`.

## Quickstart

```bash
# From a file, save mp3, don't publish
./podcast.sh --file ./notes.md --output /tmp/ep.mp3

# Pipe stdin, publish to your feed
echo "Today I shipped X" | ./podcast.sh --publish "Episode title"
```

## How it works

```
input text
   │
   ▼
[ LLM via OpenRouter ] → alternating WITTY:/STRAIGHT: lines → [{speaker, text}]
   │
   ▼
[ for each line: ElevenLabs → mp3 ] (2 concurrent)
   │
   ▼
[ ffmpeg: decode to WAV, concat with ~480 ms silence, encode stereo MP3 ]
   │
   └─ if --publish: multipart POST to $PODCAST_INGEST_URL
```

## Flags

| flag | default | notes |
|---|---|---|
| `--text "..."` | from stdin | inline input |
| `--file <path>` | — | read from file |
| `--output <path>` | `$TMPDIR/podcast-<ts>.mp3` | final mp3 |
| `--play` | off | `afplay` after generate (macOS) |
| `--publish "<title>"` | off | POST to your ingest endpoint |
| `--slug <slug>` | derived from title | URL slug |
| `--show <name>` | — | optional show field sent to the ingest endpoint |
| `--witty-voice <id>` | `$PODCAST_WITTY_VOICE_ID` | the sarcastic host |
| `--straight-voice <id>` | `$PODCAST_STRAIGHT_VOICE_ID` | the journalist |
| `--target-minutes <n>` | `7` | rough target length |
| `--save-script <path>` | — | also write the dialogue JSON |

## Publishing

`--publish` sends `multipart/form-data` (`title`, `slug`, `description`, `pub_date`, `show`, `audio`) with `Authorization: Bearer $PODCAST_INGEST_SECRET`, and expects `{ "url": "..." }` back. Point it at any endpoint you run that stores the MP3 and adds it to an RSS feed.

## Layout

```
make-podcast/
├── SKILL.md
├── podcast.sh             # entry — shells to bun
├── package.json
└── scripts/
    ├── main.ts            # orchestrator
    ├── dialogue.ts        # OpenRouter call → dialogue lines
    ├── tts.ts             # ElevenLabs caller (per line)
    ├── stitch.ts          # ffmpeg concat with pauses
    └── publish.ts         # POST to your ingest endpoint
```

## Inspiration

The two-complementary-voices pattern comes from the `bytedance/deer-flow` podcast-generation skill, adapted to run locally with ElevenLabs + ffmpeg.
