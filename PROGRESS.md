# Learning Progress

## Day 1 — First Playwright tests (16–17 Nov 2026)

### Done
- Playwright + TypeScript setup, scripts (`test`, `test:ui`, `typecheck`)
- `tests/todo.spec.ts`: 4 tests (add single todo, order of todos, delete, filters)
- 3 review rounds → approved
- Interview drill

### Key learnings
- Every action and assertion needs `await`
- Locators are recipes, re-resolved on every use (no stale elements)
- Locator priority: role → label → placeholder → text → test id → CSS/XPath
- Non-unique locators are fine for list assertions; scope them (`filter`) before acting
- `toHaveText([...])` checks count, order and text in one retrying assertion
- `filter({ hasText })` is a case-insensitive substring match → use `has` + `exact: true`
- Assert on the element that has the state (`toBeChecked` on the checkbox, not the row)
- Prefer user-visible state over CSS classes in assertions
- Helpers take `page` and hide the "how"; tests describe the "what"
- Guard assertions before acting make setup failures easy to spot

### Error lessons (Exercise 1.2)
- Missing `await`: test ends while actions still run → "Test ended" / "page closed".
  The error doesn't point at the cause, and it can even pass by timing.
- Wrong expected text: the assertion retried for 5 s, then failed with the locator,
  call log and `error-context.md` page snapshot → a good, debuggable failure.

### Review findings
- Round 1: tests without assertions, skipped tests left in the file, duplicated data,
  four assertions instead of one array assertion, misleading test name, `!` assertion
- Round 2: weak single-todo assertion, `toHaveClass` instead of user-visible state
- Round 3: `toBeChecked()` on a `<li>` instead of the checkbox; submitted without running tests

### Process rules from now on
- Run `npm test` + `npm run typecheck` before every submission, and include the output
- No exercise scaffolding or skipped tests in test files; notes go here
- Test names describe behavior, not exercise numbers

### Weak spots
- Async JavaScript: promises, `forEach` + `async` (→ Day 3)
- Element handle vs locator (new concept)
- Interview answers: answer the full question, make a decision, name the trade-off

### Interview score: 10/25
- Q1 waits: 3 · Q2 locator vs handle: 1 · Q3 getByRole: 3 · Q4 forEach async: 1 · Senior: 2
- Details: `docs/interview-qa.md`