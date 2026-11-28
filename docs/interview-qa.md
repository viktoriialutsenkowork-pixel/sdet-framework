# Interview Questions & Answers

A running bank of interview questions from each learning day, with my answers, scores and model answers.
Revisit it regularly: cover the model answer, answer out loud, then compare.

**Scoring:** 1 = wrong or missing · 3 = correct core idea, missing depth · 5 = interview-ready

---

## Day 1 — First Playwright tests

### Q1. Why does Playwright rarely need explicit waits, while Selenium needs them everywhere?

**My answer (score 3/5):** Playwright assertions already include auto-wait inside all actions like click and check, so there's no need for extra waits. Before clicking a button it waits for conditions like visibility and whether the element is enabled.

**What was missing:** I mixed up actions and assertions (they wait differently), and I didn't explain the Selenium side.

**Model answer:**
> Playwright waits in two ways. Before every **action** (click, fill, check) it runs **actionability checks**: the element must be attached, visible, stable (not animating), able to receive events, and enabled. **Web-first assertions** like `toHaveText` **retry** until the condition holds or the timeout expires (5 s by default). And locators are resolved fresh on every use. Selenium sends each command immediately with no built-in actionability checks; implicit waits only cover the element being *present*, so teams add explicit waits by hand, and every missing one is a potential flaky test.

**Remember:** actions → actionability checks · assertions → retry until timeout · Selenium → manual waits.

**Retest (Day 2 warm-up, score 5/5):** named both kinds of waiting with their purpose. Small addition: actionability also covers **enabled** (clicks) and **editable** (`fill`).

---

### Q2. What's the difference between a locator and an element handle, and why does it matter for flakiness?

**My answer (score 1/5):** A locator describes how to find an element in the DOM. I hadn't heard of element handles before.

**Model answer:**
> An **element handle** (older API, e.g. `page.$()`) points to **one specific DOM node at the moment it was retrieved**. If the page re-renders that part, which is common in React or Vue apps, the handle points to a node that no longer exists, the same problem as Selenium's `StaleElementReferenceException`. A **locator** is a **recipe** for finding elements and is **re-resolved every time it's used**, so re-renders don't break it. That's why Playwright recommends locators and discourages handles: they remove a whole class of flaky failures.

**Remember:** handle = snapshot of a node (goes stale) · locator = recipe (re-resolved each use).

**Retest (Day 2 warm-up, score 4/5):** "locators are taken again from the DOM every time, so they're not stale." Right idea; use the precise wording: **re-resolved on every use**.

---

### Q3. Why is `getByRole` usually preferred over a CSS selector?

**My answer (score 3/5):** When the DOM changes, the locator most likely stays valid. Classes and attributes change, but the nature of the element doesn't: a textbox stays a textbox with the same placeholder or accessible name.

**What was missing:** user perspective, accessibility, readability, and the trade-off.

**Model answer:**
> `getByRole` finds elements the way **users and assistive technologies** perceive them: by role and accessible name. That makes it:
> - **Resilient:** it survives refactors of classes, structure and styling.
> - **User-focused:** if the locator breaks, the change probably affected real users too.
> - **A free accessibility check:** if you can't find a button by role, it's probably not accessible.
> - **Readable:** `getByRole('button', { name: 'Save' })` states intent; `.btn-primary > span` doesn't.
>
> **Trade-off:** it depends on accessible markup, and accessible names change when copy changes or the app is translated. That's where `getByTestId` is the better choice: an explicit, stable contract with developers.

**Remember:** resilient · user-facing · accessibility check · readable · trade-off: copy and translation → test IDs.

---

### Q4. What goes wrong with `items.forEach(async item => { await ... })`?

**My answer (score 1/5):** `forEach` is asynchronous and can have `async` in it. **(Incorrect.)**

**Model answer:**
> `forEach` **ignores the promises** returned by an async callback; it doesn't wait for them. All iterations start almost immediately, and the code after `forEach` runs **before they finish**. In a test this means steps run out of order or overlap, the test can end while actions are still running ("Test ended", "Target page has been closed"), and errors inside can go unreported. Use `for...of` with `await` for sequential steps, or `Promise.all` when you deliberately want parallel work, which is rarely correct for UI actions on the same page.

**Example:**
```ts
// ❌ Wrong: forEach does not wait
items.forEach(async (item) => {
  await input.fill(item);
  await input.press('Enter');
});

// ✅ Right: sequential
for (const item of items) {
  await input.fill(item);
  await input.press('Enter');
}
```

**Remember:** `forEach` doesn't wait · use `for...of` · `Promise.all` only for intentional parallelism.

**Retest (Day 2 warm-up, score 5/5):** rewrote `forEach(async ...)` correctly as `for...of` with `await`.

---

### Q5. Why is `await expect(locator).toHaveText(['A', 'B'])` better than separate count and per-item assertions?
*(Added from Day 2 warm-up)*

**My answer (score 4/5):** It checks count, values and exact order at the same time.

**Model answer:**
> With an array, `toHaveText` checks **the number of elements, the text of each one, and their order** in a single assertion. It **retries as a whole** until everything matches or the timeout expires, so it's robust while the list is still rendering. Separate assertions each retry on their own and can pass against different moments of a changing list. When it fails, the message shows the **full expected vs actual list**, which makes the problem obvious, and the test is shorter and states its intent.

**Remember:** count + text + order · one retry for the whole list · clear diff on failure.

---

### Q6. What does `filter({ hasText: 'Item 1' })` match, and why can that be a problem?
*(Added from Day 2 warm-up)*

**My answer (score 3/5):** "Item 1 other", "Item10", anything that starts with "Item 1".

**What was missing:** it's not "starts with": it matches **anywhere** in the text, and **ignores case**.

**Model answer:**
> A string passed to `hasText` is a **case-insensitive substring match anywhere** in the element's text. So `'Item 1'` also matches "Item 10", "My item 1" and "ITEM 1 urgent". Tests work with today's data and break silently when someone adds more data, or worse, act on the wrong element. For an exact match, filter with `has` and an exact text locator:
> ```ts
> page.getByRole('listitem')
>   .filter({ has: page.getByText('Item 1', { exact: true }) });
> ```
> or pass a regular expression anchored at both ends, like `/^Item 1$/`.

**Remember:** substring · anywhere · case-insensitive · use `exact: true` or an anchored regex.

---

### Senior question: One long test or several short ones?

**Scenario:** one test checks completing a todo, the counter, and two filters. If the counter breaks, the filter checks never run. Splitting means repeating setup in four tests. Which would you choose, and what would change your mind?

**My answer (score 2/5):** Use soft assertions, so if an assertion fails, data is collected but the test doesn't fail immediately and the other assertions still run.

**Corrections:**
- A soft assertion failure **still fails the test**, just at the end instead of immediately.
- Soft assertions don't help when an **action** fails (for example, the filter link can't be clicked). The test stops there.
- I didn't make a decision or say what would change it, which is the actual senior skill here.

**Model answer:**
> For this app, I'd split it into focused tests. Setup costs about a second and needs no login or data, so repeating it is cheap, and each failure points to exactly one broken behavior. I'd switch to one longer flow test if setup were expensive (login, seeding data through an API), or if the **sequence itself** is what I need to verify, like a checkout journey. Within a single test, I'd use `expect.soft` for several independent checks on the same screen, so one failure doesn't hide the others.

**Remember:** decide based on **setup cost** and **failure clarity** · flows when the sequence matters · `expect.soft` for multiple checks on one state.

---

## Day 2 — Debugging, locators on a real app, TypeScript types

*Day 2 warm-up results are recorded as retests on Q1, Q2 and Q4, and as new questions Q5 and Q6 above. Warm-up total: 21/25.*

### Q7. A test passes locally but fails in CI. Walk me through how you'd investigate it.

**My answer (score 4/5):**
1. Make sure CI keeps traces on failure, to have evidence of the real reason.
2. Read the trace. Possible causes: slow environment (more memory or configuration needed), too many parallel runs/shards at once, tests sharing data or environment state, configuration differences between local and CI.
3. Add more debug logging to the report if needed.

**What was missing:** first establishing whether the failure is **consistent or intermittent**; **reproducing CI conditions locally**; checking **recent changes**; and the full list of local-vs-CI differences.

**Model answer:**
> 1. **Collect evidence first:** traces, screenshots, videos and logs from the failing CI run, and retain traces on failure if they aren't already. I don't change anything until I know why it failed.
> 2. **Consistent or intermittent?** Look at the failure history. Always failing in CI points to an **environment difference**; sometimes failing points to **timing or shared state**.
> 3. **Read the trace:** first red step, before/after snapshots, call log, console and network tabs: an app error, a slow or failed API call, or a test acting too early?
> 4. **Compare environments:** OS (Windows locally, Linux in CI), browser versions, headless mode, viewport, timezone and locale, environment variables, base URL, test data, number of workers, CPU/memory.
> 5. **Reproduce CI conditions locally:** same Docker image, same worker count, `--repeat-each` to surface flakiness.
> 6. **Check what changed:** recent commits to the app, the tests or the pipeline.
> 7. **Fix the cause, not the symptom:** no blind waits or retries. Then prove the fix with repeated runs, and note the cause in the ticket.
>
> Typical causes: tests sharing data or state under parallel runs, race conditions that only show on slower CI machines, environment config differences, and unstable shared environments.

**Remember:** evidence → consistent or intermittent → trace → compare environments → reproduce → recent changes → fix the cause and prove it.

**From my own experience (Day 2):** a cart test failed from three different causes: a race condition (clicked before search results replaced the list), a product page that wasn't loaded yet, and an environment flake (WebKit stopped rendering). Each needed different evidence and a different response.

---

### Q8. When would you choose `getByTestId` over `getByRole`?

**My answer (score 3/5):** When `getByRole` isn't possible because there's no accessible name, or when the team's standard is to use test IDs.

**What was missing:** concrete situations beyond "no accessible name", and the trade-off.

**Model answer:**
> I default to `getByRole`, and use `getByTestId` when:
> - **The element has no meaningful role or name**, such as a count badge or a status label (in Toolshop: `cart-quantity`, `search-result-count`).
> - **The accessible name is unstable:** the app is translated, the text is dynamic, or the copy changes often.
> - **Many similar elements repeat** and a role alone is ambiguous, like product cards in a grid.
> - **The team has agreed on test IDs** as the testing contract.
>
> **Trade-off:** test IDs are stable but **not user-facing**, so a test passes even if the element is inaccessible or mislabeled. They're also a contract: developers must know not to remove or rename them. If I can't find an interactive element by role, I also report it as a possible accessibility problem.

**Remember:** no role or name · unstable or translated text · ambiguous repeats · team contract · trade-off: not user-facing.

---

### Q9. What is a union type, and how does it make test code safer than plain strings?

**My answer (score 3/5):** A union type defines a specific list of allowed values. If a variable has a union type and you use a value outside the list, you get an error.

**What was missing:** *when* the error appears (compile time), and the practical benefits.

**Model answer:**
> A union type like `type Filter = 'All' | 'Active' | 'Completed'` restricts a value to a fixed set. Compared with plain `string`:
> - **Errors appear at compile time**, in the editor, before the test runs. A typo like `'Actve'` fails the typecheck instead of producing a confusing failure in CI.
> - **Autocomplete** suggests the allowed values.
> - **Exhaustiveness:** the compiler checks that a `switch` handles every value.
> - **Safer refactoring:** if a value is renamed or removed, every place that uses it is flagged.
>
> **Limit:** types are erased at runtime, so a union doesn't validate data from outside the code, such as API responses. That needs runtime validation.

**Remember:** compile-time error · autocomplete · exhaustive switch · refactoring safety · erased at runtime.

---

### Q10. What does `as const` do, and when is it worth using instead of a plain union?

**My answer (score 2/5):** It makes an array readonly, so it can't be changed, and then you can use it for looping in your code.

**What was missing:** the key effect, **keeping the exact literal values** so a type can be derived from the array. Looping works with any array; that's not what `as const` adds.

**Model answer:**
> `as const` does two things: it makes the value **readonly**, and it keeps the **exact literal values** instead of widening them. `['All', 'Active']` is inferred as `string[]`, but `['All', 'Active'] as const` is `readonly ['All', 'Active']`. That makes it possible to **derive a union type from the array**:
> ```ts
> const FILTERS = ['All', 'Active', 'Completed'] as const;
> type Filter = (typeof FILTERS)[number]; // 'All' | 'Active' | 'Completed'
> ```
> It's worth it when I need the values **both at runtime** (to loop over them, for example to generate tests) **and as a type**: one source of truth, so they can't drift apart. If I only need the type, a plain union is simpler.

**Remember:** readonly + literal values · derive the type with `(typeof X)[number]` · use when you need values at runtime **and** the type · otherwise a plain union.

**From my own experience (Day 2):** I used `as const` for filters, then noticed the array was never used at runtime, so I switched to a plain union.

---

### Q11. What are the benefits and risks of data-driven tests?

**My answer (score 3/5):** Less code, but many scenarios: write the code once and get, say, 10 tests from 10 cases. The risk is misusing them to test the same scenario with different data; each case should expect a different result.

**What was missing:** how cases behave in the runner, and further risks.

**Model answer:**
> **Benefits:**
> - One test body, many cases, and adding a case is just a line of data.
> - The case table is easy to read and review.
> - Each case is a **separate test**: it runs in parallel and is reported on its own, so a failure names the exact case.
>
> **Risks:**
> - **Redundant cases** that exercise the same behavior, adding runtime without coverage.
> - **Logic creeping into the body** (`if` per case): a sign the cases are really different tests and should be split.
> - **Generic code is harder to debug**, so test names must include the distinguishing value, and names must be unique.
> - **Runtime grows quickly:** cases × browsers × repeats.
>
> **Rule:** each case should cover a different behavior or boundary, not just different data.

**Remember:** separate tests per case · unique names · different behavior per case · no `if` per case · watch runtime.

---

### Senior question: An app with no accessible names and no test IDs

**Scenario:** you join a team whose app has no accessible names and no test IDs. Every locator is a long CSS path, and the suite is flaky. What do you do in your first month? Who do you talk to, and what do you change in the team's process?

**My answer (score 2/5):** Talk to the dev team and explain that we need accessible names or test IDs on the UI elements we use, for faster locator creation and stable tests. Ask them to add them, and change the process so all new elements have them. This also benefits users, because accessible names are used for accessibility.

**What was right:** talking to developers, asking for accessible names or test IDs, changing the process for new code, and linking it to accessibility.

**What was missing:** measuring the problem first, prioritizing, a step-by-step plan, involving more people, and how to make the process change stick.

**Model answer:**
> **Week 1: measure before changing anything.** Which tests are flaky, how often, and why? Not all flakiness is locators: some is timing, shared data or the environment. This gives me data instead of opinions.
>
> **Weeks 1–2: quick wins.** Quarantine the worst flaky tests so the suite becomes trustworthy again, and fix the top few, proving each fix with repeated runs.
>
> **Weeks 2–4: fix testability at the source, incrementally.**
> - **Developers:** agree a convention (accessible names first, test IDs where needed) and make it part of the **definition of done** and code review. Offer to add the attributes myself in small pull requests to show the effort is low.
> - **Designers, product and accessibility specialists:** accessible names are a user and accessibility requirement, not just a testing convenience, which gives the change wider support.
> - **Prioritize critical user flows** (login, checkout); don't rewrite the whole suite at once.
>
> **Make it stick:** a lint rule or review checklist, documented conventions, and tracking the flaky-test rate to show the improvement.
>
> **How I frame it to developers:** fewer false failures blocking their pull requests, and faster feedback. It's a shared benefit, not a QA demand.

**Remember:** measure → stabilize → fix at the source incrementally · involve devs, design, product and accessibility · definition of done · prioritize critical flows · track the flaky rate.

---

## Day 3 — Async JavaScript, network waits, ESLint

### Warm-up (questions on Day 2 topics) — 18/25

#### Q12. Name Playwright's four debugging tools and when you'd use each one.
**My answer (score 2/5):** Trace viewer (full information about the run: screenshots, steps, errors, network, console) and `--debug` (live browser, stepping for deeper analysis). Didn't remember the others.

**Model answer:**
> - **UI mode** (`--ui`): developing tests locally — time-travel through steps, watch mode, locator picker.
> - **Inspector** (`--debug`): step through a test line by line in a real browser.
> - **`page.pause()`**: stop at one specific line and explore the live page (remove before committing).
> - **Trace viewer**: failures you didn't watch, especially in CI — actions, before/after DOM snapshots, call log, console and network.

**Remember:** UI mode = develop · `--debug` = step · `pause()` = stop at one point · trace = investigate afterwards.

---

#### Q13. What is the "old-state trap"? Give an example from your own tests.
**My answer (score 3/5):** The test does an action without being sure of the page's default state, so an assertion can pass even without the action. The expected state must differ from the starting state. (No example given.)

**Model answer:**
> An assertion that can **already pass before the action happened**, so it proves nothing about the action. Examples from my tests: the product list already exists on the home page before filtering by Hammer; the "Bolt Cutters" heading exists on the search results page before opening the product; TodoMVC starts on the "All" filter. Fix: assert on something that's only true after the action, or move away from the default state first.

**Remember:** "Could this already be true on the previous page?"

---

#### Q14. Why must values be read *inside* `expect.poll`, not before it?
**My answer (score 5/5):** A value read before the poll is read once and never retried. `expect.poll` exists to wait for a condition that takes time; only when it's met does the poll end, otherwise it fails at the timeout.

**Remember:** read changing values inside the retried function.

---

#### Q15. Why was `.first()` dangerous right after a search on Toolshop?
**My answer (score 4/5):** The old product list was still displayed while we started working with it. Wait until the page shows products matching the condition before acting.

**Precision:** the result label had already updated; the **list** hadn't re-rendered yet. `.first()` takes whatever is first *at that moment*.

**Model answer:**
> After a search, the result list re-renders. `.first()` resolves to whatever is first at that moment, which can still be a product from the old list. Fix: wait for a state that's only true after the search (all products match), or locate the product by name instead of by position.

---

#### Q16. What's wrong with `[10, 9, 100].sort()`, and how do you fix it?
**My answer (score 2/5):** Sorts as strings (10, 100, 9); convert with `Number()` first. `sort` also mutates the array, so copy it or use `beSorted()`.

**Corrections:** the elements are already numbers, so `Number()` changes nothing; the fix is a **compare function**. The non-mutating method is `toSorted()`.

**Model answer:**
> Without a compare function, `sort()` converts elements to strings and compares them alphabetically, giving `[10, 100, 9]`. Fix: `sort((a, b) => a - b)` for ascending, `b - a` for descending. `sort()` also mutates the original array; `toSorted()` returns a sorted copy, which matters when you compare a list with its sorted version.

**Remember:** compare function · `a - b` ascending · `toSorted()` doesn't mutate.

---

### Interview drill — 20/30

#### Q17. What does `await` actually do, and what happens to the calling code if an async function isn't awaited?
**My answer (score 3/5):** `await` waits for the promise to be fulfilled or rejected; if fulfilled the code continues, if rejected it throws an error. If not awaited, the function finishes eventually, but code fails later and it's hard to tell what failed.

**What was missing:** that `await` pauses **only the current function**, and what the caller concretely gets.

**Model answer:**
> `await` pauses **only the async function it's in** until the promise settles: fulfilled → continue with the value; rejected → throw the error at that line, where `try/catch` can catch it. Everything else keeps running. If a caller doesn't await an async function, it immediately gets a **pending promise** and moves on. Consequences: it uses the promise instead of the value (`Promise { 'done' }`), errors become **unhandled rejections** or surface somewhere unrelated, and in a test, the test can **end while its steps are still running** ("Test ended", "Target page has been closed"). Also: an async function runs synchronously until its first `await`.

**From my own experience (Day 3):** Snippet C (`start`, `end`, `after await`) and the unhandled rejection crash in Exercise 1.3.

---

#### Q18. Explain the difference between `Promise.all` and `Promise.allSettled`, with an example from test automation for each.
**My answer (score 4/5):** `all` succeeds only if all promises are fulfilled; if one fails it returns that failure without waiting for the rest. `allSettled` waits for all and gives every result. Example for `all`: preconditions — if one fails, fail the test immediately. Example for `allSettled`: removing test data at the end — the test shouldn't fail, but you still see every cleanup error.

**Correction:** `Promise.all` doesn't *run* promises in parallel — they're already running from the moment they're created. `all` only **waits** for them. (Exercise 1.2: `await` inside the array made it sequential.)

**Model answer:**
> Both wait for several promises that are already running. `Promise.all` resolves with all values if every promise succeeds and **rejects with the first error** as soon as one fails (the others keep running, but their results are discarded). `Promise.allSettled` waits for **all** and returns each outcome as `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }`, never throwing. Use `all` for independent preconditions, such as creating test data via the API, where any failure should stop the test. Use `allSettled` for cleanup: try to delete everything, then report every failure.

---

#### Q19. Why do you start `waitForResponse` before the click? What goes wrong otherwise, and why might you not notice?
**My answer (score 3/5):** The click can be too fast and the response arrives before you start waiting. Wait before the action, because a slow or fast application makes the test unstable.

**Precision:** the cause isn't that the click is fast; it's that the **listener only sees responses arriving after it starts**.

**Model answer:**
> `waitForResponse` only sees responses that arrive **after it starts listening**. If you start it after the click, a response that arrived during the click is missed, and the wait times out. Correct pattern: create the promise (start listening) without awaiting, perform the action, then await the promise. You might not notice because a **slow server hides the bug**: if the response takes longer than the gap between click and listener, the test passes. It then fails in a faster environment, like a local Docker setup, and looks like an environment problem.

**From my own experience (Day 3, Exercise 2.2):** with the listener moved after the click, all tests still passed against the public demo, because its responses take 200–300 ms.

---

#### Q20. When would you wait for a network response instead of a UI change? Why not just one of them?
**My answer (score 3/5):** Wait for the network response to be sure the backend sent the right information, then for the UI to be sure it applied it. There can be a gap between the two. Not every action needs both — mostly time-consuming ones.

**What was missing:** the diagnostic value, and concrete reasons to wait on the network.

**Model answer:**
> The UI assertion is the default, because it's what users see. I add a network wait when:
> - I need the failure to **point to the right layer**: a timeout or 500 means backend; a 200 with no UI change means frontend
> - the action has **no clear visible result** to wait for
> - overlapping requests can cause **races**: waiting for the page's initial load before acting prevents a slow old response from overwriting a newer one
> - I want to assert on the **status or payload**
>
> I keep both because they answer different questions: the response says the backend did its job; the UI says the user can see it. A 200 doesn't prove the UI works.

**From my own experience (Day 3):** the initial-load `/products` response arrived 11 ms after the sort response and overwrote it. Waiting for the initial load in `beforeEach` fixed both the sort flake and the earlier search flake.

---

#### Q21. What kinds of bugs can a linter catch that TypeScript's type checker can't, and what can neither of them catch?
**My answer (score 4/5):** The type checker checks types. The linter checks bad code patterns like missing awaits and unhandled promises — things that cause issues but aren't about types. Neither catches logic problems.

**Model answer:**
> | Layer | Catches | Example |
> |---|---|---|
> | Type checker | wrong types | `selectFilter(page, 'Done')` |
> | Linter | valid but risky patterns | missing `await`, `waitForTimeout`, `page.pause()`, tests without assertions, `isVisible()` instead of web-first assertions, unsafe `any` |
> | Neither: tests and code review | wrong logic, wrong expectations, timing races, environment issues | `postData()?.includes('"sort"') !== undefined` instead of `=== true` |
>
> Some bugs are caught by two linter rules at once (`missing-playwright-await` and `no-floating-promises`), which is useful defense in depth.

---

### Senior question: A teammate wants `waitForTimeout(2000)` after every navigation

**Scenario:** a 400-test suite. A teammate proposes adding `waitForTimeout(2000)` after every navigation, "because it fixed the flaky tests". What's your position, what evidence do you bring, and what do you propose?

**My answer (score 3/5):** Against it: it works for a given setup, but as soon as performance or configuration changes it causes problems, 2000 ms won't be enough, the number keeps increasing, and the suite gets slower. Better to wait for the backend or handle each situation properly, case by case.

**What was missing:** numbers, evidence of root causes, a concrete plan, and acknowledging the teammate's real problem.

**Model answer:**
> "The flakiness is real, and the sleeps did reduce it, so the problem is worth solving. But fixed sleeps have three costs:
> - **Time:** 400 tests × ~3 navigations × 2 s is about **40 minutes** of waiting per run, roughly 10 minutes even with 4 workers.
> - **They don't fix the cause:** in our suite, traces showed three different causes — an app race between requests, a page not yet loaded, an overloaded machine. A sleep fixes none of them reliably.
> - **They decay:** when the environment slows down, 2 s stops being enough, and the number creeps up.
>
> **Proposal:** take the most flaky tests, read their traces, and fix each cause with a condition-based wait (web-first assertions, a page-ready check, `waitForResponse`). Keep `no-wait-for-timeout` as a lint error. Track the flaky rate before and after. I'm happy to pair on the first few."

**Remember:** acknowledge the problem · cost in numbers · evidence of real causes · concrete plan · prevention (lint) · measure the result.

---

## Day 4 — Playwright config, projects, modules

### Warm-up (questions on Day 3 topics) — 19/25

#### Q22. An async function is called without `await`. What does the caller get, and when does the function's code run?
**My answer (score 3/5):** The caller gets a pending status, and the code continues to run in the background while other lines execute.

**Corrections:** the caller gets a pending **promise** (an object). Nothing runs "in the background": JavaScript has one thread.

**Model answer:**
> The caller immediately receives a **pending promise**. The function's code starts running **right away, synchronously, until its first `await`**. Then control returns to the caller, which continues with its next lines. The rest of the function resumes later, as a microtask, once the awaited promise settles.

---

#### Q23. Why did `Promise.all([await a(), await b()])` take as long as running them one after another?
**My answer (score 4/5):** `await` inside `Promise.all` breaks the parallel execution and runs them sequentially.

**Model answer:**
> Each `await` inside the array finishes before the next call even **starts**, so the calls run one after another, and `Promise.all` receives values that are already done. `Promise.all` doesn't start anything itself; it only waits for promises that are already running. Pass the promises without `await`: `Promise.all([a(), b()])`.

---

#### Q24. In a `waitForResponse` predicate, why match on URL and method but not on the status code?
**My answer (score 3/5):** URL and method identify the request; the status is the result of the action, so it belongs in an assertion. (Sentence unfinished.)

**Model answer:**
> The predicate decides **which** response I mean; the assertion decides **whether it's good**. If the status is in the predicate, an error response never matches, so the wait runs into a **timeout**, and the failure looks like "the request never came" instead of "the backend returned 500".

---

#### Q25. Many tests time out at once, within the same minute. First suspicion, and how do you check it?
**My answer (score 4/5):** Usually the local machine is overloaded with too many workers; check CPU and reduce workers.

**Model answer:**
> A **shared resource**, not many separate bugs: the machine, the network or the server. Check the **trace timings**: if the API answered quickly but the browser was slow (page creation, running JavaScript), it's the machine. Watch CPU in Task Manager and re-run with fewer workers to compare. If the API itself was slow or failing, it's the server or network.

**From my own experience (Day 3):** API responses took 50–80 ms while page creation took 3–14 s; 4 workers instead of 11 gave 150/150 green.

---

#### Q26. One bug the linter caught, and one neither the linter nor the type checker could catch.
**My answer (score 5/5):** The linter caught a test without assertions. Neither caught `includes('"sort"') !== undefined`, which is always true.

---

### Interview drill — 21/30

#### Q27. What belongs in `playwright.config.ts`, and what belongs in a test?
**My answer (score 3/5):** Global configuration goes in the config: timeouts, URLs (global or per project), browsers. File-specific settings, like a bigger test timeout for a slow file, can go in `test.use`.

**Correction:** `timeout` is **not** a `test.use` option. For one file: `test.describe.configure({ timeout })`; for one test: `test.setTimeout()` (or `test.slow()`). `test.use` sets **browser** options like `baseURL` or `actionTimeout`.

**Model answer:**
> Rule: anything that changes between **environments, machines or apps** goes in the config; the test only says **what to check**. In my project, the config holds each app's `baseURL` and `testIdAttribute` (per project), browsers, timeouts, workers, retries and trace settings. Test files contain only test data, steps and assertions, so moving Toolshop to a local Docker copy is a one-line change. Exceptions go in the narrowest scope: `test.use()` for one file's browser options, `test.describe.configure({ timeout })` for a slow file.

---

#### Q28. Explain the four Playwright timeouts, and how an action timeout changes what a failure looks like.
**My answer (score 4/5):** Test timeout for the whole test; action timeout for each click, fill etc.; navigation timeout for `goto` and other navigations; expect timeout for assertions. Without an action timeout, the test fails by the test timeout and you don't see the real reason.

**Model answer:**
> | Timeout | Default | Limits |
> |---|---|---|
> | Test | 30 s | the whole test, including hooks and fixtures |
> | Expect | 5 s | each web-first assertion or `expect.poll` |
> | Action | none | each `click`, `fill`, `check`… |
> | Navigation | none | `goto`, `reload`, `goBack`, `goForward`, `waitForURL` |
>
> Without action and navigation timeouts, a stuck step waits until the whole test timeout is used up, and the error is a generic "Test timeout exceeded". With an action timeout, the test fails **earlier**, and the error names **the action and its locator**. A click that navigates is still an action; the new page is then checked with `toHaveURL` or `waitForURL`.

**From my own experience (Day 4):** a wrong button name failed after exactly 10 s with "locator.click: Timeout 10000ms exceeded", naming the locator.

---

#### Q29. What are projects used for besides running several browsers?
**My answer (score 3/5):** Running tests for different applications, or on different devices like desktop and mobile.

**Model answer:**
> A project is a named group of tests with its own settings. Besides browsers:
> - **Different apps:** in my suite, `todo-*` and `toolshop-*` projects each have their own `testDir`, `baseURL` and `testIdAttribute`
> - **Environments:** the same tests against staging and a local Docker copy
> - **Devices:** desktop vs mobile presets
> - **Setup projects:** log in once, save the session, and let other projects depend on it
> - **Special settings:** fixed `locale` and `timezoneId`, or a slower app with a longer timeout

---

#### Q30. Why can retries be dangerous, and how do you use them safely?
**My answer (score 4/5):** Retries hide failures: if you only look at pass/fail, you miss that a test fails 50% of the time and needs a real fix. Use retries in CI so occasional environment errors don't break the pipeline, but collect reports and investigate every failure. No retries locally.

**Model answer:**
> A test that fails and then passes on retry is reported as **flaky**, not failed. That's the danger and the tool: if nobody watches the flaky count, real problems hide behind green builds. Safe use: retries **in CI only** (1–2), traces kept on retry, the flaky list reviewed regularly, each flaky test investigated, fixed or quarantined. **No retries locally**, so every failure is visible while developing.

---

#### Q31. Why move helpers into modules, and what did you change so the move didn't weaken your safety checks?
**My answer (score 4/5):** Several test files for the same app can use them, and test files and framework files are easier to read separately. I made sure Playwright rules and type checks cover both `tests` and `src`.

**Model answer:**
> Shared code in one module means one place to fix bugs, and test files that read like specifications. I **exported only what tests use** (the response check stayed private) and moved framework code to `src/`. Because the Playwright ESLint rules only covered `tests/**`, I extended them to `src/**`, then proved it by removing an `await`: both `no-floating-promises` and `missing-playwright-await` reported it. TypeScript already covered `src` through `tsconfig.json`.

---

### Senior question: The 25-minute suite that developers skip

**Scenario:** the CI suite takes 25 minutes, and developers merge without waiting for it. You can change the config, the tests and the pipeline.

**My answer (score 3/5):** First find out why they merge without waiting: if it's not about time, address that. If it is, agree on an acceptable time for the merge pipeline, typically smoke tests of 5–10 minutes, reduce the suite to that with its coverage trade-offs, and move the rest to a separate regression suite that runs nightly or several times a day.

**What was missing:** making the suite faster **before** cutting coverage, enforcement, and trade-offs for each option.

**Model answer:**
> 1. **Diagnose:** ask the team why they skip it, and look at the report for where the 25 minutes go.
> 2. **Make it faster without losing coverage:** fix the slowest tests (set up data through the API instead of the UI), remove duplicate coverage, and **shard** across CI machines: 25 minutes on one machine becomes about 6 on four.
> 3. **Split by purpose:** a risk-based smoke suite on every merge request (under 10 minutes); the full suite on `main` and nightly.
> 4. **Enforce:** make the merge-request check required in branch protection.
> 5. **Measure:** pipeline duration, and how many bugs the nightly run catches that the merge suite missed.
>
> **Trade-offs:** sharding costs CI resources; nightly runs find bugs a day later and need an owner for triage; a smaller merge suite can miss bugs, so choose it by risk, not by convenience.

**Remember:** diagnose → faster before smaller → split by risk → enforce → measure.

---

## Interview tips

### Learned on Day 1
- **Answer the whole question.** If it says "compared with Selenium", give the comparison.
- **Senior questions want a decision**, plus the conditions under which you'd change it.
- **Name the trade-off** for every technique; there's always one.
- **"I don't know, but here's how I'd reason about it"** beats guessing.

### Learned on Day 2
- **Use your own experience.** "In my framework, a cart test failed because…" is far more convincing than a textbook answer.
- **Process questions want a plan over time:** what you'd do first, next, and how you'd know it worked.
- **Say *when*, not just *what*.** For every tool (`as const`, test IDs, data-driven tests), say when it's worth using and when it isn't.

### Learned on Day 3
- **Precision matters.** "The click is too fast" vs "the listener only sees later responses": interviewers notice the right mechanism.
- **Bring numbers.** "40 minutes of sleeping per run" convinces more than "it's slow".
- **In team disagreements, acknowledge the real problem first**, then propose a better solution and how you'd measure it.

### Learned on Day 4
- **State the rule, then the examples.** "Anything that changes between environments goes in the config" before listing timeouts and URLs.
- **For "too slow" problems: faster before smaller.** Optimize and parallelize before cutting coverage, and say how you'd enforce and measure the result.
- **Use your own project as the example** whenever the question allows it.
