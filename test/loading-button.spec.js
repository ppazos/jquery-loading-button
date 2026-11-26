// The plugin alone: loading-button.js
const { test, expect } = require('./fixtures/test');

test('calling init twice makes one spinner', async ({ open }) => {
  const t = await open('pluginStay');
  await t.page.evaluate(() => $('#go').loading());
  await t.click('#go');
  expect(await t.spinners()).toBe(1);
});

test('init can be chained', async ({ open }) => {
  const t = await open('plugin');
  expect(await t.page.evaluate(() => $('<button>').loading().addClass('a').hasClass('a'))).toBe(true);
});

test('double click sends one request', async ({ open }) => {
  const t = await open('plugin');
  await t.click('#go', 2);
  await t.settle();
  expect(t.requests('submit')).toHaveLength(1);
});

test('click and then Enter sends one request', async ({ open }) => {
  const t = await open('pluginStay');
  await t.click('#go');
  await t.pressEnterOn('#in');
  expect(t.requests('submit')).toHaveLength(1);
  expect(await t.spinners()).toBe(1);
});

test('the name and value of the clicked button are submitted', async ({ open }) => {
  const t = await open('plugin');
  await t.click('#go');
  await t.settle();
  expect(t.requests('submit')[0].body).toContain('act=go');
});

test('start shows the spinner once, stop restores the button', async ({ open }) => {
  const t = await open('plugin');
  await t.page.evaluate(() => $('#go').loading('start').loading('start'));
  expect(await t.spinners()).toBe(1);
  expect(await t.usable('#go')).toBe(false);

  await t.page.evaluate(() => $('#go').loading('stop'));
  expect(await t.spinners()).toBe(0);
  expect(await t.usable('#go')).toBe(true);
});

test('stop leaves a hidden button hidden if it was not loading', async ({ open }) => {
  const t = await open('pluginHidden');
  await t.page.evaluate(() => $('#go').loading('stop'));
  await expect(t.page.locator('#go')).toBeHidden();
});

test('an invalid form shows no spinner and sends nothing', async ({ open }) => {
  const t = await open('pluginRequired');
  await t.click('#go');
  expect(await t.spinners()).toBe(0);
  expect(t.requests('submit')).toHaveLength(0);
});

for (const [attribute, name] of [['novalidate', 'pluginNovalidate'], ['formnovalidate', 'pluginFormnovalidate']]) {
  test(`${attribute} lets an invalid form submit`, async ({ open }) => {
    const t = await open(name);
    await t.click('#go');
    await t.settle();
    expect(t.requests('submit')).toHaveLength(1);
  });
}

test('an unknown method raises an error', async ({ open }) => {
  const t = await open('plugin');
  await expect(t.page.evaluate(() => $('#go').loading('nope'))).rejects.toThrow('does not exist');
});
