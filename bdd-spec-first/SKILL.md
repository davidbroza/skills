---
name: bdd-spec-first
description: >-
  Use whenever building or changing a feature in an app, API or MCP server with
  an LLM writing the code: the human-owned Gherkin .feature spec comes first,
  then the LLM implements until the scenarios pass.
---
# BDD spec-first feature development (LLM-driven)

The default way to build or change any feature. The human owns the spec (.feature files). The LLM owns the code (step definitions and implementation). This works alongside TDD unit tests: BDD scenarios describe behaviour from the user's side, and unit tests still cover pure logic.

## Loop
```mermaid
flowchart LR
  H[Human writes/edits .feature] --> L[LLM writes missing steps]
  L --> R[Run suite: red]
  R --> C[LLM changes code]
  C --> T{All green?}
  T -- no --> C
  T -- yes --> D[Review stories, commit, deploy]
```

## Steps
1. **Spec first.** Write or update a `features/<area>/<name>.feature` file in plain user language (Feature / Scenario / Given / When / Then / And). Given is the starting state, When is the single action, Then is the observable result. Use one feature file per area and keep scenarios small and concrete, with real example values. Cover the happy path, edge cases, permissions and clarification flows.
2. **Trim before confirming.** Aim for confident coverage with as few scenarios as possible. For each scenario ask: would a real bug slip through if I deleted it? If another scenario already catches the same bug, merge or drop it. Merge closely related edge cases into one scenario (e.g. duplicate name plus case-insensitive match), drop scenarios fully implied by a broader one (e.g. per-entity isolation when a general isolation scenario exists), and keep one scenario per distinct behaviour or failure mode. Leave implementation details such as feature flags, rollout and internals out of the spec. A typical feature lands at roughly 6 to 12 scenarios; more than that means the feature should split or the spec is restating itself.
3. **Get the spec confirmed with one click.** Show the trimmed scenarios to the user before coding when the behaviour is new or ambiguous. Send the Gherkin as a message, then ask for approval with clickable buttons when the chat client supports them, never a prose "do you approve?". Use options like "Approve" (primary, value "Approve the spec, build it"), "Trim it more", and allow a typed answer for requested changes. Put any open decisions as their own options or steps on the same card. When the chat has no buttons, end with a single clear "Reply approve to build" line.
4. **Lock the spec.** The LLM must never edit, weaken or delete scenarios to make them pass. Only the human changes `.feature` files, or the LLM does so with explicit approval.
5. **Run the suite.** Undefined steps and failing scenarios become the to-do list.
6. **Write step definitions.** Reuse existing sentences first and add new ones sparingly. Keep the step dictionary small and generic, with placeholders like `{int}`, `{string}` and doc-string JSON. Steps do real work: Given sets up state through the real API or tools, When makes the real call, Then asserts with `expect`.
7. **Implement** the feature until every scenario is green and the rest of the suite stays green, which guards against regressions.
8. **Verify and ship.** Run the full suite plus unit tests, deploy, run a smoke check, and report the passing counts (scenarios, not just steps). Optionally break the code on purpose once to confirm the right scenarios go red.

## Changing or removing a feature
- To change behaviour, edit the scenario or add a new one first. It goes red, then the code changes until it's green.
- To remove behaviour, delete its scenarios, then remove the code.
- The `.feature` files are always the living spec of what the app does today.

## Harness pattern (TypeScript, Vitest)
- Use `@amiceli/vitest-cucumber`: `loadFeature()` parses the file and `describeFeature()` runs each scenario as a Vitest test. It rejects a scenario that repeats an identical keyword+step line, so when drafting, vary the keyword (e.g. `And` for a repeated check) before showing the spec for approval.
- Keep a `support/world.ts` holding the per-run state: an isolated test DB, a fresh user per scenario, token minting and a call helper that invokes the real handler in-process (no network).
- A single `*.steps.ts` loops over every `.feature` file and registers each sentence for Given/When/Then/And/But.
- Use a separate Vitest config (e.g. `vitest.bdd.config.ts`), a `test:bdd` script, and a JUnit report in CI.
- Never touch production data. Use a separate DB or an is_test flag, with cleanup.

## For MCP servers and AI apps
- Phrase scenarios as "my AI calls \"tool\" with: {json}", testing the tool contract, auth scopes, clarification questions and output shape.
- BDD tests the tools, not the LLM's choices. Add LLM evals (natural prompts, checking tool selection and arguments) as a separate layer.
