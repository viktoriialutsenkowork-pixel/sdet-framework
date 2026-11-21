import { test, expect, type Locator, type Page } from '@playwright/test';
const ITEM1 = 'Item 1';
const ITEM2 = 'Item 2';
const ITEM3 = 'Item 3';
const TODO_ITEMS = [ITEM1, ITEM2, ITEM3];
const FILTERS = ['All', 'Active', 'Completed'] as const;
type Filter = (typeof FILTERS)[number];
type FilterCase = {
  startFilter: Filter;
  checkedFilter: Filter;
  expected: string[];
};
const FILTER_CASES: FilterCase[] = [
  { startFilter: 'Active', checkedFilter: 'All', expected: TODO_ITEMS },
  { startFilter: 'Completed', checkedFilter: 'Active', expected: [ITEM1, ITEM3] },
  { startFilter: 'All', checkedFilter: 'Completed', expected: [ITEM2] },
];

function todoRow(page: Page, title: string): Locator {
  return page
    .getByRole('listitem')
    .filter({ has: page.getByTestId('todo-title').getByText(title, { exact: true }) });
}

async function addTodos(page: Page, items: string[]): Promise<void> {
  const newTodoInput = page.getByRole('textbox', { name: 'What needs to be done?' });
  for (const item of items) {
    await newTodoInput.fill(item);
    await newTodoInput.press('Enter');
  }
}

async function selectFilter(page: Page, filter: Filter): Promise<void> {
  await page.getByRole('link', { name: filter, exact: true }).click();
}

test.describe('Todo app', () => {
  test.beforeEach('open application', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
  });

  test('adds a single todo', async ({ page }) => {
    const todoTitleLocator = page.getByTestId('todo-title');
    await addTodos(page, [ITEM1]);
    await expect(todoTitleLocator).toHaveText([ITEM1]);
  });

  test('shows todos in order they were added', async ({ page }) => {
    const todoTitleLocator = page.getByTestId('todo-title');
    await addTodos(page, TODO_ITEMS);
    await expect(todoTitleLocator).toHaveText(TODO_ITEMS);
  });

  test('removes a deleted todo from the list', async ({ page }) => {
    const todoTitleLocator = page.getByTestId('todo-title');
    await addTodos(page, TODO_ITEMS.slice(0, 2));
    await expect(todoTitleLocator).toHaveText(TODO_ITEMS.slice(0, 2));

    const row = todoRow(page, ITEM1);
    await row.hover();
    await row.getByLabel('Delete').click();

    await expect(todoTitleLocator).toHaveText([ITEM2]);
  });

  test('updates the items left counter when a todo is completed', async ({ page }) => {
    await addTodos(page, TODO_ITEMS);
    await expect(page.getByTestId('todo-count')).toHaveText('3 items left');

    await todoRow(page, ITEM2).getByLabel('Toggle Todo').check();
    await expect(page.getByTestId('todo-count')).toHaveText('2 items left');
  });

  for (const filterCase of FILTER_CASES) {
    test(`'${filterCase.checkedFilter}' filter shows the matching todos`, async ({ page }) => {
      const todoTitleLocator = page.getByTestId('todo-title');
      await addTodos(page, TODO_ITEMS);
      await expect(todoTitleLocator).toHaveText(TODO_ITEMS);

      const toggle = todoRow(page, ITEM2).getByLabel('Toggle Todo');
      await toggle.check();
      await expect(toggle).toBeChecked();

      await selectFilter(page, filterCase.startFilter);
      await selectFilter(page, filterCase.checkedFilter);
      await expect(todoTitleLocator).toHaveText(filterCase.expected);
    });
  }

  test('clears completed todos', async ({ page }) => {
    const todoTitleLocator = page.getByTestId('todo-title');
    await addTodos(page, TODO_ITEMS);
    await expect(todoTitleLocator).toHaveText(TODO_ITEMS);

    await todoRow(page, ITEM1).getByLabel('Toggle Todo').check();
    await page.getByRole('button', { name: 'Clear completed' }).click();
    await expect(todoTitleLocator).toHaveText([ITEM2, ITEM3]);
  });
});
