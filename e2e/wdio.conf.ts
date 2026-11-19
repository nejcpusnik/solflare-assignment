import { parseArgs } from 'node:util';
import { buildCapability } from './config/capabilities.js';
import logger from './test/utils/logger.js';
import { saveFailureScreenshot } from './test/utils/screenshot.js';

// Run options from the command line, e.g.:
//   npx wdio run ./wdio.conf.ts --browser firefox --headless
//   npx wdio run ./wdio.conf.ts --browser chrome,firefox
// "strict: false" lets WebdriverIO's own arguments (such as "run" or "--spec") pass through.
const { values: cliOptions } = parseArgs({
  options: {
    browser: { type: 'string', default: 'chrome' },
    headless: { type: 'boolean', default: false },
  },
  strict: false,
});
const browserNames = String(cliOptions.browser).toLowerCase().split(',');
const headless = cliOptions.headless === true;

export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./test/specs/**/*.ts'],

  // One capability per requested browser, so the same test runs on each of them.
  // Browser drivers are downloaded automatically by WebdriverIO,
  // so nothing has to be installed on the machine except Node.js and the browser.
  capabilities: browserNames.map((browserName) => buildCapability(browserName, headless)),
  // On Linux, WebdriverIO wraps headless runs in a virtual display (xvfb-run) by default.
  // Headless browsers do not need one, and the wrapper breaks the worker's connection
  // to the launcher on GitHub's Ubuntu runners, so the test never starts.
  autoXvfb: false,

  baseUrl: 'https://solflare.com',
  logLevel: 'warn',
  waitforTimeout: 15_000,

  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    timeout: 120_000,
  },

  beforeTest: function (test) {
    logger.info(`START: ${test.parent} - ${test.title}`);
  },

  // Generic failure handling: every failed test gets a screenshot, whatever the spec.
  afterTest: async function (test, _context, { passed, error }) {
    if (passed) {
      logger.info(`PASSED: ${test.title}`);
      return;
    }
    logger.error(`FAILED: ${test.title} - ${error?.message ?? 'unknown error'}`);
    await saveFailureScreenshot(test.title);
  },
};
