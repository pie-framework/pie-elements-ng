/**
 * @pie-element/shared-feedback
 *
 * Feedback utilities for PIE elements
 * Provides utilities for getting feedback messages based on correctness levels
 *
 * Ported from @pie-lib/feedback with TypeScript types and improved structure
 */

export * from './types';
export * from './defaults';
export * from './utils';

import type { Correctness, Feedback, FeedbackConfig } from './types';
import { defaultFeedback } from './defaults';
import { normalizeCorrectness } from './utils';

/**
 * Get the feedback message for a specific correctness level (async)
 *
 * @param correctness - The correctness level ('correct', 'incorrect', 'partial', 'unanswered')
 * @param feedback - Partial feedback configuration (merged with defaults)
 * @returns Promise resolving to the feedback message or undefined if type is 'none'
 *
 * @example
 * ```ts
 * const message = await getFeedbackForCorrectness('correct', {
 *   correct: { type: 'custom', default: 'Correct', custom: 'Great job!' }
 * });
 * // Returns: 'Great job!'
 * ```
 */
export function getFeedbackForCorrectness(
  correctness: Correctness | 'partially-correct',
  feedback: Partial<Feedback> = {}
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const merged = { ...defaultFeedback, ...feedback };
    const normalized = normalizeCorrectness(correctness);
    const config = merged[normalized];
    const defaultConfig = defaultFeedback[normalized];

    getFeedback(config, defaultConfig[config.type as keyof FeedbackConfig] as string).then(resolve);
  });
}

/**
 * Get the feedback message from a feedback configuration (async)
 *
 * @param config - The feedback configuration
 * @param fallback - Fallback message if config type is not valid
 * @returns Promise resolving to the feedback message or undefined if type is 'none'
 */
export function getFeedback(
  config: FeedbackConfig,
  fallback: string
): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (!config || config.type === 'none') {
      resolve(undefined);
      return;
    }

    const message = (config[config.type as keyof FeedbackConfig] as string) || fallback;
    resolve(message);
  });
}

/**
 * Get the feedback message for a specific correctness level (synchronous)
 *
 * This is the recommended function to use for most cases as it's synchronous
 * and more predictable than the Promise-based version.
 *
 * @param correctness - The correctness level ('correct', 'incorrect', 'partial', 'unanswered')
 * @param feedback - Partial feedback configuration (merged with defaults)
 * @returns The feedback message or undefined if type is 'none'
 *
 * @example
 * ```ts
 * const message = getActualFeedbackForCorrectness('correct', {
 *   correct: { type: 'custom', default: 'Correct', custom: 'Great job!' }
 * });
 * // Returns: 'Great job!'
 * ```
 */
export function getActualFeedbackForCorrectness(
  correctness: Correctness | 'partially-correct',
  feedback: Partial<Feedback> = {}
): string | undefined {
  const merged = { ...defaultFeedback, ...feedback };
  const normalized = normalizeCorrectness(correctness);
  const config = merged[normalized];
  const defaultConfig = defaultFeedback[normalized];

  return getActualFeedback(config, defaultConfig[config.type as keyof FeedbackConfig] as string);
}

/**
 * Get the feedback message from a feedback configuration (synchronous)
 *
 * @param config - The feedback configuration
 * @param fallback - Fallback message if config type is not valid
 * @returns The feedback message or undefined if type is 'none'
 */
export function getActualFeedback(
  config: FeedbackConfig,
  fallback: string
): string | undefined {
  if (!config || config.type === 'none') {
    return undefined;
  }

  return (config[config.type as keyof FeedbackConfig] as string) || fallback;
}
