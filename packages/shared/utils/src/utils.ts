/**
 * Common utilities for PIE elements
 */

import type { PieEnvironment, PieSession } from '@pie-shared/types';

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
