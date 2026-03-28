import { test, expect } from '@playwright/test';

test.describe('Garden home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('first slide is visible on load', async ({ page }) => {
    // The hero slide contains the couple names / wedding branding
    await expect(page.locator('.garden-slide').first()).toBeVisible();
  });

  test('garden container uses scroll-snap', async ({ page }) => {
    const snapType = await page.locator('.garden-wrap').evaluate((el) =>
      window.getComputedStyle(el).scrollSnapType,
    );
    // Should contain 'mandatory' or 'proximity' (landscape override)
    expect(snapType).toMatch(/mandatory|proximity/);
  });

  test('language switcher is visible', async ({ page }) => {
    // LanguageSwitcher renders EN / TR / UZ buttons
    const switcher = page.getByRole('button', { name: /EN|TR|UZ/i }).first();
    await expect(switcher).toBeVisible();
  });

  test('grain overlay CSS rule has normalised z-index (≤ 100)', async ({ page }) => {
    // .grain-overlay is only rendered inside InvitePage/PublicInvitePage, not on the
    // home page. Read the z-index directly from the loaded stylesheet instead.
    const zIndex = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule instanceof CSSStyleRule && rule.selectorText === '.grain-overlay') {
              return parseInt(rule.style.zIndex, 10);
            }
          }
        } catch { /* cross-origin sheet — skip */ }
      }
      return null;
    });
    // Old value was 9998; new value should be 99
    expect(zIndex).not.toBeNull();
    expect(zIndex!).toBeLessThanOrEqual(100);
  });

  test('scroll progress bar has normalised z-index (≤ 100)', async ({ page }) => {
    const zIndex = await page.locator('.scroll-progress').evaluate((el) =>
      parseInt(window.getComputedStyle(el).zIndex, 10),
    );
    // Old value was 9997; new value should be 98
    expect(zIndex).toBeLessThanOrEqual(100);
  });

  test('scrollbar is at least 6px wide (accessible grab target)', async ({ page }) => {
    // Inject a test div with overflow:scroll to measure the scrollbar track width
    const scrollbarWidth = await page.evaluate(() => {
      const el = document.createElement('div');
      el.style.cssText = 'width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px';
      document.body.appendChild(el);
      const width = el.offsetWidth - el.clientWidth;
      document.body.removeChild(el);
      return width;
    });
    // On macOS, overlay scrollbars report 0 — only assert when they're non-zero
    if (scrollbarWidth > 0) {
      expect(scrollbarWidth).toBeGreaterThanOrEqual(6);
    }
  });
});
