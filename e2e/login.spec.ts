import { test, expect } from '@playwright/test';

test.describe('Admin login page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth check to return 401 so we stay on the login page
    await page.route('**/api/admin/me', (route) =>
      route.fulfill({ status: 401, json: { error: 'Unauthorized' } }),
    );
    await page.goto('/admin/login');
  });

  test('renders sign-in form with username and password fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('shows "Forgot password? Contact administrator." hint below submit button', async ({ page }) => {
    await expect(page.getByText('Forgot password? Contact administrator.')).toBeVisible();
  });

  test('username field has placeholder "admin"', async ({ page }) => {
    await expect(page.getByLabel('Username')).toHaveAttribute('placeholder', 'admin');
  });

  test('shows validation errors when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    // Zod validation fires client-side — at least one error message should appear
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test('shows error alert on invalid credentials', async ({ page }) => {
    await page.route('**/api/admin/login', (route) =>
      route.fulfill({ status: 401, json: { error: 'Invalid credentials' } }),
    );

    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Invalid credentials. Please try again.')).toBeVisible();
  });

  test('redirects to /admin on successful login', async ({ page }) => {
    // First call (auth check) returns 401; second call (login POST) returns 200
    await page.route('**/api/admin/login', (route) =>
      route.fulfill({ status: 200, json: { success: true } }),
    );
    // After login success, the app re-fetches /me — return 200 this time
    let meCalls = 0;
    await page.route('**/api/admin/me', (route) => {
      meCalls++;
      return meCalls === 1
        ? route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
        : route.fulfill({ json: { id: 1, username: 'admin' } });
    });

    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('correct');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/admin$/);
  });
});
