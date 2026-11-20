import { test, expect } from '@playwright/test';

test.use({ testIdAttribute: 'data-test' });

test.describe('Toolshop', () => {
  test.beforeEach('open app', async ({ page }) => {
    await page.goto('https://practicesoftwaretesting.com');
  });

  test('shows matching products when searching by name', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: 'Search' });
    const searchButton = page.getByRole('button', { name: 'Search' });
    const searchWord = 'pliers';
    const searchResultCountLabel = page.getByTestId('search-result-count'); //found by id as no role/label/placeholder can be used here
    const productName = page.getByTestId('product-name');

    await searchInput.fill(searchWord);
    await searchButton.click();
    await expect(searchResultCountLabel).toContainText(`products found for '${searchWord}'`);
    await expect(productName).not.toHaveCount(0);
    await expect(productName.first()).toContainText(searchWord, { ignoreCase: true });
  });

  test('shows only hammers when the Hammer filter is applied', async ({ page }) => {
    const categoryName = 'Hammer';
    const categoryPattern = new RegExp(categoryName, 'i');
    const categoryCheckbox = page.getByRole('checkbox', { name: categoryName });
    const productNames = page.getByTestId('product-name');

    await categoryCheckbox.check();
    await expect(categoryCheckbox).toBeChecked();

    // Every product in the Hammer category has "hammer" in its name (any case,
    // sometimes inside a word like "Sledgehammer"), so a name check is meaningful.
    // The list must also be non-empty: "every" is true for an empty list.
    await expect
      .poll(async () => {
        const names = (await productNames.allTextContents()).map((name => name.trim()));
        return {
          hasProducts: names.length > 0,
          nonMatchingNames: names.filter((name) => !categoryPattern.test(name)),
        };
      })
      .toEqual({
        hasProducts: true,
        nonMatchingNames: [],
      });
  });
});
