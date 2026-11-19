# Solflare Senior QA Engineer assignment

Two small, independent test projects in one repository:

| Folder | Task | Tool |
| --- | --- | --- |
| [`e2e/`](./e2e) | 1. End-to-end test of wallet management on solflare.com | WebdriverIO 9 + Mocha (TypeScript) |
| [`api/`](./api) | 2. API tests for the portfolio endpoints | Playwright Test (TypeScript) |

Each folder has its own `package.json`, so the two tasks install and run separately.

## Requirements

- Node.js 20 or newer
- Chrome and/or Firefox installed (Task 1 only)

Nothing else is needed. Browser drivers are downloaded automatically by WebdriverIO, and the API tests need no browser at all.

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
    │   └── components/
    │       └── walletRow.ts      wallet row selector and address reader shared by two panels
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

---

## Task 2: API tests (Playwright Test)

```bash
cd api
npm install
npm test          # runs all tests, prints a list report
npm run report    # opens the HTML report of the last run
```

Run one file or one scenario:

```bash
npx playwright test portfolio-tokens
npx playwright test -g "Scenario 2"
```

**CI:** the API tests run in GitHub Actions ([`.github/workflows/api-tests.yml`](./.github/workflows/api-tests.yml)) on every push and pull request, once a day, and on demand from the Actions tab. The HTML report of each run is kept as a downloadable artifact. The E2E test is not run there, because solflare.com's bot protection is likely to refuse browsers coming from GitHub's servers.

**Authorization:** as the app does, the suite generates a uuid4 once per run and sends it as `Authorization: Bearer {uuid4}` on every request (`playwright.config.ts`).

### Test cases

**Scenario 1: total portfolio value** (`tests/portfolio-tokens.spec.ts`), run for both addresses from one data-driven test:

| # | Check |
| --- | --- |
| 1.1 | `GET /v3/portfolio/tokens/{address}?network=mainnet` returns 200 with a valid structure and no reported errors |
| 1.2 | `value.total` equals the sum of amount × price over all tokens |
| 1.3 | `value.total` equals `stocksValue.total + tokensValue.total` |
| 1.4 | `stocksValue.total` and `tokensValue.total` each equal the sum of their own tokens |

**Scenario 2: net worth** (`tests/portfolio-balances.spec.ts`):

| # | Check |
| --- | --- |
| 2.1 | `POST /v2/portfolio/balances` for both addresses returns 200 and lists exactly those two wallets |
| 2.2 | `netWorth` equals the sum of the total portfolio values from the tokens endpoint (Scenario 1) |
| 2.3 | `netWorth` equals the sum of the wallet values (balances endpoint only) |
| 2.4 | Each wallet value equals that wallet's total portfolio value |
| 2.5 | A single wallet's net worth equals its own value |
| 2.6 | In another currency (EUR), net worth still equals the sum of wallet values |
| 2.7 | An empty wallet list returns a net worth of 0 |

**Validation and authorization** (`tests/validation-and-auth.spec.ts`), for both endpoints:

| # | Check |
| --- | --- |
| 3.1 | Invalid wallet address → 400 |
| 3.2 | Unsupported network → 400 |
| 3.3 | `devnet` and `testnet` are accepted → 200 |
| 3.4 | Missing `pubkeys` → 400 |
| 3.5 | Address without the `1` prefix → 400 |
| 3.6 | Unsupported currency → 422 |
| 3.7 | Token that is not a uuid, or a uuid that is not version 4 → 403 |
| 3.8 | No `Authorization` header → 403 |

### Design decisions

- **Independent tests.** Scenario 2 needs the totals from Scenario 1, but it requests them itself instead of reusing another test's result. Any test can run alone or in parallel.
- **Two tolerances for money comparisons.** Values inside one response come from the same price snapshot, so they are compared with a tiny tolerance (`1e-6`, floating point rounding only). Values from different requests can be priced a moment apart on live data, so they are compared within one cent, and the requests are sent at the same time to keep that gap small. Both values are in `tests/support/constants.ts`.
- **No hard-coded amounts.** Prices change constantly, so the tests check that the numbers are consistent with each other, not that they equal a fixed value.
- **Tokens without a price count as 0.** Some tokens in the first wallet have no market price; they add nothing to the total, which matches what the API returns.
- **Readable failures and reports.** Each comparison prints both values and the difference when it fails, checks are grouped as named steps, and the raw response is attached to the HTML report.
- **One retry.** The suite runs against a live API, so one retry absorbs a network blip without hiding a real failure.

### Observations from testing

- The API also accepts the uuid4 **without** the `Bearer ` prefix. This may be intended, but it differs from the documented format.
- When the `network` query parameter is omitted, the tokens endpoint returns 200 (it appears to default to mainnet).
- An invalid token returns 403 with a plain-text body (`Invalid API key!`), while validation errors return JSON.

---

## With more time

- Run the E2E test in CI as well, once it is clear whether solflare.com accepts browsers from CI servers (or allow-lists test traffic).
- Add JSON schema validation for the two responses, to catch breaking changes in the API contract.
- Add more E2E checks around the same flow: hiding a wallet again, and that the selection is still there after a page reload.
