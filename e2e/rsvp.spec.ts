import { test, expect } from '@playwright/test';
import { mockRsvpToken, mockPublicEvents, MOCK_RSVP_TOKEN_RESPONSE } from './fixtures/api-mocks';

const TOKEN = 'tok-alice-ankara';

test.describe('Personal RSVP flow (/invite/:token)', () => {
  test.beforeEach(async ({ page }) => {
    await mockRsvpToken(page, TOKEN);
    await page.goto(`/invite/${TOKEN}`);
  });

  test('page loads and shows guest name in hero', async ({ page }) => {
    const guestName = MOCK_RSVP_TOKEN_RESPONSE.guest.name;
    // Hero renders the guest name — use first() since the combined "Alice Smith & Bob Smith"
    // string also contains "Alice Smith", producing two matches.
    await expect(page.getByText(guestName, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('RSVP form has attendance picker (Attending / Declining / Maybe)', async ({ page }) => {
    // The hero must load first
    await expect(page.getByText(MOCK_RSVP_TOKEN_RESPONSE.guest.name, { exact: false }).first())
      .toBeVisible({ timeout: 15_000 });

    // AttendancePicker renders <label> + hidden <input type="radio"> — not <button>.
    // The radio inputs carry aria-label from EN translations:
    //   attendingOption='Attending', decliningOption='Declining', maybeOption='Maybe'
    // The RSVP slide starts at opacity:0 (Framer Motion) and reveals on scroll.
    // Scroll the garden-wrap container to bring the second slide into view first.
    await page.evaluate(() => {
      const wrap = document.querySelector('.garden-wrap');
      if (wrap) wrap.scrollTop = wrap.clientHeight;
    });

    await expect(page.getByRole('radio', { name: 'Attending' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('radio', { name: 'Declining' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Maybe' })).toBeVisible();
  });

  test('selecting Attending keeps guest count select visible', async ({ page }) => {
    await expect(page.getByText(MOCK_RSVP_TOKEN_RESPONSE.guest.name, { exact: false }).first())
      .toBeVisible({ timeout: 15_000 });

    // Scroll to RSVP slide to reveal the form
    await page.evaluate(() => {
      const wrap = document.querySelector('.garden-wrap');
      if (wrap) wrap.scrollTop = wrap.clientHeight;
    });

    await expect(page.getByRole('radio', { name: 'Attending' })).toBeVisible({ timeout: 10_000 });
    // The radio input is sr-only (1px, clipped). The parent <label> is the visual target.
    // Use force:true to bypass the span intercept actionability check.
    await page.getByRole('radio', { name: 'Attending' }).check({ force: true });
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('invite page uses light CSS variables (--bg is light)', async ({ page }) => {
    // Wait for the page to fully render
    await expect(page.locator('.invite-page')).toBeVisible({ timeout: 15_000 });

    const bg = await page.locator('.invite-page').evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('--bg').trim(),
    );
    // Light bg should be #FAF7F2 (starts with #F)
    expect(bg).toMatch(/^#[CDEF]/i);
  });
});

test.describe('Public RSVP page', () => {
  test.beforeEach(async ({ page }) => {
    await mockPublicEvents(page);
  });

  test('public invite page loads for a known event slug', async ({ page }) => {
    // Mock the public RSVP page data endpoint
    await page.route('**/api/rsvp/public-page', (route) =>
      route.fulfill({
        json: [
          {
            slug: 'ankara',
            name: 'Ankara',
            date: '2026-05-19T12:00:00.000Z',
            venue: "Park L'Amore",
          },
        ],
      }),
    );
    await page.goto('/invite/public/ankara');
    await expect(page.locator('body')).not.toContainText('404');
  });
});
