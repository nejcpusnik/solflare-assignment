import { test, expect } from '@playwright/test';
import { WALLET_ADDRESSES, NETWORK, SAME_RESPONSE_TOLERANCE, CROSS_REQUEST_TOLERANCE } from './support/constants';
import { sum, expectCloseTo } from './support/calculations';
import { getTokens, postBalances, balancesBody } from './support/portfolioApi';
import type { BalancesResponse, TokensResponse } from './support/portfolioApi';

/**
 * Test scenario 2: Balances endpoint validation.
 *
 * The test fetches the token portfolios itself instead of reusing results
 * from scenario 1, so it stays independent and can run on its own.
 */
test.describe('Scenario 2: net worth (POST /v2/portfolio/balances)', () => {
  test('net worth matches the portfolio totals and the sum of wallet values', async ({ request }, testInfo) => {
    // Send all requests at the same moment so they are priced as close together as possible.
    const [balancesResponse, ...tokensResponses] = await Promise.all([
      postBalances(request, balancesBody(WALLET_ADDRESSES)),
      ...WALLET_ADDRESSES.map((address) => getTokens(request, address, NETWORK)),
    ]);

    expect(balancesResponse.status(), 'balances endpoint should respond with 200').toBe(200);
    for (const tokensResponse of tokensResponses) {
      expect(tokensResponse.status(), 'tokens endpoint should respond with 200').toBe(200);
    }

    const balances = (await balancesResponse.json()) as BalancesResponse;
    const portfolios = (await Promise.all(tokensResponses.map((r) => r.json()))) as TokensResponse[];
    await testInfo.attach('balances-response.json', {
      body: JSON.stringify(balances, null, 2),
      contentType: 'application/json',
    });

    await test.step('response lists exactly the requested wallets', async () => {
      const returnedKeys = balances.data.map((wallet) => wallet.publicKey).sort();
      expect(returnedKeys).toEqual([...WALLET_ADDRESSES].sort());
    });

    await test.step('net worth equals the sum of total portfolio values from the tokens endpoint', async () => {
      const portfolioTotals = sum(portfolios.map((portfolio) => portfolio.value.total));
      expectCloseTo(balances.netWorth, portfolioTotals, CROSS_REQUEST_TOLERANCE, 'net worth vs portfolio totals');
    });

    await test.step('net worth equals the sum of the wallet values (balances endpoint only)', async () => {
      const walletValues = sum(balances.data.map((wallet) => wallet.value));
      expectCloseTo(balances.netWorth, walletValues, SAME_RESPONSE_TOLERANCE, 'net worth vs wallet values');
    });

    await test.step('each wallet value matches its own total portfolio value', async () => {
      WALLET_ADDRESSES.forEach((address, index) => {
        const wallet = balances.data.find((entry) => entry.publicKey === address);
        expect(wallet, `wallet ${address} should be in the response`).toBeDefined();
        expectCloseTo(
          wallet!.value,
          portfolios[index].value.total,
          CROSS_REQUEST_TOLERANCE,
          `wallet value for ${address}`,
        );
      });
    });
  });

  test('a single wallet has a net worth equal to its own value', async ({ request }) => {
    const [address] = WALLET_ADDRESSES;
    const response = await postBalances(request, balancesBody([address]));
    expect(response.status()).toBe(200);

    const balances = (await response.json()) as BalancesResponse;
    expect(balances.data).toHaveLength(1);
    expect(balances.data[0].publicKey).toBe(address);
    expectCloseTo(balances.netWorth, balances.data[0].value, SAME_RESPONSE_TOLERANCE, 'single wallet net worth');
  });

  test('net worth in another currency (EUR) still equals the sum of wallet values', async ({ request }) => {
    const response = await postBalances(request, { ...balancesBody(WALLET_ADDRESSES), currency: 'eur' });
    expect(response.status()).toBe(200);

    const balances = (await response.json()) as BalancesResponse;
    const walletValues = sum(balances.data.map((wallet) => wallet.value));
    expectCloseTo(balances.netWorth, walletValues, SAME_RESPONSE_TOLERANCE, 'EUR net worth vs wallet values');
  });

  test('an empty wallet list returns a net worth of zero', async ({ request }) => {
    const response = await postBalances(request, balancesBody([]));
    expect(response.status()).toBe(200);

    const balances = (await response.json()) as BalancesResponse;
    expect(balances.netWorth).toBe(0);
    expect(balances.data).toEqual([]);
  });
});
