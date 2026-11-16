import { test, expect, type Locator } from '@playwright/test';
const TODO_ITEMS_1 = ['Buy milk'];
const TODO_ITEMS_2 = ['Item 1', 'Item 2'];
const TODO_ITEMS_3 = ['Item 1', 'Item 2', 'Item 3'];

test.describe('Todo app', () => {
  test.beforeEach('open application', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
  });

  test('Exercise 1.1: add todo item and verify it is added to list', async ({ page }) => {
    const whatNeedTobeDoneInput = page.getByPlaceholder('What needs to be done?');
    const toDoItemLocator = page.getByTestId('todo-title').getByText(TODO_ITEMS_1[0]!);

    await addTodoItem(whatNeedTobeDoneInput, TODO_ITEMS_1);

    await expect(toDoItemLocator).toBeVisible();
  });

  test.skip('Exercise 1.2: Remove await that should break your test on purpose', async ({ page }) => {
    const whatNeedTobeDoneInput = page.getByPlaceholder('What needs to be done?');
    const toDoItemLocator = page.getByTestId('todo-title').getByText(TODO_ITEMS_1[0]!);

    await addTodoItem(whatNeedTobeDoneInput, TODO_ITEMS_1);

    await expect(toDoItemLocator).toBeVisible();
  });

  test.skip('Exercise 1.2: wait for wrong text for list item that should break your test on purpose', async ({
    page,
  }) => {
    const whatNeedTobeDoneInput = page.getByPlaceholder('What needs to be done?');
    const toDoItemLocator = page.getByTestId('todo-title').getByText(TODO_ITEMS_1[0]!);

    await addTodoItem(whatNeedTobeDoneInput, ['other']);

    await expect(toDoItemLocator).toBeVisible();
  });

  test('Exercise 2.1: codgen locators', async ({ page }) => {
    page.getByRole('textbox', { name: 'What needs to be done?' }); //good one as it found by role
    page.getByTestId('todo-title'); // not good, as test id not unique for list items, I need to find it by specific list item text.
    page.getByRole('checkbox', { name: 'Toggle Todo' }); // not good, as test id not unique for list items checkboxes, I need to find checkbox for specific list item text.
    page.getByRole('link', { name: 'Active' }); // good one and stable, as found by Role
  });

  test('Exercise 2.2: add multiple todos and delete some of them', async ({ page }) => {
    const whatNeedTobeDoneInput = page.getByRole('textbox', { name: 'What needs to be done?' });
    const item1 = 'Item 1';
    const item2 = 'Item 2';
    const item3 = 'Item 3';
    const todoTitleLocator = page.getByTestId('todo-title');

    await addTodoItem(whatNeedTobeDoneInput, TODO_ITEMS_3);

    await expect(todoTitleLocator).toHaveCount(3);
    await expect(todoTitleLocator.first()).toHaveText(item1);
    await expect(todoTitleLocator.nth(1)).toHaveText(item2);
    await expect(todoTitleLocator.nth(2)).toHaveText(item3);
  });

  test('Exercise 2.3: add two todos, delete the first one, and verify only the second remains.', async ({
    page,
  }) => {
    const whatNeedTobeDoneInput = page.getByRole('textbox', { name: 'What needs to be done?' });
    const item1 = 'Item 1';
    const item2 = 'Item 2';
    const todoTitleLocator = page.getByTestId('todo-title');

    await addTodoItem(whatNeedTobeDoneInput, TODO_ITEMS_2);

    await expect(todoTitleLocator).toHaveCount(2);
    await expect(todoTitleLocator.first()).toHaveText(item1);
    await expect(todoTitleLocator.nth(1)).toHaveText(item2);

    await todoTitleLocator.first().hover();
    await page.getByRole('listitem').filter({ hasText: item1 }).getByLabel('Delete').click();

    await expect(todoTitleLocator).toHaveCount(1);
    await expect(todoTitleLocator.first()).toHaveText(item2);
  });

  test('Exercise 3.2: add three todos, mark the second one as completed, and verify', async ({
    page,
  }) => {
    const whatNeedTobeDoneInput = page.getByRole('textbox', { name: 'What needs to be done?' });
    const item1 = 'Item 1';
    const item2 = 'Item 2';
    const item3 = 'Item 3';
    const todoTitleLocator = page.getByTestId('todo-title');

    await addTodoItem(whatNeedTobeDoneInput, TODO_ITEMS_3);

    await expect(todoTitleLocator).toHaveCount(3);
    await expect(todoTitleLocator.first()).toHaveText(item1);
    await expect(todoTitleLocator.nth(1)).toHaveText(item2);
    await expect(todoTitleLocator.nth(2)).toHaveText(item3);

    await page.getByRole('listitem').filter({ hasText: item2 }).getByLabel('Toggle Todo').check();

    await expect(page.getByRole('listitem').filter({ hasText: item2 })).toHaveClass(/completed/);
    await expect(page.getByTestId('todo-count')).toHaveText('2 items left');

    await page.getByRole('link', {name: 'Active'}).click();
    await expect(todoTitleLocator).toHaveCount(2);
    await expect(todoTitleLocator.first()).toHaveText(item1);
    await expect(todoTitleLocator.nth(1)).toHaveText(item3);

    await page.getByRole('link', {name: 'Completed'}).click();
    await expect(todoTitleLocator).toHaveCount(1);
    await expect(todoTitleLocator.first()).toHaveText(item2);
  });

  async function addTodoItem(
    whatNeedTobeDoneInput: Locator,
    toDoItemLabel: string[],
  ): Promise<void> {
    for (const item of toDoItemLabel) {
      await whatNeedTobeDoneInput.fill(item);
      await whatNeedTobeDoneInput.press('Enter');
    }
  }
});
