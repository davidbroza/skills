---
name: synthetic-persona-exploratory-qa
description: >-
  Use when asked for synthetic persona exploratory QA (often called synthetic
  usability tests) on a web app: persona-driven scripted walkthroughs on phone
  and desktop covering core flows and corner cases, reporting bugs, friction and
  screenshots without changing code. Not a substitute for usability testing with
  real people.
---
# Synthetic persona exploratory QA

Scripted, persona-driven walkthroughs of a web app that surface bugs and friction the way real users would hit them. This is QA, not real usability testing: it can't tell you what actual users think. Report only; never fix or deploy during the run.

## 1. Scope
- Identify the app URL (prod or local preview) and the main jobs users do.
- Pick 2-4 personas with a context each (e.g. 'in the gym, one hand, bad signal', 'planning on desktop', 'new user invited by a friend').
- List scenarios per job: happy path first, then corner cases.

## 2. Safety
- Never touch real user data. Use throwaway test accounts or a local/dev env, and clean up afterwards.
- Don't send real emails/invites to real people.

## 3. Corner-case checklist
- Cancel / discard midway; abandon and return (reload, back, closed tab, new deploy).
- Edit, delete, swap, reorder, add items mid-flow.
- Empty submits; zero, negative, decimal, huge, unicode/long values.
- Rapid double taps / double submits.
- Two tabs or devices at once; session expiry.
- Offline or slow network where the context makes it likely.
- Permission changes mid-flow; acting for another user.
- Switching account/profile/context mid-flow.

## 4. Run
- Headless Playwright. Primary viewport phone 390x844 (touch), also desktop 1280x800.
- Per step note: taps needed, waits over ~300 ms, confusing copy, missing affordances (no undo, no confirm on destructive actions), console errors, failed requests.
- Screenshot every failure and notable friction point into a dated review folder.

## 5. Report
- Bugs ranked by severity (data loss > blocks task > wrong data > cosmetic), with repro steps and screenshots.
- Top usability issues, each with a concrete suggested fix.
- What works well (short).
- 3-6 most telling screenshots, pass/fail per scenario.
- Confirm test data was cleaned up.

## 6. After
- Offer to turn chosen fixes into specs (BDD spec-first if the project uses it) rather than patching ad hoc.
