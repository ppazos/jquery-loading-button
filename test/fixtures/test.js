// Shared fixtures and helpers.
const base = require('@playwright/test');
const { start, DELAY } = require('./server');

const test = base.test.extend({
  jqueryPackage: ['jquery-3.7', { option: true }],

  server: [async ({}, use) => {
    const running = await start();
    await use(running);
    running.close();
  }, { scope: 'worker' }],

  // opens a test page and returns helpers bound to it
  open: async ({ page, server, jqueryPackage }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await use(async name => {
      await page.goto(`${server.url}/page/${name}?jquery=${jqueryPackage}`);
      server.hits.length = 0;

      return {
        page,
        // raw mouse clicks on the same screen spot, like an impatient user
        async click(selector, times = 1) {
          const box = await page.locator(selector).first().boundingBox();
          for (let i = 0; i < times; i++) {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            await page.waitForTimeout(120);
          }
        },
        async pressEnterOn(selector) {
          await page.evaluate(s => document.querySelector(s).focus(), selector);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(120);
        },
        // true when the user can see and press the button
        usable: selector => page.evaluate(s => {
          const button = document.querySelector(s + ':not(.loading-button-clone)');
          return !!button && button.offsetParent !== null && !button.disabled;
        }, selector),
        spinners: () => page.locator('.loading-button-clone').count(),
        requests: path => server.hits.filter(hit => hit.path === path),
        // waits long enough for the slow server to answer
        settle: () => page.waitForTimeout(DELAY + 500),
      };
    });

    base.expect(errors, 'JavaScript errors in the page').toEqual([]);
  },
});

module.exports = { test, expect: base.expect };
