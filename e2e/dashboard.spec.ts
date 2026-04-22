import { test, expect, MOCK_TRANSACTIONS, MOCK_CATEGORIES, TEST_API_URL } from './fixtures';

test.describe('Dashboard', () => {
  test('renders the Dashboard heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10_000 });
  });

  test('shows income and expense summary cards', async ({ page }) => {
    await page.goto('/');

    // Wait for the dashboard to load past the skeleton
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10_000 });

    // The mock data has one INCOME (€3000) and one EXPENSE (€45.23)
    // Summary cards display these totals
    await expect(page.getByText(/3[,.]?000/)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/45[,.]?23/)).toBeVisible({ timeout: 8_000 });
  });

  test('shows navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10_000 });

    // Sidebar navigation (md+ viewport)
    await expect(page.getByRole('link', { name: 'Transactions' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Categories' })).toBeVisible();
  });

  test('navigates to transactions page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('link', { name: 'Transactions' }).first().click();
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 8_000,
    });
  });

  test('shows error state when API fails', async ({ page }) => {
    // Override the transactions route to simulate a server error
    await page.route(`${TEST_API_URL}/v1/transactions*`, (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' }),
    );

    await page.goto('/');

    // The ErrorBoundary or route errorComponent should show something
    // The app won't show Dashboard heading when data load fails
    await expect(page.getByRole('heading', { name: 'Dashboard' })).not.toBeVisible({
      timeout: 8_000,
    });
  });
});
