# Solflare Senior QA Engineer assignment

| Folder | Task | Tool |
| --- | --- | --- |
| [`e2e/`](./e2e) | 1. End-to-end test of wallet management on solflare.com | WebdriverIO 9 + Mocha (TypeScript) |

## Requirements

- Node.js 20 or newer
- Chrome and/or Firefox installed

Nothing else is needed. Browser drivers are downloaded automatically by WebdriverIO.

---

## Task 1: end-to-end test (WebdriverIO)

```bash
cd e2e
npm install
npm test                 # Chrome, headed
npm run test:headless    # Firefox, headless
```

### Choosing the browser and headless mode

The browser and headless mode are command line arguments:

```bash
npx wdio run ./wdio.conf.ts --browser firefox              # Firefox, headed
npx wdio run ./wdio.conf.ts --browser firefox --headless   # Firefox, headless
npx wdio run ./wdio.conf.ts --headless                     # Chrome, headless (see the note below)
npx wdio run ./wdio.conf.ts --browser chrome,firefox       # both browsers in one run
```

They can also be added to `npm test` after `--` (`npm test -- --browser firefox --headless`), and there are npm shortcuts:

| Command | Runs |
| --- | --- |
| `npm test` | Chrome, headed |
| `npm run test:headless` | Firefox, headless (see the note below) |
| `npm run test:firefox` | Firefox, headed |
| `npm run test:all` | Chrome and Firefox, headed |

> **Headless runs use Firefox, because solflare.com currently refuses headless Chrome.** The site answers headless Chrome with a bare `{"errors": ["Too many requests."]}` page before the app loads, on the very first request, while headed Chrome and Firefox (headed and headless) load normally from the same machine. The framework side works (`--headless` alone starts Chrome headless), and the test then stops with an error that says exactly this instead of a selector timeout. I did not disguise the browser to get around the site's protection, so `npm run test:headless` runs Firefox.

### What the test does

`test/specs/recoveryPhraseWallets.e2e.ts` follows the assignment steps one by one (each step is marked with a comment): it creates a new wallet, opens wallet management, opens "Show or hide wallets", checks that the first toggle is disabled and on, switches on the 3rd and 4th wallets and saves.

The final check compares **addresses**, not just the number of rows: before saving, the test reads the addresses of list items 1, 3 and 4, and after saving it expects the recovery phrase list to contain exactly those three wallets in that order.

### Structure

```
e2e/
├── wdio.conf.ts                  WebdriverIO configuration and hooks; reads --browser / --headless
├── config/
│   └── capabilities.ts           browser capabilities for Chrome and Firefox
└── test/
    ├── specs/                    the test
    ├── pageobjects/              page objects (only what the test needs)
    │   └── walletRow.ts          wallet row selector and address reader shared by two panels
    ├── data/testData.ts          test data
    └── utils/
        ├── logger.ts             winston logger (console + logs/test-run.log)
        └── screenshot.ts         screenshot on failure
```

### Bonus items

- **Cross-browser:** Chrome and Firefox, selected with `--browser`, one or both per run.
- **No local dependency:** only Node.js and the browser; drivers are managed by WebdriverIO.
- **Logger:** winston; every page action is logged to the console and to `e2e/logs/test-run.log`. Passwords are never logged.
- **Screenshot on failure:** a generic `afterTest` hook saves a screenshot of any failed test to `e2e/screenshots/`, named after the test, browser and time.
- **Command line:** browser and headless mode are command line arguments.

### Notes

- **The onboarding flow has changed since the assignment was written.** After "Get started" the site now shows an extra screen ("Create new wallet" / "Continue with Google") before the password form. The page object handles both variants, so the test passes with or without that screen.
- **Selectors** use the site's `data-testid` attributes, which are more stable than text or CSS classes.
- **The Terms checkbox is clicked the way a user clicks it.** The real `<input>` is covered by a styled box, so WebDriver refuses to click it. The test clicks the visible box (a `<label>` around the input) and then asserts on the input's state.
- **Node.js 26 is supported.** WebdriverIO unpacks the downloaded browser driver with a zip library (`yauzl` 2) that stops silently on Node 26, which ends the run before any test starts. `package.json` pins the fixed version (`yauzl` 3) through `overrides`.
- **The test is independent.** Every run starts in a clean browser profile and creates its own wallet, so nothing is shared between runs. The wallet password is a throwaway value.
