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
