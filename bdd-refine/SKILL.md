---
name: bdd-refine
description: >-
  Use when the user has a product or feature idea (rough notes, voice, a
  sentence) and wants it turned into Gherkin .feature specs before any code.
  This is the discovery step ahead of bdd-spec-first.
---
# Idea → .feature files

This turns a rough idea into a small, confirmed set of Gherkin scenarios that an LLM can then implement (see the bdd-spec-first skill). No code is written in this skill.

## 1. Capture the idea
- Restate the idea in one sentence: who it's for, what they want to do, and why.
- Write the user story: `As a <user>, I want <capability>, so that <outcome>`.
- Ask at most 3 sharp questions, and only where the answer changes behaviour.

## 2. Example mapping (quick workshop)
List, in plain text:
- **Rules**: the business rules, e.g. "only the main lift gets warm-ups".
- **Examples** per rule: concrete cases with real values, covering the happy path, edge cases, errors, permissions and empty states.
- **Questions**: unknowns. Resolve them with the user or park them explicitly.
Aim for 2–4 examples per rule. If a feature has more than about 6 rules, split it into separate features.

## 3. Write the scenarios
- Use one `.feature` file per capability, in a folder per area (e.g. `features/<area>/<capability>.feature`).
- Start with `Feature:` and the user story, then one `Rule:` block per rule, holding its scenarios.
- Scenario titles describe the behaviour in user words ("Same as last time"), not the implementation.
- **Given** is the starting state only, **When** is exactly one action, and **Then** is the observable outcome. Use **And** for extras.
- Use concrete values, never "some data".
- Speak from the user's side, with no UI clicks, selectors, endpoints or SQL. For MCP or AI apps, "my AI calls \"tool\" with: {json}" is fine.
- Use `Scenario Outline` with `Examples:` tables for the same behaviour with different values.
- Use `Background:` only for setup shared by every scenario in the file.
- Reuse existing step sentences from the project (grep the steps file) before inventing new ones, and keep phrasing consistent.
- Tag scenarios: `@wip` for new ones, `@slow`, `@auth` and so on, plus `@mvp` for scope.

## 4. Review checklist
- Can a non-developer read each scenario and agree it's right?
- Does each scenario test one behaviour, with one When?
- Are the sad paths and permission cases covered?
- Would the scenario still be true after a UI redesign? If not, rewrite it at the behaviour level.
- Are there no duplicates of existing scenarios?

## 5. Confirm and hand off
- Show the user the feature files, and ideally a short summary per rule. Get explicit approval.
- Once approved, the specs are locked: only the user changes them, or the LLM does with explicit approval.
- Hand off to the bdd-spec-first skill: run red, write the steps, implement until green.
- Park open questions as `# TODO:` comments or issues, not as guessed behaviour.

## Template
```gherkin
Feature: <capability>
  As a <user>
  I want <capability>
  So that <outcome>

  Rule: <business rule>

    Scenario: <behaviour in user words>
      Given <starting state with real values>
      When <one action>
      Then <observable result>
```
