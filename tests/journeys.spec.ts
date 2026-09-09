import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});

test('missing pages retain 404 status and offer working recovery without JavaScript', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  try {
    const page = await context.newPage();
    const missingUrl = 'http://127.0.0.1:4321/missing/deep/page/?example=synthetic';
    const response = await page.goto(missingUrl);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
    await expect(page.locator('script[src*="plausible"]')).toHaveCount(0);
    for (const link of await page.locator('main a').all()) {
      const target = await link.getAttribute('href');
      expect(target).toMatch(/^\//);
      expect((await request.get(target!)).status()).toBe(200);
    }
    const head = await request.head(missingUrl);
    expect(head.status()).toBe(404);
    expect(await head.text()).toBe('');
    await page.getByRole('link', { name: 'Go to the home page', exact: true }).click();
    await expect(page).toHaveURL('http://127.0.0.1:4321/');
    await expect(page.locator('h1')).toBeVisible();
  } finally { await context.close(); }
});

async function fillForm(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('form')).toHaveAttribute('data-enhanced', 'true');
  await page.getByLabel('Your name').fill('Synthetic Test');
  await page.getByLabel('Email', { exact: true }).fill('synthetic@example.invalid');
  if (path === '/contact/') await page.getByLabel('Message', { exact: true }).fill('Synthetic enquiry for a local test only.');
  else await page.getByLabel('Preferred days & times').fill('Synthetic test availability');
}
for (const path of ['/contact/', '/book/']) {
  test(`${path} native validation sends nothing`, async ({ page }) => {
    let writes = 0;
    await page.route('https://formspree.io/**', route => { writes++; return route.abort(); });
    await page.goto(path);
    await expect(page.locator('form')).toHaveAttribute('data-enhanced', 'true');
    await page.locator('button[type=submit]').click();
    await expect(page.locator('input[name=name]')).toBeFocused();
    expect(writes).toBe(0);
  });
  for (const scenario of ['accepted', 'field', 'captcha', 'plan', 'server', 'invalid-json', 'unknown-success', 'network', 'timeout']) {
    test(`${path} ${scenario} response`, async ({ page }) => {
      let writes = 0;
      await page.route('https://formspree.io/**', async route => {
        writes++;
        expect(route.request().method()).toBe('POST');
        expect(route.request().headers().accept).toBe('application/json');
        if (scenario === 'network') return route.abort();
        if (scenario === 'timeout') { await new Promise(resolve => setTimeout(resolve, 16500)); return route.abort().catch(() => {}); }
        const status = scenario === 'field' ? 422 : ['captcha', 'plan'].includes(scenario) ? 403 : scenario === 'server' ? 500 : 200;
        const body = scenario === 'accepted' ? { ok: true, next: '/thanks' } : scenario === 'field' ? { errors: [{ field: 'email', code: 'TYPE_EMAIL', message: 'Please check your email address.' }] } : { errors: [{ code: scenario.toUpperCase(), message: 'Request rejected.' }] };
        return route.fulfill({ status, contentType: 'application/json', body: scenario === 'invalid-json' ? 'invalid{' : JSON.stringify(body) });
      });
      await fillForm(page, path);
      await page.locator('button[type=submit]').click();
      const status = page.locator('[data-form-status]');
      if (scenario === 'accepted') {
        await expect(status).toContainText('accepted');
        await expect(page.getByLabel('Your name')).toHaveValue('');
        if (path === '/book/') await expect(status).toContainText('not yet confirmed');
      } else {
        await expect(status).toContainText(scenario === 'field' || ['captcha', 'plan'].includes(scenario) ? 'could not be accepted' : 'could not confirm', { timeout: 20000 });
        await expect(page.getByLabel('Your name')).toHaveValue('Synthetic Test');
        await expect(page.getByLabel('Email', { exact: true })).toHaveValue('synthetic@example.invalid');
        if (scenario === 'field') { await expect(page.getByLabel('Email', { exact: true })).toBeFocused(); await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true'); }
      }
      await expect(page.locator('button[type=submit]')).toBeEnabled();
      expect(writes).toBe(1);
      expect(new URL(page.url()).pathname).toBe(path);
    });
  }
  test(`${path} corrected rejection can be manually retried`, async ({ page }) => {
    let writes = 0;
    await page.route('https://formspree.io/**', route => ++writes === 1 ? route.fulfill({ status: 422, json: { errors: [{ field: 'email', message: 'Please check this address.' }] } }) : route.fulfill({ json: { ok: true } }));
    await fillForm(page, path);
    await page.locator('button[type=submit]').click();
    await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await page.getByLabel('Email', { exact: true }).fill('corrected@example.invalid');
    await expect(page.getByLabel('Email', { exact: true })).not.toHaveAttribute('aria-invalid');
    await page.locator('button[type=submit]').click();
    await expect(page.locator('[data-form-status]')).toContainText('accepted');
    expect(writes).toBe(2);
  });
}
test('double submit is guarded; changes made while pending are retained', async ({ page }) => {
  let writes = 0;
  let accept!: () => void;
  const pending = new Promise<void>(resolve => { accept = resolve; });
  await page.route('https://formspree.io/**', async route => { writes++; await pending; await route.fulfill({ json: { ok: true } }); });
  await fillForm(page, '/contact/');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('button[type=submit]')).toBeDisabled();
  await page.locator('form').evaluate((el: HTMLFormElement) => el.requestSubmit());
  await page.getByLabel('Your name').fill('Newer synthetic entry');
  accept();
  await expect(page.locator('[data-form-status]')).toContainText('newer entries have been kept');
  await expect(page.getByLabel('Your name')).toHaveValue('Newer synthetic entry');
  expect(writes).toBe(1);
});
test('mobile menu keyboard, current page, skip link and desktop switch', async ({ page }) => {
  await page.goto('/about/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const summary = page.locator('summary');
  await expect(summary).toHaveAccessibleName('Menu');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.mobile-menu')).toHaveAttribute('open', '');
  await expect(summary).toHaveAccessibleName('Menu');
  await expect(page.locator('.mobile-menu a')).toHaveCount(6);
  await expect(page.locator('.mobile-menu a[aria-current=page]')).toHaveText('About');
  await page.keyboard.press('Tab');
  await expect(page.locator('.mobile-menu a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(summary).toBeFocused();
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
  await summary.click();
  await page.locator('.mobile-book').focus();
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
  await summary.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.desktop-links')).toBeVisible();
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
});
test('sticky dismissal persists within the browser session', async ({ page }) => {
  await page.goto('/about/');
  await page.evaluate(() => scrollTo(0, 700));
  await expect(page.locator('#sticky-book')).toBeVisible();
  await page.locator('#sticky-book button').click();
  await page.reload();
  await page.evaluate(() => scrollTo(0, 900));
  await expect(page.locator('#sticky-book')).toBeHidden();
});
test('sticky bar focus, dismissal, storage failure and reduced motion', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage unavailable'); } }); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/contact/');
  const bar = page.locator('#sticky-book');
  await expect(bar).toBeHidden();
  await bar.locator('a').evaluate((el: HTMLElement) => el.focus());
  await expect(bar.locator('a')).not.toBeFocused();
  await page.evaluate(() => scrollTo(0, 650));
  await expect(bar).toBeVisible();
  expect(await bar.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  await page.getByLabel('Email', { exact: true }).focus();
  await expect(bar).toBeHidden();
  await page.locator('h1').click();
  await page.evaluate(() => scrollTo(0, 700));
  await expect(bar).toBeVisible();
  await bar.getByRole('button').click();
  await expect(bar).toBeHidden();
  await page.evaluate(() => scrollTo(0, 900));
  await expect(bar).toBeHidden();
  await page.goto('/book/');
  await expect(page.locator('#sticky-book')).toHaveCount(0);
});
test('Portuguese fragments and form autocomplete', async ({ page }) => {
  await page.goto('/portugues/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
  await expect(page.locator('.site-header')).toHaveAttribute('lang', 'en');
  await expect(page.locator('footer')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#sticky-book')).toHaveAttribute('lang', 'pt');
  await page.goto('/about/');
  for (const link of await page.locator('a[href="/portugues"]').all()) await expect(link).toHaveAttribute('lang', 'pt');
  await page.goto('/contact/');
  for (const name of ['name', 'email', 'phone']) await expect(page.locator(`input[name=${name}]`)).toHaveAttribute('autocomplete', name === 'phone' ? 'tel' : name);
});

test('sticky booking never obscures a focused submit button or bottom-edge link', async ({ page }) => {
  await page.goto('/contact/');
  const bar = page.locator('#sticky-book');
  await page.getByLabel('Message', { exact: true }).focus();
  await expect(bar).toBeHidden();
  expect(await page.locator('html').evaluate(el => parseFloat(getComputedStyle(el).scrollPaddingBottom))).toBeGreaterThan(0);
  await page.keyboard.press('Tab');
  await expect(page.locator('button[type=submit]')).toBeFocused();
  await expect(bar).toBeHidden();
  const link = page.locator('footer a').last();
  await link.evaluate((el: HTMLElement) => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().bottom - window.innerHeight + 8);
  });
  await expect(bar).toBeVisible();
  await link.evaluate((el: HTMLElement) => el.focus({ preventScroll: true }));
  await expect(link).toBeFocused();
  await expect(bar).toBeVisible();
  const rect = await link.boundingBox();
  expect(rect!.y + rect!.height).toBeLessThanOrEqual((await bar.boundingBox())!.y);
});

test('sticky booking controls are reachable in both keyboard directions', async ({ page }) => {
  await page.goto('/about/');
  const bar = page.locator('#sticky-book');
  const lastLink = page.locator('footer a').last();
  await lastLink.focus();
  await expect(bar).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(bar.locator('a')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(bar.getByRole('button')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(bar.locator('a')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(lastLink).toBeFocused();
  await expect(bar).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(bar).toBeHidden();
  await expect(page.locator('#main-content')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(bar.locator('button')).not.toBeFocused();
});

test('sticky footer clearance adapts to mobile width, language and enlarged text', async ({ page }) => {
  for (const width of [320, 390]) for (const route of ['/about/', '/portugues/']) for (const size of ['100%', '200%']) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    await page.addStyleTag({ content: `html { font-size: ${size} !important; }` });
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const bar = page.locator('#sticky-book');
    await expect(bar).toBeVisible();
    await expect.poll(async () => {
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      const footer = await page.locator('footer').boundingBox();
      const reminder = await bar.boundingBox();
      return footer!.y + footer!.height <= reminder!.y - 8;
    }).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('sticky focus is preserved on scroll and recovered when switching to desktop', async ({ page }) => {
  await page.goto('/about/');
  const bar = page.locator('#sticky-book');
  await page.locator('footer a').last().focus();
  await expect(bar).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(bar.locator('a')).toBeFocused();
  await page.evaluate(() => scrollTo(0, 0));
  await expect(bar.locator('a')).toBeFocused();
  await expect(bar).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(bar).toBeHidden();
  await expect(page.locator('#main-content')).toBeFocused();
  expect(await page.locator('body').evaluate(el => parseFloat(getComputedStyle(el).paddingBottom))).toBe(0);
});

test('focused page links never pull manual scrolling back down', async ({ page, browserName }) => {
  await page.goto('/about/');
  const bar = page.locator('#sticky-book');
  const terms = page.locator('footer a').last();
  await terms.focus();
  await expect(bar).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(bar).toBeHidden();
  await expect(terms).toBeFocused();
  await terms.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }));
  await expect(bar).toBeVisible();
  const beforeWheel = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(beforeWheel - 300);
  const wheelPosition = await page.evaluate(() => new Promise<number>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(scrollY)))));
  expect(wheelPosition).toBeLessThan(beforeWheel - 300);
  await expect(terms).toBeFocused();
  // The failed popup retains click focus in Chromium/Firefox. WebKit uses its
  // native pointer-focus behaviour; the explicit keyboard case above runs there too.
  await page.goto('/about/');
  const popup = page.locator('[data-calendly-popup]').first();
  await popup.click();
  await expect(page.locator('[data-booking-fallback]').first()).toBeVisible();
  if (browserName !== 'webkit') await expect(popup).toBeFocused();
  await page.evaluate(() => scrollTo(0, 0));
  const finalPosition = await page.evaluate(() => new Promise<number>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(scrollY)))));
  expect(finalPosition).toBe(0);
});

test('unclearable fixed focus hides the reminder without observer errors or scroll loops', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/about/');
  await page.evaluate(() => scrollTo(0, 650));
  await expect(page.locator('#sticky-book')).toBeVisible();
  await page.evaluate(() => {
    const control = document.createElement('button');
    control.id = 'synthetic-fixed-control';
    control.textContent = 'Synthetic fixed control';
    control.style.cssText = 'position:fixed;bottom:0;left:0;width:180px;height:44px;z-index:60';
    document.body.append(control);
    control.focus({ preventScroll: true });
  });
  await expect(page.locator('#sticky-book')).toBeHidden();
  await expect(page.locator('#synthetic-fixed-control')).toBeFocused();
  const positions = await page.evaluate(() => new Promise<number[]>(resolve => {
    const values: number[] = [];
    const frame = () => { values.push(scrollY); values.length === 8 ? resolve(values) : requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }));
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(2);
  expect(Math.max(...positions)).toBeLessThan(900);
  expect(errors).toEqual([]);
});

test('explicit navigation links and native content links retain their documented keyboard behaviour', async ({ page, browserName }) => {
  await page.goto('/about/');
  const firstContentLink = page.locator('main a').first();
  expect(await firstContentLink.getAttribute('tabindex')).toBeNull();
  for (const link of await page.locator('footer a, #sticky-book a').all()) await expect(link).toHaveAttribute('tabindex', '0');
  await page.locator('.mobile-book').focus();
  await page.keyboard.press('Tab');
  if (browserName === 'webkit') await expect(page.locator('footer a').first()).toBeFocused();
  else await expect(firstContentLink).toBeFocused();
  // Content links remain native focusable anchors regardless of browser settings.
  await firstContentLink.focus();
  await expect(firstContentLink).toBeFocused();
});

test('empty status regions are exposed before updates; inline and popup statuses stay separate', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator('[data-form-status]')).toMatchAriaSnapshot('- status');
  await page.goto('/');
  await expect(page.locator('[data-booking-popup] [role=status]').first()).toMatchAriaSnapshot('- status');
  await page.goto('/book/');
  const inline = page.locator('[data-booking-inline]');
  const inlineStatus = inline.locator(':scope > [role=status]');
  await expect(inlineStatus).toMatchAriaSnapshot('- status');
  await inline.scrollIntoViewIfNeeded();
  await expect(inlineStatus).toContainText('could not load');
  await expect(inline.locator('[data-booking-popup] [role=status]')).toBeEmpty();
});
test('no JavaScript retains navigation, native form and booking alternatives', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/book/');
  await page.locator('summary').click();
  await expect(page.locator('.mobile-menu a')).toHaveCount(6);
  await expect(page.locator('.mobile-menu a').first()).toBeVisible();
  await expect(page.locator('form')).toHaveAttribute('action', 'https://formspree.io/f/xbdbrlrv');
  await expect(page.locator('form')).toHaveAttribute('method', 'POST');
  await expect(page.locator('[data-booking-inline] a').first()).toBeVisible();
  await expect(page.locator('[data-booking-host]')).toBeHidden();
  await context.close();
});
test('Calendly inline failure and retry; popup failure exposes alternatives', async ({ page }) => {
  await page.goto('/book/');
  await page.locator('[data-booking-inline]').scrollIntoViewIfNeeded();
  const retry = page.locator('[data-booking-retry]');
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(retry).toBeVisible();
  await expect(page.locator('[data-booking-inline]')).toContainText('could not load');
  await page.goto('/');
  await page.locator('[data-calendly-popup]').first().click();
  await expect(page.locator('[data-booking-fallback]').first()).toBeVisible();
});
test('Calendly shared concurrent load and repeated popup clicks', async ({ page }) => {
  let scripts = 0;
  await page.route('https://assets.calendly.com/**', async route => {
    if (!route.request().url().endsWith('.js')) return route.fulfill({ body: '', contentType: 'text/css' });
    scripts++;
    await new Promise(resolve => setTimeout(resolve, 600));
    return route.fulfill({ contentType: 'text/javascript', body: `window.testBookings={popup:0,inline:0};window.Calendly={initPopupWidget(){window.testBookings.popup++},initInlineWidget({parentElement}){window.testBookings.inline++;parentElement.textContent='Synthetic booking availability';}};` });
  });
  await page.goto('/book/');
  // This route has both consumers; hold the one asset load while both request it.
  await page.locator('[data-booking-inline]').scrollIntoViewIfNeeded();
  await page.locator('[data-calendly-popup]').first().evaluate((el: HTMLElement) => { el.click(); el.click(); });
  await expect(page.locator('[data-booking-host]')).toContainText('Synthetic booking availability');
  await expect.poll(() => page.evaluate(() => (window as any).testBookings)).toEqual({ popup: 1, inline: 1 });
  expect(scripts).toBe(1);
  await page.locator('[data-calendly-popup]').first().click();
  await expect.poll(() => page.evaluate(() => (window as any).testBookings.popup)).toBe(2);
  expect(scripts).toBe(1);
});
test('Calendly asset timeout gives a retry', async ({ page }) => {
  await page.route('https://assets.calendly.com/**', async route => { await new Promise(resolve => setTimeout(resolve, 11500)); await route.abort().catch(() => {}); });
  await page.goto('/book/');
  await page.locator('[data-booking-inline]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-booking-retry]')).toBeVisible({ timeout: 13000 });
});
test('Calendly stylesheet failure recovers on a manual retry', async ({ page }) => {
  let cssLoads = 0;
  await page.route('https://assets.calendly.com/**', route => {
    if (route.request().url().endsWith('.css')) return ++cssLoads === 1 ? route.abort() : route.fulfill({ contentType: 'text/css', body: '' });
    return route.fulfill({ contentType: 'text/javascript', body: `window.Calendly={initPopupWidget(){},initInlineWidget({parentElement}){parentElement.textContent='Synthetic booking availability'}};` });
  });
  await page.goto('/book/');
  await page.locator('[data-booking-inline]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-booking-retry]')).toBeVisible();
  await page.locator('[data-booking-retry]').click();
  await expect(page.locator('[data-booking-host]')).toContainText('Synthetic booking availability');
  expect(cssLoads).toBe(2);
});
