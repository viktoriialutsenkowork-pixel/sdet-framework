import {test, expect} from '@playwright/test';

test.use({ testIdAttribute: 'data-test' });

test.describe('Toolshop', () => {
    test.beforeEach('open app', async ({page}) => {
        await page.goto("https://practicesoftwaretesting.com");
    });

    test('shows matching products when searching by name', async ({page}) => {
        const searchInput = page.getByRole('textbox',{name: 'Search'});
        const searchButton = page.getByRole('button', {name: 'Search'});
        const searchWord = 'pliers';
        const searchResultCountLabel = page.getByTestId('search-result-count'); //found by id as no role/label/placeholder can be used here
        const productName = page.getByTestId('product-name');

        await searchInput.fill(searchWord);
        await searchButton.click();
        await expect(searchResultCountLabel).toContainText(`products found for '${searchWord}'`);
        await expect(productName).not.toHaveCount(0);
        await expect(productName.first()).toContainText(searchWord, {ignoreCase: true});
    });
})