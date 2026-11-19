import { test, expect } from '@playwright/test';
import { WALLET_ADDRESSES, NETWORK } from './support/constants';
import { getTokens, postBalances, balancesBody } from './support/portfolioApi';

const [address] = WALLET_ADDRESSES;
const validBody = balancesBody(WALLET_ADDRESSES);

/**
 * Negative and edge cases: the API must reject bad input with a clear 4xx
 * response, never a 5xx and never a 200 with wrong data.
 */
test.describe('Tokens endpoint: validation and auth', () => {
  test('invalid wallet address is rejected with 400', async ({ request }) => {
    const response = await getTokens(request, 'not-a-valid-address', NETWORK);
    expect(response.status()).toBe(400);
    expect((await response.json()).message).toContain('Invalid public key');
  });

  test('unsupported network is rejected with 400', async ({ request }) => {
    const response = await getTokens(request, address, 'not-a-network');
    expect(response.status()).toBe(400);
    expect((await response.json()).message).toContain('network');
  });

  for (const network of ['devnet', 'testnet']) {
    test(`network "${network}" is accepted`, async ({ request }) => {
      const response = await getTokens(request, address, network);
      expect(response.status()).toBe(200);
      expect(Array.isArray((await response.json()).tokens)).toBe(true);
    });
  }

  test('token that is not a uuid4 is rejected with 403', async ({ request }) => {
    const response = await getTokens(request, address, NETWORK, { Authorization: 'Bearer not-a-uuid' });
    expect(response.status()).toBe(403);
  });

  test('uuid that is not version 4 is rejected with 403', async ({ request }) => {
    const uuidV1 = '11111111-1111-1111-1111-111111111111';
    const response = await getTokens(request, address, NETWORK, { Authorization: `Bearer ${uuidV1}` });
    expect(response.status()).toBe(403);
  });
});

test.describe('Balances endpoint: validation and auth', () => {
  test('missing pubkeys is rejected with 400', async ({ request }) => {
    // A property set to undefined is left out when the body is turned into JSON.
    const response = await postBalances(request, { ...validBody, pubkeys: undefined });
    expect(response.status()).toBe(400);
    expect((await response.json()).message).toContain('pubkeys');
  });

  test('address without the "1" prefix is rejected with 400', async ({ request }) => {
    const response = await postBalances(request, { ...validBody, pubkeys: WALLET_ADDRESSES });
    expect(response.status()).toBe(400);
  });

  test('unsupported currency is rejected with 422', async ({ request }) => {
    const response = await postBalances(request, { ...validBody, currency: 'xxx' });
    expect(response.status()).toBe(422);
  });

  test('unsupported network is rejected with 400', async ({ request }) => {
    const response = await postBalances(request, { ...validBody, network: 'not-a-network' });
    expect(response.status()).toBe(400);
  });

  test('token that is not a uuid4 is rejected with 403', async ({ request }) => {
    const response = await postBalances(request, validBody, { Authorization: 'Bearer not-a-uuid' });
    expect(response.status()).toBe(403);
  });
});

test.describe('Requests without an Authorization header', () => {
  // Clears the default headers from playwright.config.ts, so no Authorization header is sent.
  test.use({ extraHTTPHeaders: {} });

  test('tokens endpoint rejects the request with 403', async ({ request }) => {
    const response = await getTokens(request, address, NETWORK);
    expect(response.status()).toBe(403);
  });

  test('balances endpoint rejects the request with 403', async ({ request }) => {
    const response = await postBalances(request, validBody);
    expect(response.status()).toBe(403);
  });
});
