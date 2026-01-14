/**
 * Test Fixtures
 *
 * Common test data and fixture generators.
 */

import type { PieModel, PieSession } from '@pie-shared/types';
import { uuid } from '@pie-shared/utils';

/**
 * Create a basic PIE model for testing
 */
export function createTestModel(overrides?: Partial<PieModel>): PieModel {
  return {
    id: uuid(),
    element: '@pie-element/test',
    ...overrides,
  };
}

/**
 * Create a basic PIE session for testing
 */
export function createTestSession(overrides?: Partial<PieSession>): PieSession {
  return {
    id: uuid(),
    ...overrides,
  };
}

/**
 * Create multiple test models
 */
export function createTestModels(count: number, overrides?: Partial<PieModel>): PieModel[] {
  return Array.from({ length: count }, (_, i) =>
    createTestModel({
      id: `test-${i}`,
      ...overrides,
    })
  );
}

/**
 * Common test prompts
 */
export const testPrompts = {
  simple: 'What is the answer?',
  withHtml: '<p>What is the <strong>correct</strong> answer?</p>',
  withMath: 'Solve for x: $x^2 + 2x + 1 = 0$',
  multiline: `
    <p>Read the following passage:</p>
    <blockquote>This is a test passage.</blockquote>
    <p>Answer the question below:</p>
  `,
};

/**
 * Wait for a promise with timeout
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
}

/**
 * Sleep for testing
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
