// The optional script: form-submit-guard.js
const { test, expect } = require('./fixtures/test');

// each of these must send exactly one request, however impatient the user is
const singleRequest = [
  ['double click', 'guard'],
  ['double click on a form added after page load', 'guardDynamic'],
  ['double click on a button outside the form that submits from code', 'guardOutsideButton'],
  ['double click on a button that submits from code and natively', 'guardScriptAndNative'],
  ['double click on a button with the form attribute', 'guardFormAttribute'],
  ['double click on an input of type submit', 'guardInput'],
];

for (const [title, name] of singleRequest) {
  test(`${title} sends one request`, async ({ open }) => {
    const t = await open(name);
    if (name === 'guardDynamic') await t.page.locator('#go').waitFor();
    await t.click('#go', 2);
    await t.settle();
    expect(t.requests('submit')).toHaveLength(1);
    await expect(t.page.locator('#done')).toBeVisible();
  });
}

test('click and then Enter sends one request', async ({ open }) => {
  const t = await open('guardStay');
  await t.click('#go');
  await t.pressEnterOn('#in');
  expect(t.requests('submit')).toHaveLength(1);
});

test('a spinner is shown while submitting', async ({ open }) => {
  const t = await open('guardStay');
  await t.click('#go');
  expect(await t.spinners()).toBe(1);
});

test('the name and value of the clicked button are submitted', async ({ open }) => {
  const t = await open('guard');
  await t.click('#go');
  await t.settle();
  expect(t.requests('submit')[0].body).toContain('act=go');
});

test('an invalid form is not locked', async ({ open }) => {
  const t = await open('guardRequired');
  await t.click('#go');
  expect(t.requests('submit')).toHaveLength(0);
  expect(await t.usable('#go')).toBe(true);
});

test('a submit cancelled by the page does not lock the form', async ({ open }) => {
  const t = await open('guardCancelled');
  await t.click('#go');
  expect(await t.usable('#go')).toBe(true);
});

test('an AJAX form stays usable', async ({ open }) => {
  const t = await open('guardAjax');
  await t.click('#go');
  await t.settle();
  expect(await t.usable('#go')).toBe(true);
  await t.click('#go');
  await t.settle();
  expect(t.requests('ajax')).toHaveLength(2);
});

for (const [title, name] of [['an opted out form', 'guardDownload'], ['a form with its own spinner', 'guardOwnSpinner']]) {
  test(`${title} can download twice`, async ({ open }) => {
    const t = await open(name);
    for (let i = 0; i < 2; i++) {
      await t.click('#go');
      await t.settle();
      expect(await t.usable('#go')).toBe(true);
    }
    expect(t.requests('download')).toHaveLength(2);
  });
}

test('the Back button restores a usable form', async ({ open }) => {
  const t = await open('guard');
  await t.page.evaluate(() => addEventListener('pageshow', e => { window.restored = e.persisted; }));
  await t.click('#go');
  await t.page.locator('#done').waitFor();
  await t.page.goBack({ waitUntil: 'commit' });
  await t.page.locator('#go').first().waitFor({ state: 'attached' });
  await t.page.waitForTimeout(300);

  const restored = await t.page.evaluate(() => window.restored === true);
  test.skip(!restored, 'this browser did not restore the page from its Back/forward cache');

  expect(await t.usable('#go')).toBe(true);
});

test('known limitation: a later document handler cannot cancel without locking the form', async ({ open }) => {
  test.fail();
  const t = await open('guardLateCancel');
  await t.click('#go');
  expect(await t.usable('#go')).toBe(true);
});
