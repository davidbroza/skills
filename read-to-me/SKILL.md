---
name: read-to-me
description: Turn any text or doc into a spoken audio piece with ElevenLabs. Optional LLM rewrite in a dry British-wit style (--witty), NPR-style news (--news) or verbatim (--neutral). Can play locally, save to disk, or publish as an episode to your own podcast feed. Use when the user says "read this to me", "narrate this doc", "say this out loud", "publish this as an episode", or invokes /read-to-me with a file or stdin.
---

# read-to-me

Generic TTS skill. Any text → optional rewrite in a chosen style → ElevenLabs → play / save / publish.

For a two-host dialogue, use `make-podcast` instead.

## Setup

```bash
export ELEVENLABS_API_KEY=...       # required
export READ_TO_ME_VOICE_ID=...      # default ElevenLabs voice ID (or pass --voice)
export OPENROUTER_API_KEY=...       # for --witty / --news rewrites
# optional
export OPENROUTER_MODEL=moonshotai/kimi-k2
export LISTENER_NAME=...            # witty mode greets you by this name
export PODCAST_INGEST_URL=https://<your-feed>/api/ingest-episode
export PODCAST_INGEST_SECRET=...
```

Keep keys in a secret manager or shell env, never in the repo. Requires `bun`.

## Quickstart

```bash
./narrate.sh --file path/to/doc.md --play
echo "Production is on fire" | ./narrate.sh --witty --output /tmp/fire.mp3
./narrate.sh --file post-mortem.md --witty --publish "Why the auth system died on Tuesday"
```

## Modes

| flag | what it does |
|---|---|
| `--witty` (default) | LLM rewrite in a BBC Radio 4 × Red Dwarf dry-British-sarcasm style. Ends with a quip. |
| `--news` | NPR-style straight news delivery. No jokes. |
| `--neutral` | Read input verbatim. No rewrite, no markdown cleanup. |

## Flags

| flag | default | notes |
|---|---|---|
| `--text "..."` | from stdin | inline input |
| `--file <path>` | — | read from file |
| `--voice <id>` | `$READ_TO_ME_VOICE_ID` | any ElevenLabs voice ID |
| `--speed <n>` | `1.08` | 0.7–1.2 |
| `--model <id>` | `eleven_multilingual_v2` | `eleven_turbo_v2_5` for speed over prosody |
| `--output <path>` | `$TMPDIR/read-<ts>.mp3` | where to save |
| `--play` | off | `afplay` the result (macOS) |
| `--publish "<title>"` | off | POST to `$PODCAST_INGEST_URL` |
| `--slug <slug>` | derived from title | episode slug |
| `--show <name>` | — | optional show field |
| `--no-rewrite` | — | skip the rewrite in any mode |

## Publishing

`--publish` sends `multipart/form-data` (`title`, `slug`, `description`, `pub_date`, `show`, `audio`) with `Authorization: Bearer $PODCAST_INGEST_SECRET` and expects `{ "url": "..." }`. Point it at your own endpoint that stores the MP3 and adds it to an RSS feed. Re-publishing the same slug should overwrite.

## Layout

```
read-to-me/
├── SKILL.md
├── narrate.sh            # entry point
└── scripts/
    ├── narrate.ts        # pipeline (rewrite → tts → write/play/publish)
    ├── rewrite.ts        # OpenRouter with style prompts
    ├── tts.ts            # ElevenLabs caller
    └── publish.ts        # POST to your ingest endpoint
```

## Extending

Add styles to `STYLES` in `scripts/rewrite.ts`. Each style is just a system prompt; keep them sharp and opinionated rather than a flat "professional" mode.
