# skills

Public, reusable agent skills by [David Broza](https://www.davidbroza.dev), shared explicitly. Each folder has a `SKILL.md` (YAML frontmatter plus instructions) that works with Claude Code, Cursor and other agents that support skills.

| Skill | What it does |
|---|---|
| [bdd-refine](bdd-refine/SKILL.md) | Turns a rough product or feature idea into reviewed Gherkin `.feature` specs before any code is written. |

## Use

Copy a skill folder into your agent's skills directory, e.g. `~/.claude/skills/`.

Background: [Spec first, then let the AI write it: BDD for an MCP server](https://www.davidbroza.dev/writing/bdd-mcp-servers).

## License

MIT
