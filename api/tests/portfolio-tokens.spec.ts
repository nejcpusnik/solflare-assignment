import { test, expect } from '@playwright/test';
import { WALLET_ADDRESSES, NETWORK, SAME_RESPONSE_TOLERANCE } from './support/constants';
import { sumTokenValues, expectCloseTo } from './support/calculations';
import { getTokens } from './support/portfolioApi';
import type { TokensResponse } from './support/portfolioApi';

/**
 * Test scenario 1: Total portfolio value validation.
 *
 * One data-driven test definition runs for every address, so each wallet
 * gets its own pass/fail line in the report.
 */
test.describe('Scenario 1: total portfolio value (GET /v3/portfolio/tokens/{address})', () => {
  for (const address of WALLET_ADDRESSES) {
    test(`total value is correct for ${address}`, async ({ request }, testInfo) => {
      // Steps 1 and 2: set network to mainnet, send the GET request.
      const response = await getTokens(request, address, NETWORK);
      expect(response.status(), 'tokens endpoint should respond with 200').toBe(200);

      const portfolio = (await response.json()) as TokensResponse;
      // Keep the raw response in the HTML report to make failures easy to analyse.
      await testInfo.attach('tokens-response.json', {
        body: JSON.stringify(portfolio, null, 2),
        contentType: 'application/json',
      });

      await test.step('response has the expected structure', async () => {
        expect(portfolio.tokens.length, 'wallet should hold at least one token').toBeGreaterThan(0);
        expect(portfolio.errors, 'API should not report partial errors').toEqual([]);
        for (const token of portfolio.tokens) {
          expect(token.totalUiAmount, `${token.symbol} amount should not be negative`).toBeGreaterThanOrEqual(0);
          if (token.price) {
            expect(token.price.price, `${token.symbol} price should not be negative`).toBeGreaterThanOrEqual(0);
          }
        }
      });

      await test.step('total value equals the sum of amount x price for every token', async () => {
        const calculatedTotal = sumTokenValues(portfolio.tokens);
        expectCloseTo(portfolio.value.total, calculatedTotal, SAME_RESPONSE_TOLERANCE, 'total portfolio value');
      });

      await test.step('total value equals stocks value + tokens value', async () => {
        const stocksPlusTokens = portfolio.stocksValue.total + portfolio.tokensValue.total;
        expectCloseTo(portfolio.value.total, stocksPlusTokens, SAME_RESPONSE_TOLERANCE, 'stocks + tokens value');
      });

      await test.step('stocks and tokens subtotals match their own tokens', async () => {
        const stocks = portfolio.tokens.filter((token) => token.isStock);
        const regularTokens = portfolio.tokens.filter((token) => !token.isStock);
        expectCloseTo(portfolio.stocksValue.total, sumTokenValues(stocks), SAME_RESPONSE_TOLERANCE, 'stocks value');
        expectCloseTo(
          portfolio.tokensValue.total,
          sumTokenValues(regularTokens),
          SAME_RESPONSE_TOLERANCE,
          'tokens value',
        );
      });
    });
  }
});
