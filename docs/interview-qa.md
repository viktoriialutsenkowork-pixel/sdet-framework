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

---

### Q2. What's the difference between a locator and an element handle, and why does it matter for flakiness?

**My answer (score 1/5):** A locator describes how to find an element in the DOM. I hadn't heard of element handles before.

**Model answer:**
> An **element handle** (older API, e.g. `page.$()`) points to **one specific DOM node at the moment it was retrieved**. If the page re-renders that part, which is common in React or Vue apps, the handle points to a node that no longer exists, the same problem as Selenium's `StaleElementReferenceException`. A **locator** is a **recipe** for finding elements and is **re-resolved every time it's used**, so re-renders don't break it. That's why Playwright recommends locators and discourages handles: they remove a whole class of flaky failures.

**Remember:** handle = snapshot of a node (goes stale) · locator = recipe (re-resolved each use).

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

## Interview tips (learned on Day 1)
- **Answer the whole question.** If it says "compared with Selenium", give the comparison.
- **Senior questions want a decision**, plus the conditions under which you'd change it.
- **Name the trade-off** for every technique; there's always one.
- **"I don't know, but here's how I'd reason about it"** beats guessing.
