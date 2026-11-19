import type { APIRequestContext, APIResponse } from '@playwright/test';

/** Only the fields the tests rely on are typed; the API returns many more. */
export interface PortfolioToken {
  symbol: string;
  /** Human-readable amount held (already divided by the token's decimals). */
  totalUiAmount: number;
  isStock: boolean;
  /** Missing for tokens that have no market price. */
  price?: { price: number } | null;
}

export interface TokensResponse {
  tokens: PortfolioToken[];
  /** Total portfolio value. */
  value: { total: number };
  /** Value of regular tokens only. */
  tokensValue: { total: number };
  /** Value of tokenized stocks only. */
  stocksValue: { total: number };
  errors: unknown[];
}

type Headers = Record<string, string>;

/**
 * Thin wrappers around the two portfolio endpoints, so specs read like test cases.
 * They return the raw response without checking the status, because the negative
 * tests need to inspect error responses too.
 */

/** GET /v3/portfolio/tokens/{address}?network=... */
export function getTokens(
  request: APIRequestContext,
  address: string,
  network: string,
  headers?: Headers,
): Promise<APIResponse> {
  return request.get(`/v3/portfolio/tokens/${address}`, { params: { network }, headers });
}
