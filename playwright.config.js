const { defineConfig, devices } = require('@playwright/test');

// every browser runs the whole suite once per supported jQuery version
const jqueryPackages = ['jquery-3.4', 'jquery-3.7', 'jquery-4'];

const browsers = {
  chromium: {
    ...devices['Desktop Chrome'],
    // the full browser with the Back/forward cache enabled, needed by the Back button test
    channel: 'chromium',
    launchOptions: { ignoreDefaultArgs: ['--disable-back-forward-cache'] },
  },
  firefox: { ...devices['Desktop Firefox'] },
};

module.exports = defineConfig({
  testDir: './test',
  fullyParallel: true,
  reporter: 'list',
  projects: Object.entries(browsers).flatMap(([browser, use]) =>
    jqueryPackages.map(jqueryPackage => ({
      name: `${browser}-${jqueryPackage}`,
      use: { ...use, jqueryPackage },
    }))
  ),
});
