import { test, expect } from '@playwright/test';
import {
  expectOnlyProductsMatching,
  getAllProductPrices,
  openHomePage,
  searchFor,
  sortBy,
  type SortOption,
} from '../../src/toolshop/helpers.js';

export type SortDirection = 'asc' | 'desc';
export type SortOptionCase = {
  sortOption: SortOption;
  direction: SortDirection;
};
const SORT_OPTION_CASES: SortOptionCase[] = [
  { sortOption: 'Price (High - Low)', direction: 'desc' },
  { sortOption: 'Price (Low - High)', direction: 'asc' },
];

test.describe('Toolshop', () => {
  test.beforeEach('open app', async ({ page }) => {
    await openHomePage(page);
  });

  //test is selected for smoke as it is quick and check main functionality, search of the products in application
  test('shows matching products when searching by name', { tag: '@smoke' }, async ({ page }) => {
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
