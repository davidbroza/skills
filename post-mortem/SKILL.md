---
name: post-mortem
description: Write a post-mortem article for your blog after a non-trivial bug or debugging session. Publishes at /writing/<slug>, links it from the home page, captures screenshots and terminal logs when relevant, and (required) updates your skills, subagents or project CLAUDE.md with the lesson so it compounds. Use when the user says "write that up", "make a post-mortem", "put this on the blog", "article about the bug", etc.
---

# post-mortem skill

## Before you start: ask once

If not already known (check project CLAUDE.md / memory first), ask the user for:
- the blog repo path (`<blog-repo>`) and how articles are written (MDX, Markdown, TSX routes…)
- the public site URL (`https://<your-blog>`)
- the build/deploy command
Don't guess these. Save the answers where future runs will find them.

## Target paths (adapt to the blog's framework)

- Article: `<blog-repo>/…/writing/<slug>.(md|mdx|tsx)`, served at `/writing/<slug>`.
- Home card: add the post to the home page's writing list (create the section if missing).
- Screenshots: `<blog-repo>/public/writing-<slug>/*.png` (served as `/writing-<slug>/<name>.png`).
- Screenshot spec: `tests/e2e/writing-<slug>-shots.spec.ts` *in the source project's repo*, not the blog.
- The source repo's `.gitignore` should exclude its local screenshots folder.

## Sections (in order, skip what doesn't apply)

1. **Title** — names the impact, not the cause. "One missing paren leaked every user's data." > "A SQL precedence bug."
2. **TL;DR** — one paragraph. What broke, one-line cause, one-line fix.
3. **Symptom** — what the user actually saw. Phone screenshot if UI-facing.
4. **Rabbit holes** — the wrong theories, each named. Do not skip this section — it's the most valuable part for readers.
5. **Smoking gun** — the moment the real cause surfaced. Put log output in a terminal-styled block, not plain code.
6. **Root cause** — code before/after, generated SQL / raw protocol if relevant. Explain why it was invisible in review.
7. **Fix** — the diff. Screenshot of the fixed state if UI-facing.
8. **Preventing the next one** — regression tests + guardrails. Link to the actual test file paths.
9. **Takeaways** — 3–5 numbered lessons, each led by a bold sentence.
10. **Admission** — short paragraph: AI pair (model + what it did + what the human kept). Required on AI-assisted posts.

## Update the tooling — not optional

Do at least one of these before marking the article done:

- **Edit a SKILL.md** with a "watch for this" bullet pointing at the article.
- **Edit a subagent** definition with the rule.
- **Edit project CLAUDE.md / AGENTS.md** with a one-liner anchored to a link or path.
- **Ship a guardrail** — lint rule, test file-scan, Playwright invariant. Link the test file from the article.

Example pointer to drop in:

```
Beware sql`… OR …` inside and() — needs parens.
See <your-blog>/writing/missing-parens.
```

The point of the post isn't only that a human reads it — it's that future agents pick up the lesson mechanically.

## UI primitives

If the blog doesn't already have them, add article-local helpers (don't globalise):

- `PhoneShot` — phone-bezel frame for a mobile screenshot.
- `Terminal` — window chrome + mono font. For logs, tail output, stack traces.
- Plain code blocks for source.

## Screenshots

If the incident is UI-facing, capture with Playwright on the source project:

```ts
test.use({
  baseURL: "https://<your-app>",
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})
```

1. Sign in with a test account (never a real user's), reuse the session cookie via `context.addCookies`.
2. `page.screenshot({ path: "screenshots/<name>.png", fullPage: false })`.
3. Copy into `<blog-repo>/public/writing-<slug>/`.

Never include real user data, emails or tokens in screenshots or logs — redact first.

## Deploy

Run the blog's build and deploy command, then smoke-test:
`curl -sL -o /dev/null -w "%{http_code}\n" https://<your-blog>/writing/<slug>` must be 200; same for each PNG.

## Voice

Short sentences. Concrete nouns. Paste code + logs. First person singular — "I" for the human, "we" or the agent's name when the AI was in the loop. No marketing words.

## Anti-patterns

- **No "rabbit holes" section** → you dropped the most useful part.
- **No tooling update** → the lesson will be re-learned. Go back.
- **Hiding the AI** → if an AI wrote it, say so in the admission.
- **Over-narrativised** → if debugging took 10 theories and 6 hours, don't compress to 3 neat chapters. Call it out.
- **Globalising the helpers** → keep them article-local.
