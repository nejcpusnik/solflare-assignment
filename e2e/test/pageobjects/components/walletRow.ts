/**
 * Wallet rows look the same in the "My wallets" panel and in the "Show or hide wallets" panel:
 * each row carries a test id of the form "li-wallets-{full wallet address}".
 */
const WALLET_ROW_TEST_ID_PREFIX = 'li-wallets-';

export const WALLET_ROW_SELECTOR = `[data-testid^="${WALLET_ROW_TEST_ID_PREFIX}"]`;

/**
 * Reads the full wallet address from a row's test id.
 * The visible text cannot be used, because it is shortened (e.g. "AMPT...dcyM").
 */
export async function getWalletAddress(row: WebdriverIO.Element): Promise<string> {
  const testId = await row.getAttribute('data-testid');
  if (!testId) {
    throw new Error('Wallet row has no data-testid attribute, so its address cannot be read');
  }
  return testId.replace(WALLET_ROW_TEST_ID_PREFIX, '');
}
