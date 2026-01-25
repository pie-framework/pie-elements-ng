/**
 * Common utilities for PIE elements
 */

import type { PieEnvironment, PieSession } from '@pie-element/shared-types';

/**
 * Simple debug logger factory
 * Replacement for the 'debug' npm package
 *
 * Usage:
 *   const log = debug('my-component');
 *   log('message', data); // Only logs if DEBUG environment includes 'my-component'
 */
export function debug(namespace: string): (...args: unknown[]) => void {
  // Check if debugging is enabled for this namespace
  const isEnabled = typeof process !== 'undefined' && process.env?.DEBUG?.includes(namespace);

  return (...args: unknown[]) => {
    if (isEnabled) {
      console.log(`[${namespace}]`, ...args);
    }
  };
}

/**
 * Check if session is empty
 */
export function isEmpty(session: PieSession | null | undefined): boolean {
  if (!session) return true;
  if (typeof session === 'object' && Object.keys(session).length === 0) return true;
  return false;
}

/**
 * Check if feedback should be shown based on mode and configuration
 */
export function showFeedback(env: PieEnvironment, feedbackEnabled: boolean): boolean {
  return env.mode === 'evaluate' && feedbackEnabled;
}

/**
 * Check if rationale should be shown based on mode and configuration
 */
export function showRationale(env: PieEnvironment, rationaleEnabled: boolean): boolean {
  return env.mode === 'evaluate' && rationaleEnabled && env.role === 'instructor';
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a random UUID (v4)
 */
export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffle<T>(array: T[], seed?: number): T[] {
  const result = [...array];
  const random = seed ? seededRandom(seed) : Math.random;

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Seeded random number generator (for consistent shuffling)
 */
function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export type AssignPropsOptions = {
  /**
   * When true (default), keys with `undefined` values are skipped.
   * This prevents accidentally overwriting existing values on the element.
   *
   * Note: `null` is still assigned (it is often a meaningful value).
   */
  skipUndefined?: boolean;
};

/**
 * Assign a set of JS properties onto a DOM element.
 *
 * This is the preferred way to pass values into our custom elements, especially
 * Svelte custom elements, where camelCase props do not map cleanly via HTML attributes.
 */
export function assignProps(
  node: HTMLElement,
  props: Record<string, unknown>,
  options: AssignPropsOptions = {}
): void {
  const { skipUndefined = true } = options;
  for (const [key, value] of Object.entries(props)) {
    if (skipUndefined && value === undefined) continue;
    (node as unknown as Record<string, unknown>)[key] = value;
  }
}
