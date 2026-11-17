import { test, expect, type Locator, type Page } from '@playwright/test';
const ITEM1 = 'Item 1';
const ITEM2 = 'Item 2';
const ITEM3 = 'Item 3';
const TODO_ITEMS = [ITEM1, ITEM2, ITEM3];

function todoRow(page: Page, title: string): Locator {
  return page
    .getByRole('listitem')
    .filter({ has: page.getByTestId('todo-title').getByText(title, { exact: true }) });
}

async function addTodoItem(page: Page, items: string[]): Promise<void> {
  for (const item of items) {
    const newTodoInput = page.getByRole('textbox', { name: 'What needs to be done?' });
    await newTodoInput.fill(item);
    await newTodoInput.press('Enter');
  }
}

test.describe('Todo app', () => {
  test.beforeEach('open application', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
  });

  test('adds a single todo', async ({ page }) => {
    const toDoItemLocator = page.getByTestId('todo-title').getByText(ITEM1, { exact: true });

    await addTodoItem(page, TODO_ITEMS.slice(0, 1));

    await expect(toDoItemLocator).toBeVisible();
  });

  test('shows todos in order they were added', async ({ page }) => {
    const todoTitleLocator = page.getByTestId('todo-title');

    await addTodoItem(page, TODO_ITEMS);

    await expect(todoTitleLocator).toHaveText(TODO_ITEMS);
  });

  test('removes a deleted todo from the list', async ({ page }) => {
    const todoTitleLocator = page.getByTestId('todo-title');

    await addTodoItem(page, TODO_ITEMS.slice(0, 2));

    await expect(todoTitleLocator).toHaveText(TODO_ITEMS.slice(0, 2));

    const row = todoRow(page, ITEM1);
    await row.hover();
    await row.getByLabel('Delete').click();

    await expect(todoTitleLocator).toHaveText([ITEM2]);
  });

  test('filters todos by Active and Completed', async ({ page }) => {
    const todoTitleLocator = page.getByTestId('todo-title');

    await addTodoItem(page, TODO_ITEMS);

    await expect(todoTitleLocator).toHaveText(TODO_ITEMS);

    await todoRow(page, ITEM2).getByLabel('Toggle Todo').check();

    await expect(todoRow(page, ITEM2)).toHaveClass(/completed/);
    await expect(page.getByTestId('todo-count')).toHaveText('2 items left');

    await page.getByRole('link', { name: 'Active' }).click();
    await expect(todoTitleLocator).toHaveText([ITEM1, ITEM3]);

    await page.getByRole('link', { name: 'Completed' }).click();
    await expect(todoTitleLocator).toHaveText([ITEM2]);
  });
});
