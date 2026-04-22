import { test, expect, MOCK_CATEGORIES, MOCK_TRANSACTIONS, TEST_API_URL } from './fixtures';

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('displays the transaction list', async ({ page }) => {
    await expect(page.getByText('Weekly groceries')).toBeVisible();
    await expect(page.getByText('Monthly salary')).toBeVisible();
  });

  test('opens the Add Transaction dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add Transaction' })).toBeVisible();
  });

  test('creates a new transaction', async ({ page }) => {
    const newTransaction = {
      id: 'tx-new-0000-0000-0001',
      description: 'Coffee',
      amount: 350,
      type: 'EXPENSE',
      currency: 'EUR',
      date: '2026-04-22',
      categoryId: MOCK_CATEGORIES[0].id,
    };

    // Mock POST /v1/transactions → return the new transaction
    await page.route(`${TEST_API_URL}/v1/transactions`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newTransaction),
        });
      }
      return route.continue();
    });

    // Mock the subsequent GET (cache invalidation after mutation)
    const updatedTransactions = {
      items: [...MOCK_TRANSACTIONS, newTransaction],
      meta: { page: 0, size: 20, total: MOCK_TRANSACTIONS.length + 1 },
    };
    await page.route(`${TEST_API_URL}/v1/transactions*`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(updatedTransactions),
        });
      }
      return route.continue();
    });

    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel('Description').fill('Coffee');
    await page.getByLabel('Amount').fill('3.50');

    // Select category
    await page.getByLabel('Category').selectOption({ label: 'Groceries' });

    await page.getByRole('button', { name: 'Save' }).click();

    // Dialog should close on success
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Coffee')).toBeVisible({ timeout: 8_000 });
  });

  test('shows validation feedback when required fields are missing', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Save with empty form — button should be disabled
    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeDisabled();
  });

  test('opens the edit dialog on transaction click', async ({ page }) => {
    // Mock GET /v1/transactions/{id} for the edit fetch
    await page.route(`${TEST_API_URL}/v1/transactions/${MOCK_TRANSACTIONS[0].id}`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(MOCK_TRANSACTIONS[0]),
        });
      }
      return route.continue();
    });

    // Click the edit button on the first transaction
    await page
      .getByText('Weekly groceries')
      .locator('../..')
      .getByRole('button')
      .first()
      .click();

    await expect(page.getByRole('heading', { name: 'Edit Transaction' })).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByLabel('Description')).toHaveValue('Weekly groceries');
  });

  test('deletes a transaction', async ({ page }) => {
    // Mock DELETE /v1/transactions/{id}
    await page.route(
      `${TEST_API_URL}/v1/transactions/${MOCK_TRANSACTIONS[0].id}`,
      (route) => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204, body: '' });
        }
        return route.continue();
      },
    );

    // Mock the edit GET so the form loads
    await page.route(
      `${TEST_API_URL}/v1/transactions/${MOCK_TRANSACTIONS[0].id}`,
      (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify(MOCK_TRANSACTIONS[0]),
          });
        }
        return route.continue();
      },
    );

    // Open edit dialog
    await page
      .getByText('Weekly groceries')
      .locator('../..')
      .getByRole('button')
      .first()
      .click();

    await expect(page.getByRole('heading', { name: 'Edit Transaction' })).toBeVisible({
      timeout: 8_000,
    });

    // Click delete (trash icon button has aria-label "Delete transaction")
    await page.getByRole('button', { name: 'Delete transaction' }).click();

    // Confirm in the confirmation dialog
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: /delete/i }).last().click();

    // Dialog closes and item is removed optimistically
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 8_000 });
  });

  test('closes the dialog when Cancel is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });
});
