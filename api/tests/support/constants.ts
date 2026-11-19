/** Wallet addresses given in the assignment. Both scenarios run against both of them. */
export const WALLET_ADDRESSES = [
  '96Y3j66AX16noUAAVriW8bmwTGzV1PVqBKCEArPd5fuU',
  '7eXxD3vQww9cgBgD3gb7iqTriAzAmCBXFBMpdDi71P3i',
] as const;

export const NETWORK = 'mainnet';
export const CURRENCY = 'usd';

/**
 * Values compared inside ONE response come from the same price snapshot,
 * so they may only differ by floating point rounding.
 */
export const SAME_RESPONSE_TOLERANCE = 1e-6;

/**
 * Values compared ACROSS requests (balances vs tokens endpoint) can be priced
 * a moment apart, so live prices may have moved slightly. One cent is far
 * above normal drift for these small wallets and far below any real bug.
 */
export const CROSS_REQUEST_TOLERANCE = 0.01;
