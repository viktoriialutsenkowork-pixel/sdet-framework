import { test, expect, type Page, type Response } from '@playwright/test';

test.use({ testIdAttribute: 'data-test', baseURL: 'https://practicesoftwaretesting.com/' });
type SortOption = 'Price (High - Low)' | 'Price (Low - High)';
type SortDirection = 'asc' | 'desc';
type SortOptionCase = {
  sortOption: SortOption;
  direction: SortDirection;
};
const SORT_OPTION_CASES: SortOptionCase[] = [
  { sortOption: 'Price (High - Low)', direction: 'desc' },
  { sortOption: 'Price (Low - High)', direction: 'asc' },
];

async function sortBy(page: Page, option: SortOption): Promise<void> {
  // the sort <select> has an accessible label "sort"
  const sortDropdown = page.getByLabel('sort');
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/products' &&
      response.request().method() === 'QUERY' &&
      response.request().postData()?.includes('"sort"') === true,
  );
  await sortDropdown.selectOption(option);
  await expectOkResponse(responsePromise);
}

async function getAllProductPrices(page: Page): Promise<number[]> {
  const productPrices = await page.getByTestId('product-price').allTextContents();
  return productPrices.map((productPrice) => Number(productPrice.trim().replace('$', '')));
}

async function searchFor(page: Page, searchWord: string): Promise<void> {
  const searchInput = page.getByRole('textbox', { name: 'Search' });
  const searchButton = page.getByRole('button', { name: 'Search' });
  const searchResultCountLabel = page.getByTestId('search-result-count'); //found by id as no role/label/placeholder can be used here

  await searchInput.fill(searchWord);
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/products/search' &&
      response.request().method() === 'QUERY',
  );
  await searchButton.click();
  await expectOkResponse(responsePromise);
  await expect(searchResultCountLabel).toContainText(`found for '${searchWord}'`);
}

async function expectOnlyProductsMatching(page: Page, text: string): Promise<void> {
  const productNames = page.getByTestId('product-name');
  await expect
    .poll(async () => {
      const names = (await productNames.allTextContents()).map((name) => name.trim());
      return {
        hasProducts: names.length > 0,
        nonMatchingNames: names.filter((name) => !name.toLowerCase().includes(text.toLowerCase())),
      };
    })
    .toEqual({ hasProducts: true, nonMatchingNames: [] });
}

async function expectOkResponse(responsePromise: Promise<Response>): Promise<void> {
  const response = await responsePromise;
  expect(response.status(), `${response.request().method()} ${response.url()}`).toBe(200);
}

test.describe('Toolshop', () => {
  test.beforeEach('open app', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/products' && response.request().method() === 'QUERY',
    );
    await page.goto('/');
    await expectOkResponse(responsePromise);
  });

  test('shows matching products when searching by name', async ({ page }) => {
    const searchWord = 'pliers';

    await searchFor(page, searchWord);
    await expectOnlyProductsMatching(page, searchWord);
  });

  test('shows only hammers when the Hammer filter is applied', async ({ page }) => {
    const categoryName = 'Hammer';
    const categoryCheckbox = page.getByRole('checkbox', { name: categoryName });

    await categoryCheckbox.check();
    await expect(categoryCheckbox).toBeChecked();

    // Every product in the Hammer category has "hammer" in its name (any case,
    // sometimes inside a word like "Sledgehammer"), so a name check is meaningful.
    // The list must also be non-empty: "every" is true for an empty list.
    await expectOnlyProductsMatching(page, categoryName);
  });

  test('shows 1 in the cart icon after adding a product', async ({ page }) => {
    const searchWord = 'Bolt Cutters';
    const productNames = page.getByTestId('product-name');
    const addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    const cartQuantity = page.getByTestId('cart-quantity');
    await expect(cartQuantity).toBeHidden();

    await searchFor(page, searchWord);
    await expectOnlyProductsMatching(page, searchWord);

    await productNames.first().click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByRole('heading', { level: 1, name: searchWord })).toBeVisible();

    await addToCartButton.click();
    await expect(cartQuantity).toHaveText('1');
  });

  for (const sortCase of SORT_OPTION_CASES) {
    test(`'${sortCase.sortOption}' sorts products by price`, async ({ page }) => {
      await sortBy(page, sortCase.sortOption);
      // The default product order is not sorted by price, so this can only pass
      // after sorting has been applied.
      await expect
        .poll(async () => {
          const prices = await getAllProductPrices(page);
          return {
            hasPrices: prices.length > 0,
            invalidPrices: prices.filter((price) => Number.isNaN(price)),
            outOfOrderPrices: prices.flatMap((price, i) => {
              if (i === 0) return [];
              const prev = prices[i - 1]!;
              const inOrder = sortCase.direction === 'asc' ? prev <= price : prev >= price;
              return inOrder ? [] : [`${prev} -> ${price}`];
            }),
          };
        })
        .toEqual({ hasPrices: true, invalidPrices: [], outOfOrderPrices: [] });
    });
  }
});
