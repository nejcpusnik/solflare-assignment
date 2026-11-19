import { expect } from '@playwright/test';
import type { PortfolioToken } from './portfolioApi';

/** Sum of a list of numbers. */
export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Sum of the values of the given tokens. The value of one token is amount held x price.
 * Tokens without a market price are worth 0 in the portfolio total.
 */
export function sumTokenValues(tokens: PortfolioToken[]): number {
  return sum(tokens.map((token) => token.totalUiAmount * (token.price?.price ?? 0)));
}

/**
 * Asserts two money values are equal within a tolerance and prints both
 * values and the difference when they are not.
 */
export function expectCloseTo(actual: number, expected: number, tolerance: number, description: string): void {
  const difference = Math.abs(actual - expected);
  expect(
    difference,
    `${description}: actual ${actual}, expected ${expected}, difference ${difference} (tolerance ${tolerance})`,
  ).toBeLessThanOrEqual(tolerance);
}
