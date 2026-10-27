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

## Use

Copy a skill folder into your agent's skills directory, e.g. `~/.claude/skills/`.

Background: [Spec first, then let the AI write it: BDD for an MCP server](https://www.davidbroza.dev/writing/bdd-mcp-servers).

## License

MIT
