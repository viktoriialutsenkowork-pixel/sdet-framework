# Command Cheat Sheet

All commands are for **PowerShell on Windows**, run from the project root (`sdet-framework/`) unless noted.
Grouped by topic, with the day each one was introduced.

---

## Checking installed tools *(Day 1)*

| Command | What it does |
|---|---|
| `node -v` | Show the installed Node.js version |
| `npm -v` | Show the installed npm version |
| `git --version` | Show the installed Git version |

---

## Project setup *(Day 1)*

| Command | What it does |
|---|---|
| `mkdir sdet-framework` | Create the project folder |
| `cd sdet-framework` | Move into the project folder |
| `git init` | Start a Git repository in the current folder |
| `npm init -y` | Create `package.json` with default values (`-y` = yes to all questions) |
| `npm init playwright@latest` | Install Playwright Test, browsers, config file and example tests (interactive) |
| `npm i -D typescript tsx @types/node` | Install dev dependencies: TypeScript compiler, `.ts` runner, Node.js types |
| `npx tsc --init` | Create `tsconfig.json` |

**`npm` vs `npx`:** `npm` installs and manages packages and runs scripts from `package.json`. `npx` runs a package's command-line tool (for example `playwright` or `tsc`) from `node_modules` without installing it globally.

---

## npm scripts *(Day 1)*

Defined in the `"scripts"` section of `package.json`:
```json
"scripts": {
  "test": "playwright test",
  "test:ui": "playwright test --ui",
  "typecheck": "tsc --noEmit"
}
```

| Command | What it does |
|---|---|
| `npm test` | Run all tests in all configured browsers (`npm test` is a shortcut for `npm run test`) |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run typecheck` | Type-check all TypeScript files without producing output files |

**Always run `npm test` and `npm run typecheck` before submitting code for review.**

---

## Running Playwright tests *(Day 1)*

| Command | What it does |
|---|---|
| `npx playwright test` | Run all tests in all browsers |
| `npx playwright test tests/todo.spec.ts` | Run one test file |
| `npx playwright test tests/todo.spec.ts --project=chromium` | Run one file in one browser only |
| `npx playwright test --headed` | Run with a visible browser window |
| `npx playwright test --ui` | Open UI mode: time-travel, watch mode, locator picker |
| `npx playwright show-report` | Open the HTML report of the last run |
| `npx playwright codegen https://demo.playwright.dev/todomvc` | Open a browser that records your actions and suggests locators (for discovering locators, **not** for writing final tests) |

Options combine freely, for example:
```powershell
npx playwright test tests/todo.spec.ts --project=chromium --headed
```

### Selecting and repeating tests *(Day 2)*
| Command | What it does |
|---|---|
| `npx playwright test -g "clears completed"` | Run only tests whose name contains this text (`-g` = grep) |
| `npx playwright test --repeat-each=10` | Run each test 10 times. A quick way to find flaky tests before they reach CI |
| `npx playwright test -g "shows 1 in the cart" --project=webkit --repeat-each=30` | Example: one test, one browser, 30 times |

---

## Debugging *(Day 2)*

| Command | What it does |
|---|---|
| `npx playwright test --trace on` | Record a trace for every test in this run |
| `npx playwright test --trace retain-on-failure` | Record traces, but keep only those of failed tests. Best for catching rare flakes |
| `npx playwright show-trace <path-to-trace.zip>` | Open a trace file directly (traces are also linked from the HTML report and saved in `test-results/`) |
| `npx playwright test --debug` | Open the Playwright Inspector and step through the test line by line |
| `npx playwright test --headed` with `await page.pause();` in the test | Stop at that line and explore the live page. **Remove `page.pause()` before committing** |
| `npx playwright codegen https://practicesoftwaretesting.com` | Discover locators on any site |

### Trace settings in `playwright.config.ts`
| Value | Records a trace |
|---|---|
| `'off'` | never |
| `'on'` | for every test |
| `'on-first-retry'` | only on the first retry of a failed test |
| `'on-all-retries'` | on every retry |
| `'retain-on-failure'` | for every test, kept only if it fails |

### How to read a trace
1. **Actions list:** find the first red step.
2. **Before/After snapshots:** what did the page look like at that moment?
3. **Call log:** what was Playwright waiting for, and for how long?
4. **Console and Network tabs:** did the app throw an error, or did an API call fail or take too long?

---

## Running TypeScript files *(Day 2)*

| Command | What it does |
|---|---|
| `npx tsx scratch/sort.ts` | Run a TypeScript file directly, for quick experiments |
| `npm i -D tsx` | Install `tsx` if it's missing |

Keep experiments in a `scratch/` folder and add `scratch/` to `.gitignore`.

---

## Common command mistakes *(Day 2)*
| Mistake | Why it fails | Correct |
|---|---|---|
| `npx run typecheck` | `npx` runs a package's tool; there is no tool called `run` | `npm run typecheck` |

---

## Git *(Day 1)*

### Everyday workflow
| Command | What it does |
|---|---|
| `git status` | Show changed and new files. **Check before every commit** |
| `git add .` | Stage all changes in the current folder |
| `git add PROGRESS.md` | Stage one specific file |
| `git add -A` | Stage all changes, **including deleted files** *(Day 2)* |
| `git commit -m "type: message"` | Commit staged changes with a message |
| `git push` | Upload commits to GitHub |
| `git log --oneline -3` | Show the last 3 commits, one line each |

### First-time connection to GitHub
| Command | What it does |
|---|---|
| `git branch -M main` | Rename the current branch to `main` |
| `git remote add origin https://github.com/<you>/sdet-framework.git` | Connect the local repo to GitHub |
| `git push -u origin main` | First push; `-u` remembers the target, so later just `git push` |

### Fixing the last commit
| Command | What it does |
|---|---|
| `git commit --amend -m "new message"` | Replace the message of the most recent commit |
| `git push --force-with-lease` | Push a rewritten commit; only overwrites if nobody else pushed. **Only on your own branches, never on a shared `main`** |

### Commit message types (Conventional Commits)
| Type | Use for | Example |
|---|---|---|
| `feat:` | New functionality | `feat: add test user factory` |
| `fix:` | Bug fix | `fix: make user emails unique` |
| `test:` | Adding or changing tests | `test: add todo app tests` |
| `refactor:` | Restructuring without changing behavior | `refactor: clean up todo tests after review` |
| `docs:` | Documentation only | `docs: day 1 progress` |
| `chore:` | Setup, config, tooling | `chore: set up Playwright with TypeScript` |

Format: lowercase, imperative ("add", not "added"), no full stop. One kind of change per commit.

---

## VS Code shortcuts *(Day 1)*

| Shortcut | What it does |
|---|---|
| ``Ctrl+` `` | Open or close the integrated terminal |
| `Ctrl+Shift+X` | Open the Extensions view |
| `Ctrl+Shift+P` | Open the Command Palette |
| `Ctrl+Shift+V` | Preview a Markdown file |
| `F12` | Go to definition |
| `Ctrl+.` | Show quick fixes for an error |
