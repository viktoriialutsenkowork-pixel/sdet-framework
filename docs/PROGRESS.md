# Learning Progress

28-day plan: Playwright, TypeScript, Docker, CI/CD and AI-assisted testing.
Detailed interview answers: `docs/interview-qa.md` · Commands: `docs/commands.md`

## Overview

| Day | Topic | Status | Warm-up | Interview |
|---|---|---|---|---|
| 1 | First Playwright tests | ✅ Done | — | 10/25 |
| 2 | Debugging tools, locators on a real app, TypeScript types | ✅ Done | 21/25 | 17/30 |
| 3 | Async JavaScript, network waits, ESLint | ✅ Done | 18/25 | 20/30 |

## Open weak spots
- Interview answers: precise mechanisms ("the listener only sees later responses", "`Promise.all` only waits"), numbers as evidence
- Investigate output that contradicts a prediction or label, instead of reporting it as is
- Changing conditions: check the result for every possible input (`!== undefined` vs `=== true`)
- `as const` vs plain union: *when* to use each
- Debugging tools: remember all four (UI mode, `--debug`, `page.pause()`, trace viewer)

## Closed weak spots
- `forEach` + `async`, missing `await` (Days 1–3)
- `async` functions run synchronously until the first `await` (Day 3)
- Array methods (`map`, `flatMap`, `filter`, `toSorted`) (Days 2–3)

## Process rules
- Run `npm run lint`, `npm run typecheck` and `npx playwright test` before every submission, and include the output
- Break each new assertion on purpose once, to prove it can fail
- No exercise scaffolding, skipped tests or `page.pause()` in committed code
- Test names describe behavior, not exercise numbers
- Commit at the end of each exercise or cycle; one kind of change per commit

---

## Day 1 — First Playwright tests (16–17 Nov 2026)

### Done
- Playwright + TypeScript setup, scripts (`test`, `test:ui`, `typecheck`)
- `tests/todo.spec.ts`: add single todo, order of todos, delete, filters
- 3 review rounds → approved
- Interview drill

### Key learnings
- Every action and assertion needs `await`
- Locators are recipes, re-resolved on every use (no stale elements)
- Locator priority: role → label → placeholder → text → test ID → CSS/XPath
- Non-unique locators are fine for list assertions; scope them (`filter`) before acting
- `toHaveText([...])` checks count, order and text in one retrying assertion
- `filter({ hasText })` is a case-insensitive substring match → use `has` + `exact: true`
- Assert on the element that has the state (`toBeChecked` on the checkbox, not the row)
- Prefer user-visible state over CSS classes in assertions
- Helpers take `page` and hide the "how"; tests describe the "what"
- Guard assertions before acting make setup failures easy to spot

### Error lessons
- Missing `await`: the test ends while actions still run → "Test ended" / "page closed". The error doesn't point at the cause, and it can even pass by timing.
- Wrong expected text: the assertion retried for 5 s, then failed with the locator, call log and an `error-context.md` page snapshot → a good, debuggable failure.

### Review findings
- Tests without assertions, skipped tests left in the file, duplicated data
- Four assertions instead of one array assertion, misleading test name, `!` assertion
- Weak single-todo assertion, `toHaveClass` instead of user-visible state
- `toBeChecked()` on a `<li>` instead of the checkbox; submitted without running tests

### Scores
- Interview: 10/25 (waits 3 · locator vs handle 1 · getByRole 3 · forEach async 1 · senior 2)

---

## Day 2 — Debugging tools, locators on a real app, TypeScript types (17–22 Nov 2026)

### Done
- Debugging tools: UI mode, trace viewer, Inspector, `page.pause()`
- TodoMVC: clear completed test, data-driven filter tests, counter test, plain union `Filter` type
- Toolshop: search, category filter, add to cart, data-driven price sorting
- Helpers: `searchFor`, `expectOnlyProductsMatching`, `sortBy`, `getAllProductPrices`
- Deleted the generated `example.spec.ts`

### Key learnings
- Never fix a failure before the trace explains it
- Old-state trap: an assertion must not be able to pass against the page *before* the action
- Read changing values inside `expect.poll`; a value read once goes stale
- Shape polled values for the failure message: return the problems, expect `[]`
- Click by what makes an element right (its name), not by position (`.first()`)
- Assert only on stable parts of text ("found for 'x'", not "products found")
- Union types catch typos at compile time; `as const` only when the values are also needed at runtime
- Data-driven tests: one generated test per case, unique names, a different behavior per case
- `forEach` discards return values (use `map`); `sort()` sorts as text and mutates (use a compare function and `toSorted()`)
- Prove stability with `--repeat-each`

### Debug reports
- **Clear completed:** test bug, not app bug — the test expected the wrong item to be removed
- **Cart test race 1:** clicked `.first()` before search results replaced the home page list → poll until only matching products are shown
- **Cart test race 2:** product page URL reached before its content loaded → wait for the level-1 product heading
- **Helper bug:** assumed plural "products found" → assert only on the stable part
- **WebKit freeze:** trace screencast stopped producing frames 40 ms before the click → environment issue, test unchanged
- **Rare search flake:** 1 in ~100 runs, not reproduced in 60 traced runs; suspected slow shared demo → traces now kept on failure (`retain-on-failure`)

### Review findings
- Assertions that couldn't fail (`expect.poll` without `await` or matcher)
- Old-state traps in several tests
- Hard-coded data from today's demo state (result count)
- Comments that didn't match the code
- Submissions without test output

### Scores
- Warm-up: 21/25
- Interview: 17/30 (CI investigation 4 · test ID vs role 3 · union types 3 · `as const` 2 · data-driven 3 · senior 2)

---

## Day 3 — Async JavaScript, network waits, ESLint (22–25 Nov 2026)

### Done
- Cycle 1 (scratch experiments): event loop predictions, sequential vs parallel timing, errors in async code
- Cycle 2: `searchFor` and `sortBy` wait for their API responses; `beforeEach` waits for the initial product load; `expectOkResponse` helper with a clear failure message
- Cycle 3: ESLint with typescript-eslint (typed) and eslint-plugin-playwright; `lint` script; VS Code extension
- Config: `workers: process.env.CI ? 1 : 4`; TypeScript pinned to 6 for typescript-eslint
- App bug found and reported (overlapping product requests)

### Key learnings
- Order of execution: synchronous code → microtasks (promise callbacks, code after `await`) → macrotasks (timers)
- An `async` function **starts immediately and runs synchronously until its first `await`**
- Without `await` you get the **promise**, not its value; a `try/catch` without `await` catches nothing
- `await` in sequence = sum of durations; `Promise.all` = longest one (622 ms vs 314 ms). `Promise.all` only **waits**; `await` inside its array makes it sequential
- `Promise.all` keeps input order and fails fast; `Promise.allSettled` waits for all (cleanup)
- Always `throw new Error(...)`, never a string: errors carry a stack trace; `as Error` checks nothing at runtime
- `waitForResponse`: start listening **before** the action, await after. The listener only sees later responses
- Predicate decides **which** response; assertion decides **whether it's good** (status in the predicate turns errors into timeouts)
- Compare URL paths (`new URL(url).pathname`), not full URLs, so tests survive environment changes
- A response wait and a UI assertion answer different questions; together a failure points to the right layer
- Too many workers can overload the machine: many timeouts at once = environment signal
- Peer dependency conflicts: read the version range; don't `--force`
- Type checker, linter, tests and review each catch different bugs; tools don't know what you meant

### Debug reports
- **Sort flake (1/150):** trace showed the initial `/products` response (352 ms) arriving 11 ms after the sort response and overwriting the sorted list. Same race explains Day 2's rare search flake. Fix: wait for the initial load in `beforeEach`; `sortBy` waits for its own response
- **Firefox timeouts (4/150, same 30 s window):** API responded in 50–80 ms, but page creation took 3–14 s and the app's JS 11–16 s → machine overloaded by 11 workers. Fix: 4 workers → 150/150 green, only ~20 s slower
- **Exercise 2.2:** listener moved after the click still passed, because the demo's 200–300 ms responses hid the race. It would fail in a faster environment

### Bug report (app)
- **Title:** Product list shows unsorted results when sorting while the page is still loading
- **Steps:** throttle network ("Slow 4G"), open home page, select "Price (High - Low)" before products appear
- **Expected:** sorted by price high to low · **Actual:** default unsorted list
- **Cause:** overlapping `QUERY /products` requests; the older initial-load response arrives last and overwrites the sorted list; the app doesn't ignore or cancel outdated requests
- **Impact:** wrong results on slow connections; also affects search · **Frequency:** ~1/150 automated runs; reliable with throttling

### Lint decisions
- `no-unsafe-member-access` on `postDataJSON()?.sort` → kept the rule; check the raw body for `"sort"` instead
- `expect-expect` → `assertFunctionPatterns: ['^assert.*', '^verify.*', '^expect.*']`, raised to error
- `no-wait-for-timeout`, `no-page-pause` → raised from warning to error
- `no-conditional-in-test` doesn't look inside nested functions (poll callback)

### Review findings
- `await` inside the `Promise.all` array made it sequential
- `return new Error(...).message` instead of `throw`; then `throw new Error(...).message` (a string)
- Status check inside the `waitForResponse` predicate
- `includes('"sort"') !== undefined` — always true; tools didn't catch it
- Reporting output that contradicted predictions or labels without investigating

### Warm-up corrections
- Four debugging tools: UI mode, `--debug` / Inspector, `page.pause()`, trace viewer
- `sort()` without a compare function compares as strings, even for numbers → `sort((a, b) => a - b)`; the non-mutating version is `toSorted()`

### Scores
- Warm-up: 18/25 (debug tools 2 · old-state trap 3 · read inside poll 5 · `.first()` after search 4 · sort 2)
- Interview: 20/30 (await 3 · all vs allSettled 4 · waitForResponse order 3 · network vs UI 3 · linter vs types 4 · senior 3)
