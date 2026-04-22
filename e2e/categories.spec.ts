import { test, expect, MOCK_CATEGORIES, TEST_API_URL } from './fixtures';

test.describe('Categories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/categories');
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('displays the category list', async ({ page }) => {
    await expect(page.getByText('Groceries')).toBeVisible();
    await expect(page.getByText('Transport')).toBeVisible();
  });

  test('opens the Add Category dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Category' })).toBeVisible();
  });

  test('creates a new category', async ({ page }) => {
    const newCategory = { id: 'cat-new-0000-0001', name: 'Entertainment' };

    // Mock POST /v1/categories
    await page.route(`${TEST_API_URL}/v1/categories`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newCategory),
        });
      }
      return route.continue();
    });

    // Mock the GET after mutation (cache invalidation)
    const updatedCategories = {
      items: [...MOCK_CATEGORIES, newCategory],
      meta: { page: 0, size: 200, total: MOCK_CATEGORIES.length + 1 },
    };
    await page.route(`${TEST_API_URL}/v1/categories*`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(updatedCategories),
        });
      }
      return route.continue();
    });

    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Name').fill('Entertainment');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Entertainment')).toBeVisible({ timeout: 8_000 });
  });

  test('does not submit an empty category name', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const saveButton = page.getByRole('dialog').getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeDisabled();
  });

  test('edits an existing category', async ({ page }) => {
    const updatedCategory = { ...MOCK_CATEGORIES[0], name: 'Food & Groceries' };

    // Mock PATCH /v1/categories/{id}
    await page.route(`${TEST_API_URL}/v1/categories/${MOCK_CATEGORIES[0].id}`, (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(updatedCategory),
        });
      }
      return route.continue();
    });

    // Mock GET after update
    await page.route(`${TEST_API_URL}/v1/categories*`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            items: [updatedCategory, MOCK_CATEGORIES[1]],
            meta: { page: 0, size: 200, total: 2 },
          }),
        });
      }
      return route.continue();
    });

    // Click the edit button on the Groceries row
    await page
      .getByText('Groceries')
      .locator('../..')
      .getByRole('button', { name: /edit/i })
      .click();

    await expect(page.getByRole('dialog')).toBeVisible();

    const nameInput = page.getByRole('dialog').getByRole('textbox');
    await nameInput.clear();
    await nameInput.fill('Food & Groceries');

    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Food & Groceries')).toBeVisible({ timeout: 8_000 });
  });

  test('deletes a category after confirmation', async ({ page }) => {
    // Mock DELETE
    await page.route(
      `${TEST_API_URL}/v1/categories/${MOCK_CATEGORIES[0].id}`,
      (route) => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204, body: '' });
        }
        return route.continue();
      },
    );

    // Mock GET after delete
    await page.route(`${TEST_API_URL}/v1/categories*`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            items: [MOCK_CATEGORIES[1]],
            meta: { page: 0, size: 200, total: 1 },
          }),
        });
      }
      return route.continue();
    });

    await page
      .getByText('Groceries')
      .locator('../..')
      .getByRole('button', { name: /delete/i })
      .click();

    // Confirm in the confirmation dialog
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('alertdialog').getByRole('button', { name: /delete/i }).click();

    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Groceries')).not.toBeVisible({ timeout: 8_000 });
  });

  test('closes the dialog when Cancel is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });
});
