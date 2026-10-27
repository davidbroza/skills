---
name: extract-knowledge
description: Extract reusable technical know-how from the current codebase and save it to your notes vault (e.g. Obsidian) as a curated knowledge note plus a raw extraction source. Use whenever the user says "extract knowledge", "extract know-how", "ok extract knowledge", "audit this codebase for know-how", "what should I document from this repo", "save this as kb", or similar. Two modes — audit (list candidate topics) and extract (produce a kb note for a specified topic). Vault path comes from $KB_VAULT. Works from any directory on the machine.
---

# extract-knowledge

Extract reusable technical know-how from any codebase into your notes vault.

## The vault

Set `KB_VAULT` to your vault root (e.g. `export KB_VAULT=<your-vault>`). If it is unset, ask the user for the path once and don't guess.

Outputs always go to two files:

1. **Curated note** — `kb/<category>/<Topic>.md` (concise, in the user's voice, frontmatter, sections, see-also, sources)
2. **Raw source** — `kb/sources/YYYY-MM-DD - <topic> (extracted from <repo>).md` (verbatim audit output, file:line citations, code excerpts)

The curated note is what you find later via search. The source preserves the audit so the curation can be re-checked or extended.

## When to invoke

User says any of:
- "extract knowledge" / "extract know-how" / "ok extract knowledge"
- "audit this codebase for knowledge" / "what should I document from this repo"
- "save [topic X] from this repo as kb"

If the user names a specific topic ("extract how passkeys work here"), go straight to **Extract mode**. If they ask "what's worth extracting?", run **Audit mode** first.

## Mode 1: Audit (list candidate topics)

Walk the repo and present 5–10 candidate knowledge items. Don't extract anything yet.

Procedure:
1. Identify the repo (use `pwd` and `git remote -v`).
2. Skim: `package.json`, `Cargo.toml`, `README.md`, top-level folders, key config files (`wrangler.*`, `.github/workflows/*`, `tauri.conf.*`, `drizzle.config.*`).
3. List candidates as a compact table:

```
| # | Topic | One-line | Where it lives |
|---|---|---|---|
| 1 | Passkeys (WebAuthn via better-auth) | Server delegates the flow; you supply RP + DB shape | apps/web/src/server/auth.ts, packages/db/migrations/0018_*.sql |
| 2 | Drizzle + D1 serverless setup | Schema, migrations, query patterns on Cloudflare Workers | packages/db/, wrangler.jsonc |
| ... |
```

4. Ask the user which item(s) to extract. Multiple is fine — extract them in parallel.

Bias toward **reusable patterns** (auth flow, build pipeline, data ingest) over **product-specific business logic**. The kb is for "how to do X again on a future project", not "how this app works".

## Mode 2: Extract (produce kb note + source)

Given a specific topic, produce both files.

### Step 1: Investigate

Read the relevant code paths thoroughly. Capture:
- Library / dependency versions (from package.json, Cargo.toml)
- Config snippets (wrangler.*, .conf.*, .toml)
- Key code excerpts (5–15 lines each, with file:line refs)
- Data shape (DB schema, JSON shapes, type definitions)
- Workflow YAML (CI, release, etc.)
- Gotchas / edge cases the implementation handles

For large codebases, delegate to an Explore agent with a tight, specific prompt (see "Briefing the Explore agent" below). Otherwise read directly.

### Step 2: Pick destinations

Curated note destination — match the topic:
- `kb/programming/` — most technical patterns (auth, DB, builds, mapping, etc.)
- `kb/leadership/` — leadership / team / process
- `kb/obsidian/` — Obsidian itself
- New subfolder like `kb/<domain>/` — only if multiple notes share a domain (geotechnical, ML, design)

File name: short, capitalized, descriptive. Examples that work: `Passkeys.md`, `Tauri + GitHub Actions desktop publishing.md`, `Drizzle Cloudflare D1.md`. Avoid version numbers in the title — versions belong in frontmatter or inline.

Source destination — `kb/sources/YYYY-MM-DD - <slug> (extracted from <repo>).md`. Date is when extracted. `<slug>` is short, lowercase. `<repo>` is the project name, not the path.

### Step 3: Write the source file

Verbatim extraction with file:line citations. Structure:

```markdown
# <Topic> — extracted from <repo>

> Raw audit of `<repo path>` on YYYY-MM-DD. Curated takeaways live in [[<Topic>]].

## <Subtopic 1>

File: `<path>:<line range>`

```<lang>
<code excerpt>
```

[Brief technical commentary]

## <Subtopic 2>
...

## Gotchas
1. ...
2. ...
```

Include enough detail that you can revisit the audit later without re-reading the codebase. ~600–1200 words.

### Step 4: Write the curated note

In the user's voice. Tight, opinionated, copy-paste-able. Structure:

```markdown
---
created: YYYY-MM-DD
type: knowledge
tags: <3-5 lowercase tags>
---
# <Topic>

> One-line takeaway — what this is and why it matters.

## <Section: the key insight>

[Plain prose. Why this matters. What surprises someone new.]

## <Section: minimal code>

```<lang>
[The shortest code that demonstrates the pattern]
```

## <Section: things YOU still own>
[What the library/framework gives you for free vs. what you must configure]

## Gotchas

- ...
- ...

## See also
- [[<related project hub>]]
- [[<related kb note>]]

## Sources
- [[YYYY-MM-DD - <slug> (extracted from <repo>)]]
```

Aim for ~400–700 words. Tighter than the source. No repetition of file:line refs (those are in the source). Show the most important code patterns, not all of them.

Suggested voice:
- "Don't roll your own X. Use Y."
- "The one config to get right is..."
- "What surprised me..."
- "Gotchas:" (always include)
- Use `>` blockquote for the one-line takeaway at the top

### Step 5: Cross-link

- Add a `[[<Topic>]]` wikilink to the relevant project hub note (`projects/<project>.md`) under "Related know-how" or similar.
- Update `kb/Claude Skills.md` if this extraction reveals a new generic pattern worth flagging.

### Step 6: Don't commit

Leave changes uncommitted. The user reviews the notes before committing (or lets their vault's own backup handle it).

## Briefing the Explore agent (for big repos)

Tight, specific prompts produce useful audits:

```
Investigate <topic> in <repo at /path>.
I need this as reusable know-how — assume I'll forget the details in 3 months.

Report on:
1. <specific question>
2. <specific question>
3. <code excerpt request>
...
N. **Gotchas** — anything subtle the implementation works around

Include real code excerpts (5–15 lines each) with file:line refs.
Aim for ~700 words. Technical, dense, no fluff.
```

Bad prompts produce summaries. Good prompts produce file:line citations.

## What to extract vs skip

**Extract:**
- Auth flows, security patterns
- Build/deploy/CI pipelines
- DB schema + query patterns
- External API integrations (with auth, rate limits, gotchas)
- Performance optimizations
- Distinctive UX patterns
- Data ingestion / ETL
- Background jobs, queues, schedulers

**Skip:**
- Pure business logic ("how the pricing rules work")
- One-off bug fixes
- Code style / formatting choices
- Things obvious from reading the code in 30 seconds

## Vault structure reference

Adapt to your vault. A layout that works well:
- `projects/` — one hub note per project
- `kb/` — knowledge base (programming/, leadership/, etc., plus `sources/`)
- `inbox/` — free-text capture
- `archive/` — old stuff

If the vault has a `templates/knowledge.md`, follow it for the curated note.

## Output

After extracting, give a 2-line confirmation:
- Curated note: `kb/programming/<Topic>.md`
- Source: `kb/sources/YYYY-MM-DD - <slug> (extracted from <repo>).md`

Plus the wikilink path so the user can jump straight to it: `[[<Topic>]]`.
