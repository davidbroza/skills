---
name: synthetic-persona-exploratory-qa
description: >-
  Use when asked to run synthetic usability tests on a web app: persona-driven
  scripted walkthroughs (phone and desktop) covering core flows and corner
  cases, reporting bugs, friction and screenshots without changing code.
---
# Synthetic persona exploratory QA

Scripted, persona-driven walkthroughs of a web app that surface bugs and friction the way real users would hit them. Report only; never fix or deploy during the run.

## 1. Scope
- Identify the app URL (prod or local preview) and the main jobs users do (e.g. plan, log, review, share).
- Pick 2-4 personas with a context each (e.g. 'in the gym, one hand, bad signal', 'planning on desktop at home', 'new user invited by a friend').
- List scenarios per job: happy path first, then corner cases.

## 2. Safety
- Never touch real user data. Create throwaway test accounts (or a local/dev env) and delete or clearly tag them afterwards.
- Don't send real emails/invites to real people; use test inboxes.

## 3. Corner-case checklist
- Cancel / discard midway; abandon and return (reload, back button, closed tab, new deploy).
- Edit, delete, swap, reorder, add items mid-flow.
- Empty submits; zero, negative, decimal, huge, unicode/long values.
- Rapid double taps / double submits.
- Two tabs or two devices at once; session expiry.
- Offline or slow network (throttle) where the context makes it likely.
- Permission changes mid-flow (shared/collaborative features); acting for another user.
- Switching account/profile/context mid-flow.

## 4. Run
- Use headless Playwright. Primary viewport phone 390x844 (touch), also desktop 1280x800.
- For each step note: taps/clicks needed, waits over ~300 ms, confusing copy, missing affordance (no undo, no confirm on destructive action, hidden controls), console errors, failed network calls.
- Screenshot every failure and every notable friction point into a dated review folder.

## 5. Report
- Bugs ranked by severity (data loss > blocks task > wrong data > cosmetic), each with repro steps and screenshot.
- Top usability issues with a concrete suggested fix each.
- What works well (keep it short).
- 3-6 most telling screenshots.
- Pass/fail table per scenario.
- Clean up test accounts/data and confirm it.

## 6. After
- Offer to turn chosen fixes into specs (BDD spec-first if the project uses it) rather than patching ad hoc.
