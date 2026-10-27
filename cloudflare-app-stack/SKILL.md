---
name: cloudflare-app-stack
description: Bootstrap, build and deploy a new TypeScript app, tool or PoC on Cloudflare Workers with an opinionated stack (TanStack Start, Drizzle + D1, R2, Durable Objects, Better Auth, AI SDK via AI Gateway, optional MCP endpoint), spec-first with BDD. Use when the user says "build an app", "make a tool", "prototype X", "new Cloudflare app" or "deploy to <subdomain>".
---

# cloudflare-app-stack

An opinionated, free-tier-friendly stack for shipping apps on Cloudflare, plus the order to set it up in.

## Before you start: ask the user

Collect anything below that isn't already known (check the repo, CLAUDE.md/AGENTS.md and memory first). **Ask for whatever is missing and stop until it's answered. Don't guess.**

1. **Domain:** which `<your-domain>` or `<app>.<your-domain>`, and is DNS for it on Cloudflare?
2. **Cloudflare account:** run `wrangler whoami`; if there are several accounts, which one?
3. **App name and slug:** display name and `<app-slug>` (used for the Worker, D1, R2 and repo names).
4. **Auth:** public sign-up, invite-only, or SSO (which provider)? Does the app need an MCP endpoint for external AI clients?
5. **Email:** the sender domain (`<mail-domain>`). It must be onboarded to Cloudflare Email Sending.
6. **AI:** which provider/model, and its keys. Keys go in with `wrangler secret put`, never committed.
7. **Repo:** owner (user or org) and visibility (public/private).

Echo the answers back as a short summary before writing any code.

## Stack

| Layer | Choice |
|---|---|
| Runtime | TypeScript on Cloudflare Workers (Free plan where possible) |
| Data | D1 (relational), R2 (files), Durable Objects with SQLite (per-entity state, realtime) |
| Tooling | wrangler 4 + `@cloudflare/vite-plugin`. No SST. Alchemy only if infra-as-code is wanted. |
| Framework | TanStack Start, pinned, on Vite 8 |
| ORM | Drizzle ORM by default (1.0 RC, pinned). Never raw SQL in app code. |
| Offline | TanStack DB |
| UI | shadcn/ui |
| AI | AI SDK, model called through Cloudflare AI Gateway (provider chosen by the user) |
| Auth | Better Auth for the app; OAuth for MCP clients |
| MCP | Streamable HTTP at `/mcp`, where an AI-client interface is useful |
| Email | Cloudflare Email Sending |
| Heavy compute | Rust compiled to WASM |
| Tests | BDD spec-first (see the `bdd-refine` and `bdd-spec-first` skills) + Vitest unit tests |
| CI | GitHub Actions |
| Deploy | `just deploy` with a smoke check on `/api/health` |

Pin exact versions for anything pre-1.0 or RC (TanStack Start, Drizzle, TanStack DB) and upgrade deliberately.

## Setup steps

1. **Spec first.** Turn the idea into `.feature` files with `bdd-refine`; get them approved before code.
2. **Scaffold** a TanStack Start app on Vite 8, add `@cloudflare/vite-plugin` and `wrangler` 4. Name the Worker `<app-slug>`.
3. **Check limits** before creating resources: `wrangler d1 list` (Workers Free has a D1 database cap).
4. **Create resources:** `wrangler d1 create <app-slug>-db`, `wrangler r2 bucket create <app-slug>-files` (if needed), and declare Durable Objects + migrations in `wrangler.jsonc`.
5. **Drizzle:** schema in `src/db/schema.ts`, `drizzle-kit generate` for migrations, apply with `wrangler d1 migrations apply`.
6. **Auth:** Better Auth with D1 via Drizzle, configured for the answer to question 4. If there is `/mcp`, enable its OAuth provider flow so AI clients can connect.
7. **AI:** AI SDK with the provider routed through an AI Gateway (`<gateway-id>`). Use tool approval for anything that writes.
8. **Secrets:** `wrangler secret put <NAME>` for each key; local dev values in `.dev.vars` (gitignored).
9. **Custom domain:** route `<app>.<your-domain>` to the Worker (`routes` / custom domain in `wrangler.jsonc`).
10. **Tests:** wire the BDD harness from `bdd-spec-first`, add `/api/health`, and add the migrations-import guard test (below).
11. **CI:** GitHub Actions running typecheck, unit and BDD tests on every push and PR. Deploy from CI only if the user wants it; that needs a `CLOUDFLARE_API_TOKEN` repo secret.
12. **Deploy** with `just deploy` and run the checklist.

## Project layout

```
<app-slug>/
  features/              .feature specs (human-owned) + step definitions
  src/
    routes/              TanStack Start routes, incl. api/health
    server/              server functions, auth, mcp
    db/schema.ts         Drizzle schema
    durable/             Durable Object classes
  drizzle/               generated migrations
  wasm/                  Rust crates compiled to WASM (if any)
  tests/                 unit tests, incl. migrations guard
  wrangler.jsonc
  justfile
  .dev.vars              local secrets (gitignored)
  .github/workflows/ci.yml
```

## Conventions

- `.feature` files are the spec. Only the human edits them; the agent makes them pass.
- All DB access goes through Drizzle. No raw SQL strings in app code.
- Every migration is imported/registered: a test lists `drizzle/*.sql` and fails if any isn't in the migrations index (catches "migration exists but never runs").
- No secrets in the repo, logs or screenshots. Use `wrangler secret` and `.dev.vars`.
- Keep `/api/health` cheap; it should also touch D1 so the smoke check proves the binding works.
- Heavy CPU work goes to Rust/WASM, not long JS loops in the Worker.

## justfile sketch

```make
deploy:
    bun run build
    wrangler d1 migrations apply <app-slug>-db --remote
    wrangler deploy
    curl -fsS https://<app>.<your-domain>/api/health
```

## Deploy checklist

Report each item before calling the first production deploy done:

- [ ] All `.feature` scenarios and unit tests pass locally and in CI
- [ ] Migrations-import guard passes; remote migrations applied
- [ ] Secrets set with `wrangler secret put`; nothing sensitive committed
- [ ] Custom domain resolves over HTTPS
- [ ] `/api/health` returns 200 after deploy
- [ ] Auth works for the chosen mode (sign-up / invite / SSO)
- [ ] Email Sending verified from `<mail-domain>`
- [ ] AI calls go through the AI Gateway (visible in its logs)
- [ ] `/mcp` connects from an MCP client via OAuth (if enabled)
- [ ] Workers Free limits checked (D1 count, request/CPU limits)
