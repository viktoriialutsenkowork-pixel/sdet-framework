// Toolshop helpers: navigation, search, sorting and response checks.
import { expect, type Page, type Response } from '@playwright/test';

export type SortOption = 'Price (High - Low)' | 'Price (Low - High)';

export async function sortBy(page: Page, option: SortOption): Promise<void> {
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

export async function getAllProductPrices(page: Page): Promise<number[]> {
  const productPrices = await page.getByTestId('product-price').allTextContents();
  return productPrices.map((productPrice) => Number(productPrice.trim().replace('$', '')));
}

export async function searchFor(page: Page, searchWord: string): Promise<void> {
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

export async function expectOnlyProductsMatching(page: Page, text: string): Promise<void> {
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

export async function openHomePage(page: Page): Promise<void> {
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/products' && response.request().method() === 'QUERY',
  );
  await page.goto('/');
  await expectOkResponse(responsePromise);
}
