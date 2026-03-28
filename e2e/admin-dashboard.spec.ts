import { test, expect } from '@playwright/test';
import { mockAdminApi, MOCK_GUESTS } from './fixtures/api-mocks';

test.describe('Admin dashboard — guest table', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto('/admin');
  });

  // ── Copy link label ──────────────────────────────────────────────────────────

  test('copy button visible text is "Copy invite link" (not "Copy link")', async ({ page }) => {
    await expect(page.getByText(MOCK_GUESTS[0].name)).toBeVisible();

    // Match by visible text content — aria-label says "Copy personal invite link for …"
    // so getByRole name-matching won't work; use getByText on the button's text node.
    const copyButton = page.locator('button').filter({ hasText: 'Copy invite link' }).first();
    await expect(copyButton).toBeVisible();

    // Old short label must not appear as button text
    const oldLabel = page.locator('button').filter({ hasText: /^Copy link$/ });
    await expect(oldLabel).toHaveCount(0);
  });

  // ── Action icon visibility ───────────────────────────────────────────────────

  test('row action icons are visible at reduced opacity (not hidden)', async ({ page }) => {
    await expect(page.getByText(MOCK_GUESTS[0].name)).toBeVisible();

    const editButton = page.getByRole('button', {
      name: `Edit contact info for ${MOCK_GUESTS[0].name}`,
    });
    await expect(editButton).toBeVisible();

    // The button must NOT have opacity:0 — it should have a non-zero computed opacity
    const opacity = await editButton.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity),
    );
    expect(opacity).toBeGreaterThan(0);
  });

  test('delete button is visible and accessible for each guest', async ({ page }) => {
    await expect(page.getByText(MOCK_GUESTS[0].name)).toBeVisible();

    const deleteButton = page.getByRole('button', {
      name: `Delete ${MOCK_GUESTS[0].name}`,
    });
    await expect(deleteButton).toBeVisible();

    const opacity = await deleteButton.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity),
    );
    expect(opacity).toBeGreaterThan(0);
  });

  // ── Headcount tooltip ────────────────────────────────────────────────────────

  test('headcount stat has a title tooltip explaining +1s', async ({ page }) => {
    // The element with title containing headcount hint
    const headcountEl = page.locator('[title*="partners"], [title*="partner"], [title*="guest counts"], [title*="Headcount"], [title*="headcount"]');
    await expect(headcountEl.first()).toBeVisible();

    const title = await headcountEl.first().getAttribute('title');
    expect(title).toBeTruthy();
    expect(title!.length).toBeGreaterThan(10);
  });

  // ── Sorting ──────────────────────────────────────────────────────────────────

  test('clicking Name column header sorts the table', async ({ page }) => {
    await expect(page.getByText(MOCK_GUESTS[0].name)).toBeVisible();

    const nameHeader = page.getByRole('button', { name: /sort by name/i });
    await expect(nameHeader).toBeVisible();

    // Click to sort ascending
    await nameHeader.click();
    const headerEl = page.getByRole('columnheader', { name: /name/i });
    await expect(headerEl).toHaveAttribute('aria-sort', 'ascending');

    // Click again to sort descending
    await nameHeader.click();
    await expect(headerEl).toHaveAttribute('aria-sort', 'descending');
  });

  // ── Guest rows render ────────────────────────────────────────────────────────

  test('renders all mocked guests', async ({ page }) => {
    for (const guest of MOCK_GUESTS) {
      await expect(page.getByText(guest.name)).toBeVisible();
    }
  });
});

test.describe('Admin dashboard — stats card', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page);
    await page.goto('/admin');
  });

  test('shows invited count', async ({ page }) => {
    // Total invited across both events = 10 + 8 = 18
    await expect(page.getByText('18')).toBeVisible();
  });

  test('shows Invited and Headcount labels', async ({ page }) => {
    await expect(page.getByText('Invited', { exact: false })).toBeVisible();
    await expect(page.getByText('Headcount', { exact: false })).toBeVisible();
  });
});
