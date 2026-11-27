import { defineConfig, devices } from '@playwright/test';
const TODO_URL = 'https://demo.playwright.dev/todomvc/';
const TOOLSHOP_URL = 'https://practicesoftwaretesting.com/';

export default defineConfig({
  //fallback for tests location if testDir is not mentions in projects
  testDir: './tests',
  // if true it runs tests in parallel inside tets file, with several workers. if false only test files are run in parallel, not tests inside
  fullyParallel: true,
  //fobids 'only' for test or test.describe, specifically in CI. locally it will work.
  forbidOnly: !!process.env.CI,
  //if tests failes do retry. if it is ci then retry 2 times, if locally - no retry.
  //for ci we have retries as we need to eliminate occasional env problems dring pipeline runs. but we collect traces to fix possible problems.
  //no retries locally, so every failure shows up immediately while developing instead of being hidden by a passing retry
  retries: process.env.CI ? 2 : 0,
  //amount of workers that are used in parallel execution. if it is ci then use 1 if it is locally then 4.
  //here only 4 workers are used locally for stability of the run. With 11 workers the machine was overloaded and Firefox tests timed out
  //for ci we are using 1 for stability as well
  workers: process.env.CI ? 1 : 4,
  //report about runs in html format
  reporter: 'html',
  //options that will be used for all tests
  use: {
    //save trace for all failed tests to use then in debugging
    //we use retain on failure as we need to catch even ocsasional issues in ci or local envs, to have possibility investigate and fix.
    trace: 'retain-on-failure',
    //timeout for specific action like click, fill. after 10 sec, test shoul faiild as it is normal range to action to be finished. if an action takes longer, something is wrong: the app, the environment, or the test itself.
    actionTimeout: 10_000,
    //timeout for goto or other navigations, it is 15 sec that look also enough for normal working environment, it is more then action timeout as navigation annd full or part reload of page usually takes more then single action.
    navigationTimeout: 15_000,
  },
  //set of conditions based on what you are running your tests (browser, global preconditions, etc.)
  //six explicit projects are selected instead of generating them for sake of easy config reading
  projects: [
    {
      //project name, so that you can use specific name to run it from command line if needed
      name: 'todo-chromium',
      //option that shows tests location for the project
      testDir: './tests/todo',
      //options that will be used for tests in this project, use Chrome browser
      use: { ...devices['Desktop Chrome'], baseURL: TODO_URL },
    },

    {
      name: 'todo-firefox',
      testDir: './tests/todo',
      use: { ...devices['Desktop Firefox'], baseURL: TODO_URL },
    },

    {
      name: 'todo-webkit',
      testDir: './tests/todo',
      use: { ...devices['Desktop Safari'], baseURL: TODO_URL },
    },
    {
      name: 'toolshop-chromium',
      testDir: './tests/toolshop',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: TOOLSHOP_URL,
        testIdAttribute: 'data-test',
      },
    },

    {
      name: 'toolshop-firefox',
      testDir: './tests/toolshop',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: TOOLSHOP_URL,
        testIdAttribute: 'data-test',
      },
    },

    {
      name: 'toolshop-webkit',
      testDir: './tests/toolshop',
      use: {
        ...devices['Desktop Safari'],
        baseURL: TOOLSHOP_URL,
        testIdAttribute: 'data-test',
      },
    },
  ],
});
