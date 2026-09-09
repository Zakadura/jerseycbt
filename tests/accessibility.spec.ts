import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
const routes: string[] = JSON.parse(readFileSync('.quality/routes.json', 'utf8'));
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});
for (const route of routes) {
  test(`${route} reflow and automated A/AA`, async ({ page }, info) => {
    await page.goto(route);
    await expect(page.locator('main#main-content')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, `${route} at ${width}`).toBeLessThanOrEqual(1);
      if ([390, 1440].includes(width)) {
        const boundaryContrast = await page.locator('form input[name="name"], form input[name="email"], form input[name="phone"], form textarea').evaluateAll(fields => {
          const luminance = (color: string) => {
            const values = (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number).map(value => { const channel = value / 255; return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4; });
            return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
          };
          return fields.map(field => { const style = getComputedStyle(field); const border = luminance(style.borderTopColor); const background = luminance(style.backgroundColor); return (Math.max(border, background) + .05) / (Math.min(border, background) + .05); });
        });
        for (const ratio of boundaryContrast) expect(ratio, 'Input boundary non-text contrast').toBeGreaterThanOrEqual(3);
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        await info.attach(`axe-${width}`, { body: JSON.stringify({ violations: result.violations, incomplete: result.incomplete }), contentType: 'application/json' });
        expect(result.violations).toEqual([]);
      }
    }
  });
}
test('open menu, failed form and enlarged text remain accessible', async ({ page }, info) => {
  await page.goto('/contact/');
  await page.locator('summary').click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await page.route('https://formspree.io/**', route => route.fulfill({ status: 422, json: { errors: [{ field: 'email', message: 'Please check this email address.' }] } }));
  await page.getByLabel('Your name').fill('Synthetic Test');
  await page.getByLabel('Email', { exact: true }).fill('synthetic@example.invalid');
  await page.getByLabel('Message', { exact: true }).fill('Synthetic test');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('[data-form-status]')).toContainText('could not be accepted');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  await info.attach('axe-failed-form', { body: JSON.stringify(result), contentType: 'application/json' });
  expect(result.violations).toEqual([]);
  for (const route of ['/about/', '/approach/', '/fees/', '/privacy/', '/terms/', '/portugues/', '/articles/what-is-cat/', '/what-i-treat/anxiety/']) {
    await page.goto(route);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), route).toBeLessThanOrEqual(1);
  }
});
