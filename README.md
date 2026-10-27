# skills

Public, reusable agent skills by [David Broza](https://www.davidbroza.dev), shared explicitly. Each folder has a `SKILL.md` (YAML frontmatter plus instructions) that works with Claude Code, Cursor and other agents that support skills.

| Skill | What it does |
|---|---|
| [bdd-refine](bdd-refine/SKILL.md) | Turns a rough product or feature idea into reviewed Gherkin `.feature` specs before any code is written. |
| [bdd-spec-first](bdd-spec-first/SKILL.md) | Builds the feature from those specs: tests go red, then the LLM writes the steps and code until they're green. The LLM never edits the specs to make them pass. |
| [cloudflare-app-stack](cloudflare-app-stack/SKILL.md) | Opinionated setup for new apps on Cloudflare Workers (TanStack Start, Drizzle + D1, Better Auth, AI Gateway, MCP), asking for missing details before building. |
| [extract-knowledge](extract-knowledge/SKILL.md) | Audits a codebase for reusable know-how and writes a curated note plus raw source into your notes vault. |
| [make-podcast](make-podcast/SKILL.md) | Turns any text into a two-host podcast episode (witty host + straight journalist) with ElevenLabs and ffmpeg. |
| [post-mortem](post-mortem/SKILL.md) | Writes a blog post-mortem after a hard bug and feeds the lesson back into your agent tooling. |
| [read-to-me](read-to-me/SKILL.md) | Narrates any text with ElevenLabs, optionally rewritten in a witty or news style; play, save or publish. |
| [skillchart](skillchart/SKILL.md) | Audits all installed agent skills and shows their context cost in an HTML dashboard. |

`bdd-refine` and `bdd-spec-first` work as a pair: run `bdd-refine` first, then `bdd-spec-first`.

## Install

With the [`skills`](https://github.com/vercel-labs/skills) CLI:

```bash
npx skills add davidbroza/skills                          # interactive: pick skills and agents
npx skills add davidbroza/skills -g -y -a claude-code -a cursor   # all skills, globally
npx skills add davidbroza/skills --skill bdd-refine       # just one
```

Tested Oct 2026: with `-g -a claude-code -a cursor` it installs into `~/.agents/skills/` and symlinks into `~/.claude/skills/` (Cursor reads `~/.agents/skills`). Plain `-g -y` with no `-a` tries every agent it knows and prints harmless errors for agents that don't support global installs (e.g. PromptScript); the skills still land in `~/.agents/skills/`.

Manual:

```bash
git clone https://github.com/davidbroza/skills ~/src/skills
cp -r ~/src/skills/<skill> ~/.claude/skills/     # or ~/.cursor/skills/, ~/.agents/skills/
```

Background: [Spec first, then let the AI write it: BDD for an MCP server](https://www.davidbroza.dev/writing/bdd-mcp-servers).

## License

MIT
