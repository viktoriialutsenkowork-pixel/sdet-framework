import { test, expect, type Page } from '@playwright/test';

test.use({ testIdAttribute: 'data-test' });

async function searchFor(page: Page, searchWord: string): Promise<void> {
  const searchInput = page.getByRole('textbox', { name: 'Search' });
  const searchButton = page.getByRole('button', { name: 'Search' });
  const searchResultCountLabel = page.getByTestId('search-result-count'); //found by id as no role/label/placeholder can be used here

  await searchInput.fill(searchWord);
  await searchButton.click();
  await expect(searchResultCountLabel).toContainText(`found for '${searchWord}'`);
}

async function expectOnlyProductsMatching(page: Page, text: string): Promise<void> {
  const productNames = page.getByTestId('product-name');
  await expect
    .poll(async () => {
      const names = (await productNames.allTextContents()).map((name) => name.trim());
      return {
        hasProducts: names.length > 0,
        nonMatchingNames: names.filter(
          (name) => !name.toLowerCase().includes(text.toLowerCase()),
        ),
      };
    })
    .toEqual({ hasProducts: true, nonMatchingNames: [] });
}

test.describe('Toolshop', () => {
  test.beforeEach('open app', async ({ page }) => {
    await page.goto('https://practicesoftwaretesting.com');
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
});
